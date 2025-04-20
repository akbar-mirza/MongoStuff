# MongoStuff

MongoStuff is a modern, full-stack MongoDB management and backup solution built with Go and React. It provides a user-friendly web interface for managing MongoDB connections, creating database snapshots, and performing restore operations.

> **Disclaimer:** MongoStuff is an independent project and is not affiliated with, endorsed by, or in any way officially connected to MongoDB, Inc. or its subsidiaries. MongoDB® is a registered trademark of MongoDB, Inc.

![image](https://github.com/user-attachments/assets/44ddaa1e-ab7d-4b8b-8d22-a63fb4a971f1)


## Features

- 🔐 Secure user authentication system
- 🔄 MongoDB cluster connection management
- 📸 Database snapshot creation and management
- ⚡ Fast database restore capabilities
- 🏷️ Snapshot tagging system
- 🖥️ Modern React+TypeScript frontend
- 🚀 High-performance Go backend using Fiber framework

## Prerequisites

- Go 1.21 or higher
- Node.js 18+ and pnpm
- MongoDB 6.0+
- Docker (optional, for containerized deployment)

## Installation

### Local Development Setup

1. Clone the repository:

```bash
git clone https://github.com/akbarmirza/mongostuff.git
cd mongostuff
```

2. Install backend dependencies:

```bash
go mod download
```

3. Install frontend dependencies:

```bash
cd web
pnpm install
cd ..
```

4. Create a `.env` file in the root directory:

```bash
PORT=3000
MONGO_URI=mongodb://localhost:27017
MONGO_DATABASE=mongostuff
JWT_SECRET=your_jwt_secret
IS_DOCKER=false
```

5. Build the frontend:

```bash
cd web
pnpm build
cd ..
```

6. Run the application:

```bash
go run main.go
```

The application will be available at `http://localhost:3000`

### Docker Deployment

1. Build the Docker image:

```bash
docker build -t mongostuff .
```

2. Run the container:

```bash
docker run -d \
  -p 3000:3000 \
  -e MONGO_URI=mongodb://your-mongodb-uri \
  -e MONGO_DATABASE=mongostuff \
  -e JWT_SECRET=your_jwt_secret \
  -e IS_DOCKER=true \
  -v mongostuff_data:/_stuffs \
  --name mongostuff \
  mongostuff
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `MONGO_URI`: MongoDB connection string
- `MONGO_DATABASE`: MongoDB database name
- `JWT_SECRET`: Secret key for JWT token generation
- `IS_DOCKER`: Set to "true" when running in Docker

## Development

### Running in Development Mode

1. Start the backend:

```bash
go run main.go
```

2. Start the frontend development server:

```bash
cd web
pnpm dev
```

The frontend will be available at `http://localhost:27019` with hot reload enabled.

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
