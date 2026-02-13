# Build Frontend
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Setup Backend & Serve Frontend
FROM node:18-alpine
WORKDIR /app

# Copy backend dependencies
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm install --production

# Copy backend code
COPY server/ ./

# Copy built frontend to backend's public directory to serve it
# We will serve the 'dist' folder from the frontend build as static files
WORKDIR /app
COPY --from=build /app/dist ./server/public/dist

# Expose port
EXPOSE 5001

# Start the server
WORKDIR /app/server
CMD ["node", "index.js"]
