---
sidebar_position: 1
---

# Containerization with Docker

Learn how to **containerize your applications** using Docker to ensure consistency across different environments.

## What are Containers?

Containers are lightweight, standalone, executable packages that include everything needed to run an application:
- Code
- Runtime
- System tools
- System libraries
- Settings

## Create Your First Dockerfile

Create a file named `Dockerfile` in your project directory:

```dockerfile title="Dockerfile"
FROM node:14-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

This Dockerfile creates a container for a Node.js application.

## Build and Run Your Container

Build your Docker image:

```bash
docker build -t my-node-app .
```

Run your container:

```bash
docker run -p 3000:3000 my-node-app
```

Your application is now running in a container and accessible at [http://localhost:3000](http://localhost:3000).

## Docker Compose for Multi-Container Applications

For applications with multiple services, create a `docker-compose.yml` file:

```yaml title="docker-compose.yml"
version: '3'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - db
  db:
    image: mongo:4.4
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"

volumes:
  mongo-data:
```

Run your multi-container application:

```bash
docker-compose up
```

This will start both your application and a MongoDB database container, with the appropriate networking between them.
