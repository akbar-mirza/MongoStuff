package services

import (
	"context"
	"math"
	global "mongostuff/src/globals"
	"mongostuff/src/interfaces"
	"mongostuff/src/libs"
	"sort"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

const analyticsMonthMs = int64(30 * 24 * 60 * 60 * 1000)

// ====[Response Types]====

type AnalyticsBackupStats struct {
	Total         int64 `json:"total"`
	Success       int64 `json:"success"`
	Failed        int64 `json:"failed"`
	StoredBytes   int64 `json:"storedBytes"`
	AvgSizeBytes  int64 `json:"avgSizeBytes"`
	AvgDurationMs int64 `json:"avgDurationMs"`
}

type AnalyticsSnapshotStats struct {
	Total       int64 `json:"total"`
	Success     int64 `json:"success"`
	Failed      int64 `json:"failed"`
	StoredBytes int64 `json:"storedBytes"`
}

type AnalyticsMonthlyPoint struct {
	Month         string `json:"month"` // YYYY-MM
	BackupBytes   int64  `json:"backupBytes"`
	SnapshotBytes int64  `json:"snapshotBytes"`
	BackupCount   int64  `json:"backupCount"`
	SnapshotCount int64  `json:"snapshotCount"`
}

type AnalyticsPolicyProjection struct {
	BackupPolicyID        string  `json:"backupPolicyID"`
	Name                  string  `json:"name"`
	Status                string  `json:"status"`
	Interval              int     `json:"interval"`
	TimeUnit              string  `json:"timeUnit"`
	RetentionDays         int     `json:"retentionDays"`
	RunsPerMonth          float64 `json:"runsPerMonth"`
	AvgBackupBytes        int64   `json:"avgBackupBytes"`
	CurrentStoredBytes    int64   `json:"currentStoredBytes"`
	MonthlyTransferBytes  int64   `json:"monthlyTransferBytes"`
	ProjectedStorageBytes int64   `json:"projectedStorageBytes"`
	SteadyStateBytes      int64   `json:"steadyStateBytes"` // 0 = unbounded growth (no retention)
	HasSizeData           bool    `json:"hasSizeData"`
}

type AnalyticsGrowthPoint struct {
	Month        string `json:"month"` // YYYY-MM
	StorageBytes int64  `json:"storageBytes"`
}

type AnalyticsProjectionTotals struct {
	ActivePolicies        int     `json:"activePolicies"`
	RunsPerMonth          float64 `json:"runsPerMonth"`
	MonthlyTransferBytes  int64   `json:"monthlyTransferBytes"`
	ProjectedStorageBytes int64   `json:"projectedStorageBytes"`
}

type ConnectionAnalyticsActual struct {
	Backups             AnalyticsBackupStats    `json:"backups"`
	Snapshots           AnalyticsSnapshotStats  `json:"snapshots"`
	CurrentStorageBytes int64                   `json:"currentStorageBytes"`
	MonthlySeries       []AnalyticsMonthlyPoint `json:"monthlySeries"`
}

type ConnectionAnalyticsProjections struct {
	Policies     []AnalyticsPolicyProjection `json:"policies"`
	Totals       AnalyticsProjectionTotals   `json:"totals"`
	GrowthSeries []AnalyticsGrowthPoint      `json:"growthSeries"`
}

type ConnectionAnalytics struct {
	Actual      ConnectionAnalyticsActual      `json:"actual"`
	Projections ConnectionAnalyticsProjections `json:"projections"`
}

type AnalyticsConnectionSummary struct {
	ConnectionID          string `json:"connectionID"`
	Name                  string `json:"name"`
	Backups               int64  `json:"backups"`
	Snapshots             int64  `json:"snapshots"`
	StorageBytes          int64  `json:"storageBytes"`
	ActivePolicies        int    `json:"activePolicies"`
	MonthlyTransferBytes  int64  `json:"monthlyTransferBytes"`
	ProjectedStorageBytes int64  `json:"projectedStorageBytes"`
}

type AnalyticsActivityItem struct {
	Type           string `json:"type"` // "backup" | "snapshot"
	ID             string `json:"id"`
	ConnectionID   string `json:"connectionID"`
	ConnectionName string `json:"connectionName"`
	Status         string `json:"status"`
	Timestamp      int64  `json:"timestamp"`
	SizeBytes      int64  `json:"sizeBytes"`
	Detail         string `json:"detail"`
}

type OverviewAnalyticsActual struct {
	Connections        int64                        `json:"connections"`
	Backups            int64                        `json:"backups"`
	Snapshots          int64                        `json:"snapshots"`
	StorageBytes       int64                        `json:"storageBytes"`
	ThisMonthBackups   int64                        `json:"thisMonthBackups"`
	ThisMonthSnapshots int64                        `json:"thisMonthSnapshots"`
	ThisMonthBytes     int64                        `json:"thisMonthBytes"`
	PerConnection      []AnalyticsConnectionSummary `json:"perConnection"`
	RecentActivity     []AnalyticsActivityItem      `json:"recentActivity"`
	MonthlySeries      []AnalyticsMonthlyPoint      `json:"monthlySeries"`
}

type OverviewAnalyticsProjections struct {
	Totals        AnalyticsProjectionTotals    `json:"totals"`
	PerConnection []AnalyticsConnectionSummary `json:"perConnection"`
	GrowthSeries  []AnalyticsGrowthPoint       `json:"growthSeries"`
}

type OverviewAnalytics struct {
	Actual      OverviewAnalyticsActual      `json:"actual"`
	Projections OverviewAnalyticsProjections `json:"projections"`
}

// ====[Internal Aggregation Helpers]====

// Aggregates decoded as float64 because $sum/$avg may return int32, int64 or double.
type policyBackupAgg struct {
	PolicyID          string  `bson:"_id"`
	Total             float64 `bson:"total"`
	Success           float64 `bson:"success"`
	Failed            float64 `bson:"failed"`
	StoredBytes       float64 `bson:"storedBytes"`
	TotalDuration     float64 `bson:"totalDuration"`
	SizedSuccessBytes float64 `bson:"sizedSuccessBytes"`
	SizedSuccessCount float64 `bson:"sizedSuccessCount"`
}

func aggregateBackupStatsByPolicy(policyIDs []string) (map[string]policyBackupAgg, error) {
	statsByPolicy := map[string]policyBackupAgg{}
	if len(policyIDs) == 0 {
		return statsByPolicy, nil
	}

	var Collection = global.GetCollection(global.BackupsCollection)

	isSuccess := bson.M{"$eq": bson.A{"$status", "Success"}}
	isFailed := bson.M{"$eq": bson.A{"$status", "Failed"}}
	isStored := bson.M{"$ne": bson.A{"$isDeleted", true}}
	isSizedSuccess := bson.M{"$and": bson.A{
		isSuccess,
		bson.M{"$gt": bson.A{"$size", 0}},
	}}

	pipeline := []bson.M{
		{"$match": bson.M{"backupPolicyID": bson.M{"$in": policyIDs}}},
		{"$group": bson.M{
			"_id":               "$backupPolicyID",
			"total":             bson.M{"$sum": 1},
			"success":           bson.M{"$sum": bson.M{"$cond": bson.A{isSuccess, 1, 0}}},
			"failed":            bson.M{"$sum": bson.M{"$cond": bson.A{isFailed, 1, 0}}},
			"storedBytes":       bson.M{"$sum": bson.M{"$cond": bson.A{isStored, "$size", 0}}},
			"totalDuration":     bson.M{"$sum": "$duration"},
			"sizedSuccessBytes": bson.M{"$sum": bson.M{"$cond": bson.A{isSizedSuccess, "$size", 0}}},
			"sizedSuccessCount": bson.M{"$sum": bson.M{"$cond": bson.A{isSizedSuccess, 1, 0}}},
		}},
	}

	cursor, err := Collection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		return statsByPolicy, err
	}
	defer cursor.Close(context.TODO())
	for cursor.Next(context.TODO()) {
		var agg policyBackupAgg
		if err := cursor.Decode(&agg); err != nil {
			return statsByPolicy, err
		}
		statsByPolicy[agg.PolicyID] = agg
	}

	return statsByPolicy, nil
}

func sumBackupStats(statsByPolicy map[string]policyBackupAgg) AnalyticsBackupStats {
	stats := AnalyticsBackupStats{}
	var totalDuration, sizedBytes, sizedCount float64
	for _, agg := range statsByPolicy {
		stats.Total += int64(agg.Total)
		stats.Success += int64(agg.Success)
		stats.Failed += int64(agg.Failed)
		stats.StoredBytes += int64(agg.StoredBytes)
		totalDuration += agg.TotalDuration
		sizedBytes += agg.SizedSuccessBytes
		sizedCount += agg.SizedSuccessCount
	}
	if sizedCount > 0 {
		stats.AvgSizeBytes = int64(sizedBytes / sizedCount)
	}
	if stats.Total > 0 {
		stats.AvgDurationMs = int64(totalDuration / float64(stats.Total))
	}
	return stats
}

func aggregateSnapshotStats(connectionIDs []string) (AnalyticsSnapshotStats, error) {
	stats := AnalyticsSnapshotStats{}
	if len(connectionIDs) == 0 {
		return stats, nil
	}

	var Collection = global.GetCollection(global.SnapshotsCollection)

	pipeline := []bson.M{
		{"$match": bson.M{"connectionID": bson.M{"$in": connectionIDs}}},
		{"$group": bson.M{
			"_id":         nil,
			"total":       bson.M{"$sum": 1},
			"success":     bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$eq": bson.A{"$status", "Success"}}, 1, 0}}},
			"failed":      bson.M{"$sum": bson.M{"$cond": bson.A{bson.M{"$eq": bson.A{"$status", "Failed"}}, 1, 0}}},
			"storedBytes": bson.M{"$sum": "$size"},
		}},
	}

	cursor, err := Collection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		return stats, err
	}
	defer cursor.Close(context.TODO())
	for cursor.Next(context.TODO()) {
		var agg struct {
			Total       float64 `bson:"total"`
			Success     float64 `bson:"success"`
			Failed      float64 `bson:"failed"`
			StoredBytes float64 `bson:"storedBytes"`
		}
		if err := cursor.Decode(&agg); err != nil {
			return stats, err
		}
		stats.Total = int64(agg.Total)
		stats.Success = int64(agg.Success)
		stats.Failed = int64(agg.Failed)
		stats.StoredBytes = int64(agg.StoredBytes)
	}

	return stats, nil
}

type monthlyAgg struct {
	Month string  `bson:"_id"`
	Bytes float64 `bson:"bytes"`
	Count float64 `bson:"count"`
}

func aggregateMonthly(
	collectionName string,
	matchFilter bson.M,
	sinceMs int64,
) (map[string]monthlyAgg, error) {
	result := map[string]monthlyAgg{}

	var Collection = global.GetCollection(collectionName)

	matchFilter["timestamp"] = bson.M{"$gte": sinceMs}
	pipeline := []bson.M{
		{"$match": matchFilter},
		{"$group": bson.M{
			"_id": bson.M{"$dateToString": bson.M{
				"format": "%Y-%m",
				"date":   bson.M{"$toDate": "$timestamp"},
			}},
			"bytes": bson.M{"$sum": "$size"},
			"count": bson.M{"$sum": 1},
		}},
	}

	cursor, err := Collection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		return result, err
	}
	defer cursor.Close(context.TODO())
	for cursor.Next(context.TODO()) {
		var agg monthlyAgg
		if err := cursor.Decode(&agg); err != nil {
			return result, err
		}
		result[agg.Month] = agg
	}

	return result, nil
}

func monthlyActivitySeries(
	policyIDs []string,
	connectionIDs []string,
	months int,
) ([]AnalyticsMonthlyPoint, error) {
	now := time.Now().UTC()
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	cutoff := monthStart.AddDate(0, -(months - 1), 0)

	backupsByMonth := map[string]monthlyAgg{}
	if len(policyIDs) > 0 {
		var err error
		backupsByMonth, err = aggregateMonthly(
			global.BackupsCollection,
			bson.M{"backupPolicyID": bson.M{"$in": policyIDs}},
			cutoff.UnixMilli(),
		)
		if err != nil {
			return nil, err
		}
	}

	snapshotsByMonth := map[string]monthlyAgg{}
	if len(connectionIDs) > 0 {
		var err error
		snapshotsByMonth, err = aggregateMonthly(
			global.SnapshotsCollection,
			bson.M{"connectionID": bson.M{"$in": connectionIDs}},
			cutoff.UnixMilli(),
		)
		if err != nil {
			return nil, err
		}
	}

	series := []AnalyticsMonthlyPoint{}
	for i := 0; i < months; i++ {
		month := cutoff.AddDate(0, i, 0).Format("2006-01")
		point := AnalyticsMonthlyPoint{Month: month}
		if agg, ok := backupsByMonth[month]; ok {
			point.BackupBytes = int64(agg.Bytes)
			point.BackupCount = int64(agg.Count)
		}
		if agg, ok := snapshotsByMonth[month]; ok {
			point.SnapshotBytes = int64(agg.Bytes)
			point.SnapshotCount = int64(agg.Count)
		}
		series = append(series, point)
	}

	return series, nil
}

// ====[Projection Math]====

func buildPolicyProjections(
	policies []interfaces.BackupPolicy,
	statsByPolicy map[string]policyBackupAgg,
) ([]AnalyticsPolicyProjection, AnalyticsProjectionTotals) {
	// Connection-wide fallback average for policies without sized backups yet
	var fallbackBytes, fallbackCount float64
	for _, agg := range statsByPolicy {
		fallbackBytes += agg.SizedSuccessBytes
		fallbackCount += agg.SizedSuccessCount
	}
	fallbackAvg := int64(0)
	if fallbackCount > 0 {
		fallbackAvg = int64(fallbackBytes / fallbackCount)
	}

	projections := []AnalyticsPolicyProjection{}
	totals := AnalyticsProjectionTotals{}

	for _, policy := range policies {
		if policy.IsDeleted {
			continue
		}

		agg := statsByPolicy[policy.BackupPolicyID]

		projection := AnalyticsPolicyProjection{
			BackupPolicyID:     policy.BackupPolicyID,
			Name:               policy.Name,
			Status:             policy.Status,
			Interval:           policy.Interval,
			TimeUnit:           policy.TimeUnit,
			RetentionDays:      policy.Retention,
			CurrentStoredBytes: int64(agg.StoredBytes),
		}

		if agg.SizedSuccessCount > 0 {
			projection.AvgBackupBytes = int64(agg.SizedSuccessBytes / agg.SizedSuccessCount)
			projection.HasSizeData = true
		} else {
			projection.AvgBackupBytes = fallbackAvg
			projection.HasSizeData = false
		}

		intervalMs := int64(policy.Interval) * libs.ParseTimeUnitToMilli(libs.TimeUnit(policy.TimeUnit))
		isActive := policy.Status == "Active" && policy.Interval > 0 && intervalMs > 0

		if isActive {
			projection.RunsPerMonth = float64(analyticsMonthMs) / float64(intervalMs)
			projection.MonthlyTransferBytes = int64(projection.RunsPerMonth * float64(projection.AvgBackupBytes))

			if policy.Retention > 0 {
				retentionMs := int64(policy.Retention) * 24 * 60 * 60 * 1000
				retainedRuns := math.Max(1, float64(retentionMs)/float64(intervalMs))
				projection.SteadyStateBytes = int64(retainedRuns * float64(projection.AvgBackupBytes))
			}
		}

		projection.ProjectedStorageBytes = projectedStorageAtMonth(projection, 1)

		if isActive {
			totals.ActivePolicies++
			totals.RunsPerMonth += projection.RunsPerMonth
			totals.MonthlyTransferBytes += projection.MonthlyTransferBytes
		}
		totals.ProjectedStorageBytes += projection.ProjectedStorageBytes

		projections = append(projections, projection)
	}

	return projections, totals
}

func projectedStorageAtMonth(p AnalyticsPolicyProjection, monthOffset int) int64 {
	if p.Status != "Active" || p.RunsPerMonth <= 0 {
		return p.CurrentStoredBytes
	}

	projected := float64(p.CurrentStoredBytes) +
		p.RunsPerMonth*float64(p.AvgBackupBytes)*float64(monthOffset)

	// Retention prunes old backups, capping storage at a steady state
	if p.SteadyStateBytes > 0 {
		projected = math.Min(projected, float64(p.SteadyStateBytes))
	}

	return int64(projected)
}

func buildGrowthSeries(
	projections []AnalyticsPolicyProjection,
	currentSnapshotBytes int64,
	months int,
) []AnalyticsGrowthPoint {
	now := time.Now().UTC()
	series := []AnalyticsGrowthPoint{}

	for m := 0; m <= months; m++ {
		var total int64 = currentSnapshotBytes
		for _, p := range projections {
			total += projectedStorageAtMonth(p, m)
		}
		series = append(series, AnalyticsGrowthPoint{
			Month:        now.AddDate(0, m, 0).Format("2006-01"),
			StorageBytes: total,
		})
	}

	return series
}

// ====[Public Services]====

func GetConnectionAnalytics(connectionID string) (ConnectionAnalytics, error) {
	analytics := ConnectionAnalytics{
		Actual: ConnectionAnalyticsActual{
			MonthlySeries: []AnalyticsMonthlyPoint{},
		},
		Projections: ConnectionAnalyticsProjections{
			Policies:     []AnalyticsPolicyProjection{},
			GrowthSeries: []AnalyticsGrowthPoint{},
		},
	}

	policies, err := GetBackUpPolicies(GetBackUpPoliciesParams{
		ConnectionID: &connectionID,
		Status:       nil,
	})
	if err != nil {
		return analytics, err
	}

	policyIDs := make([]string, 0, len(policies))
	for _, policy := range policies {
		policyIDs = append(policyIDs, policy.BackupPolicyID)
	}

	statsByPolicy, err := aggregateBackupStatsByPolicy(policyIDs)
	if err != nil {
		return analytics, err
	}

	snapshotStats, err := aggregateSnapshotStats([]string{connectionID})
	if err != nil {
		return analytics, err
	}

	monthlySeries, err := monthlyActivitySeries(policyIDs, []string{connectionID}, 6)
	if err != nil {
		return analytics, err
	}

	backupStats := sumBackupStats(statsByPolicy)
	policyProjections, projectionTotals := buildPolicyProjections(policies, statsByPolicy)
	// Snapshots already stored count toward projected storage as well
	projectionTotals.ProjectedStorageBytes += snapshotStats.StoredBytes

	analytics.Actual.Backups = backupStats
	analytics.Actual.Snapshots = snapshotStats
	analytics.Actual.CurrentStorageBytes = backupStats.StoredBytes + snapshotStats.StoredBytes
	analytics.Actual.MonthlySeries = monthlySeries

	analytics.Projections.Policies = policyProjections
	analytics.Projections.Totals = projectionTotals
	analytics.Projections.GrowthSeries = buildGrowthSeries(policyProjections, snapshotStats.StoredBytes, 3)

	return analytics, nil
}

func getConnectionsForUser(userID string) ([]interfaces.Connection, error) {
	var Collection = global.GetCollection(global.ConnectionsCollection)

	connections := []interfaces.Connection{}
	cursor, err := Collection.Find(
		context.TODO(),
		bson.M{"userID": userID},
	)
	if err != nil {
		return connections, err
	}
	defer cursor.Close(context.TODO())
	for cursor.Next(context.TODO()) {
		var connection interfaces.Connection
		if err := cursor.Decode(&connection); err != nil {
			return connections, err
		}
		connections = append(connections, connection)
	}

	return connections, nil
}

type countSinceAgg struct {
	Count float64 `bson:"count"`
	Bytes float64 `bson:"bytes"`
}

func countSince(collectionName string, matchFilter bson.M, sinceMs int64) (countSinceAgg, error) {
	result := countSinceAgg{}

	var Collection = global.GetCollection(collectionName)

	matchFilter["timestamp"] = bson.M{"$gte": sinceMs}
	pipeline := []bson.M{
		{"$match": matchFilter},
		{"$group": bson.M{
			"_id":   nil,
			"count": bson.M{"$sum": 1},
			"bytes": bson.M{"$sum": "$size"},
		}},
	}

	cursor, err := Collection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		return result, err
	}
	defer cursor.Close(context.TODO())
	for cursor.Next(context.TODO()) {
		if err := cursor.Decode(&result); err != nil {
			return result, err
		}
	}

	return result, nil
}

func recentActivityItems(
	policyIDs []string,
	connectionIDs []string,
	connectionNameByID map[string]string,
	connectionIDByPolicyID map[string]string,
	limit int,
) ([]AnalyticsActivityItem, error) {
	items := []AnalyticsActivityItem{}

	// Recent backups (connectionID resolved via the policy)
	if len(policyIDs) > 0 {
		var BackupsCollection = global.GetCollection(global.BackupsCollection)
		cursor, err := BackupsCollection.Find(
			context.TODO(),
			bson.M{"backupPolicyID": bson.M{"$in": policyIDs}},
			options.Find().
				SetSort(bson.M{"timestamp": -1}).
				SetLimit(int64(limit)).
				SetProjection(bson.M{
					"backupID":       1,
					"backupPolicyID": 1,
					"timestamp":      1,
					"status":         1,
					"size":           1,
				}),
		)
		if err != nil {
			return items, err
		}
		defer cursor.Close(context.TODO())
		for cursor.Next(context.TODO()) {
			var backup interfaces.Backup
			if err := cursor.Decode(&backup); err != nil {
				return items, err
			}
			connectionID := connectionIDByPolicyID[backup.BackupPolicyID]
			items = append(items, AnalyticsActivityItem{
				Type:           "backup",
				ID:             backup.BackupID,
				ConnectionID:   connectionID,
				ConnectionName: connectionNameByID[connectionID],
				Status:         backup.Status,
				Timestamp:      backup.Timestamp,
				SizeBytes:      backup.Size,
			})
		}
	}

	// Recent snapshots
	if len(connectionIDs) > 0 {
		var SnapshotsCollection = global.GetCollection(global.SnapshotsCollection)
		cursor, err := SnapshotsCollection.Find(
			context.TODO(),
			bson.M{"connectionID": bson.M{"$in": connectionIDs}},
			options.Find().
				SetSort(bson.M{"timestamp": -1}).
				SetLimit(int64(limit)).
				SetProjection(bson.M{
					"snapshotID":   1,
					"connectionID": 1,
					"timestamp":    1,
					"status":       1,
					"size":         1,
					"database":     1,
					"collection":   1,
				}),
		)
		if err != nil {
			return items, err
		}
		defer cursor.Close(context.TODO())
		for cursor.Next(context.TODO()) {
			var snapshot interfaces.Snapshot
			if err := cursor.Decode(&snapshot); err != nil {
				return items, err
			}
			detail := snapshot.Database
			if snapshot.Collection != "" {
				detail += "." + snapshot.Collection
			}
			items = append(items, AnalyticsActivityItem{
				Type:           "snapshot",
				ID:             snapshot.SnapshotID,
				ConnectionID:   snapshot.ConnectionID,
				ConnectionName: connectionNameByID[snapshot.ConnectionID],
				Status:         snapshot.Status,
				Timestamp:      snapshot.Timestamp,
				SizeBytes:      snapshot.Size,
				Detail:         detail,
			})
		}
	}

	sort.Slice(items, func(i, j int) bool {
		return items[i].Timestamp > items[j].Timestamp
	})
	if len(items) > limit {
		items = items[:limit]
	}

	return items, nil
}

func GetOverviewAnalytics(userID string) (OverviewAnalytics, error) {
	analytics := OverviewAnalytics{
		Actual: OverviewAnalyticsActual{
			PerConnection:  []AnalyticsConnectionSummary{},
			RecentActivity: []AnalyticsActivityItem{},
			MonthlySeries:  []AnalyticsMonthlyPoint{},
		},
		Projections: OverviewAnalyticsProjections{
			PerConnection: []AnalyticsConnectionSummary{},
			GrowthSeries:  []AnalyticsGrowthPoint{},
		},
	}

	connections, err := getConnectionsForUser(userID)
	if err != nil {
		return analytics, err
	}

	analytics.Actual.Connections = int64(len(connections))

	allPolicyIDs := []string{}
	allConnectionIDs := []string{}
	allProjections := []AnalyticsPolicyProjection{}
	connectionNameByID := map[string]string{}
	connectionIDByPolicyID := map[string]string{}
	var totalSnapshotStoredBytes int64 = 0

	for _, connection := range connections {
		allConnectionIDs = append(allConnectionIDs, connection.ConnectionID)
		connectionNameByID[connection.ConnectionID] = connection.Name

		policies, err := GetBackUpPolicies(GetBackUpPoliciesParams{
			ConnectionID: &connection.ConnectionID,
			Status:       nil,
		})
		if err != nil {
			return analytics, err
		}

		policyIDs := make([]string, 0, len(policies))
		for _, policy := range policies {
			policyIDs = append(policyIDs, policy.BackupPolicyID)
			connectionIDByPolicyID[policy.BackupPolicyID] = connection.ConnectionID
		}
		allPolicyIDs = append(allPolicyIDs, policyIDs...)

		statsByPolicy, err := aggregateBackupStatsByPolicy(policyIDs)
		if err != nil {
			return analytics, err
		}

		snapshotStats, err := aggregateSnapshotStats([]string{connection.ConnectionID})
		if err != nil {
			return analytics, err
		}
		totalSnapshotStoredBytes += snapshotStats.StoredBytes

		backupStats := sumBackupStats(statsByPolicy)
		policyProjections, projectionTotals := buildPolicyProjections(policies, statsByPolicy)
		allProjections = append(allProjections, policyProjections...)

		summary := AnalyticsConnectionSummary{
			ConnectionID:          connection.ConnectionID,
			Name:                  connection.Name,
			Backups:               backupStats.Total,
			Snapshots:             snapshotStats.Total,
			StorageBytes:          backupStats.StoredBytes + snapshotStats.StoredBytes,
			ActivePolicies:        projectionTotals.ActivePolicies,
			MonthlyTransferBytes:  projectionTotals.MonthlyTransferBytes,
			ProjectedStorageBytes: projectionTotals.ProjectedStorageBytes + snapshotStats.StoredBytes,
		}

		analytics.Actual.Backups += backupStats.Total
		analytics.Actual.Snapshots += snapshotStats.Total
		analytics.Actual.StorageBytes += summary.StorageBytes

		analytics.Actual.PerConnection = append(analytics.Actual.PerConnection, summary)
		analytics.Projections.PerConnection = append(analytics.Projections.PerConnection, summary)

		analytics.Projections.Totals.ActivePolicies += projectionTotals.ActivePolicies
		analytics.Projections.Totals.RunsPerMonth += projectionTotals.RunsPerMonth
		analytics.Projections.Totals.MonthlyTransferBytes += projectionTotals.MonthlyTransferBytes
		analytics.Projections.Totals.ProjectedStorageBytes += summary.ProjectedStorageBytes
	}

	// This-month activity
	now := time.Now().UTC()
	monthStartMs := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC).UnixMilli()

	if len(allPolicyIDs) > 0 {
		backupsThisMonth, err := countSince(
			global.BackupsCollection,
			bson.M{"backupPolicyID": bson.M{"$in": allPolicyIDs}},
			monthStartMs,
		)
		if err != nil {
			return analytics, err
		}
		analytics.Actual.ThisMonthBackups = int64(backupsThisMonth.Count)
		analytics.Actual.ThisMonthBytes += int64(backupsThisMonth.Bytes)
	}

	if len(allConnectionIDs) > 0 {
		snapshotsThisMonth, err := countSince(
			global.SnapshotsCollection,
			bson.M{"connectionID": bson.M{"$in": allConnectionIDs}},
			monthStartMs,
		)
		if err != nil {
			return analytics, err
		}
		analytics.Actual.ThisMonthSnapshots = int64(snapshotsThisMonth.Count)
		analytics.Actual.ThisMonthBytes += int64(snapshotsThisMonth.Bytes)
	}

	monthlySeries, err := monthlyActivitySeries(allPolicyIDs, allConnectionIDs, 6)
	if err != nil {
		return analytics, err
	}
	analytics.Actual.MonthlySeries = monthlySeries

	recentActivity, err := recentActivityItems(
		allPolicyIDs,
		allConnectionIDs,
		connectionNameByID,
		connectionIDByPolicyID,
		10,
	)
	if err != nil {
		return analytics, err
	}
	analytics.Actual.RecentActivity = recentActivity

	analytics.Projections.GrowthSeries = buildGrowthSeries(allProjections, totalSnapshotStoredBytes, 3)

	return analytics, nil
}
