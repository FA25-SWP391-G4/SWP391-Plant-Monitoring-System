FROM node:20-alpine

WORKDIR /app

# Copy root package definitions
COPY package*.json ./

# Install backend dependencies
RUN npm ci

# Copy backend application source files
COPY . .

# Expose the backend API port
EXPOSE 3010

# Start backend server
CMD ["npm", "start"]