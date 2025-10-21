package services

import (
	"fmt"
	"sync"

	"github.com/robfig/cron/v3"
)

type Scheduler struct {
	cron *cron.Cron
	jobs map[string]cron.EntryID // store by custom key (like userID or jobName)
	mu   sync.Mutex
}

func NewScheduler() *Scheduler {
	return &Scheduler{
		cron: cron.New(cron.WithSeconds()),
		jobs: make(map[string]cron.EntryID),
	}
}
func (s *Scheduler) AddJob(key, spec string, cmd func()) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	id, err := s.cron.AddFunc(spec, cmd)
	if err != nil {
		return err
	}

	s.jobs[key] = id
	return nil
}

// Remove dynamic job
func (s *Scheduler) RemoveJob(key string) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if id, ok := s.jobs[key]; ok {
		s.cron.Remove(id)
		delete(s.jobs, key)
	}
}

// List jobs
func (s *Scheduler) ListJobs() {
	s.mu.Lock()
	defer s.mu.Unlock()

	for key, id := range s.jobs {
		entry := s.cron.Entry(id)
		fmt.Printf("Job %s -> ID %d | Next: %s | Prev: %s\n",
			key, id, entry.Next, entry.Prev)
	}
}

func (s *Scheduler) Start() {
	s.cron.Start()
}

var SCHEDULER = NewScheduler()
