FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy source and build
COPY . .
RUN npx vite build

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "server.js"]
