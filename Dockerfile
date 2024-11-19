# Stage 1: Build the Go application
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

# Build the application as a statically linked binary
RUN go build  -o app .

# Stage 2: Create a minimal image for the application

FROM --platform=linux/amd64 debian:bullseye-slim


# install curl
RUN  apt-get update && apt-get install -y curl


# install mongodb tools && clean up
RUN curl https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu1804-x86_64-100.10.0.tgz -o mongodb-tools.tgz \
    && tar -xvf mongodb-tools.tgz \
    && mv mongodb-database-tools-ubuntu1804-x86_64-100.10.0/bin /app \
    && rm -rf mongodb-tools.tgz

# # Install multi-arch library
# RUN apt-get update && apt-get install -y liblzma-dev

# Set working directory
WORKDIR /app

# Copy the binary from the builder stage
COPY --from=builder /app/app .
COPY ./.env .


# Set the default command to run the binary
ENV MONGODB_TOOLS_PATH="./"
CMD ["./app"]