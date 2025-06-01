# [Stage 1]: Build the Go application
FROM golang:bookworm  AS builder

# Set environment variables
ENV CGO_ENABLED=0 \
    GOOS=linux \
    GOARCH=amd64

# Set the working directory
WORKDIR /app

# Copy Go modules and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the application
COPY . .
# Set the environment variable
ENV IS_DOCKER="true"
# Build the application as a statically linked binary
RUN go build  -o app .

# [Stage 2]: Build the React application
FROM node:18-alpine AS react-builder
WORKDIR /app
COPY --from=builder /app/web ./web
WORKDIR /app/web
RUN rm -rf node_modules package-lock.json && npm cache clean --force &&  npm install
RUN HOST=docker npm run build

# [Stage 3]: Create a minimal image for the application
FROM --platform=linux/amd64 debian:bullseye-slim


# install curl
RUN  apt-get update && apt-get install -y curl

# install mongodb tools && clean up
RUN curl https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu1804-x86_64-100.10.0.tgz -o mongodb-tools.tgz \
    && tar -xvf mongodb-tools.tgz \
    && mv mongodb-database-tools-ubuntu1804-x86_64-100.10.0/bin /app \
    && rm -rf mongodb-tools.tgz

# install gzip
RUN apt-get install -y gzip


# Set working directory
WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/app .
COPY --from=react-builder /app/web ./web

# Copy the .env file
RUN touch .env
COPY .env* ./

# make dir _stuffs/snapshots
RUN mkdir -p /app/_stuffs/snapshots

# Set the default command to run the binary
ENV MONGODB_TOOLS_PATH="./"
CMD ["./app"]
