# Build stage
FROM node:16-alpine AS build

WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

#Production stage
FROM node:16-alpine AS production

USER node
WORKDIR /app
COPY package*.json .
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
CMD ["node", "dist/index.js"]
