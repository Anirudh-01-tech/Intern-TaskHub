FROM node:20-bullseye-slim

WORKDIR /app

# Install OpenSSL (Bullseye includes libssl1.1)
RUN apt-get update -y && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
COPY src ./src

# Generate Prisma client INSIDE the container (matching the container OS)
RUN npx prisma generate

EXPOSE 4000
CMD ["node", "src/server.js"]