FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    python3 \
    openjdk-17-jdk-headless \
    g++ \
    gcc \
    golang-go \
    rustc \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g ts-node typescript 2>/dev/null || true

WORKDIR /app
COPY runner.js /app/runner.js

RUN useradd -m sandbox && chown -R sandbox:sandbox /app
USER sandbox

ENTRYPOINT ["node", "/app/runner.js"]