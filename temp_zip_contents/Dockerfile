FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application
COPY . .

# Build the client
RUN npm run build:client

# Expose the application port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]