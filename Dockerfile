# MetroFlow: build the C++ engine and run the Express server in one container.
FROM node:22-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends g++ make cmake \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN cd backend && npm ci --omit=dev

COPY cpp-engine ./cpp-engine
COPY backend ./backend
COPY frontend ./frontend
COPY tests ./tests
COPY README.md Dockerfile docker-compose.yml .gitignore .dockerignore ./

RUN cmake -S cpp-engine -B cpp-engine/build && cmake --build cpp-engine/build

ENV NODE_ENV=production
ENV PORT=5187
ENV CPP_ENGINE_PATH=/app/cpp-engine/build/metro_engine

EXPOSE 5187

CMD ["node", "backend/server.js"]
