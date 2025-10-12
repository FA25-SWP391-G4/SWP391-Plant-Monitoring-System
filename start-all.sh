#!/bin/bash

echo "===== Starting Plant Monitoring System ====="

# Start backend in background
echo "Starting backend server..."
npm start & 
BACKEND_PID=$!

# Start AI service in background
echo "Starting AI service..."
npm run start:ai &
AI_PID=$!

# Wait a moment for services to initialize
echo "Waiting for services to start..."
sleep 5

# Open browser
echo "Opening frontend in browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  xdg-open http://localhost:3000
fi

echo "All services started!"
echo "Press Ctrl+C to stop all services"

# Wait for user to press Ctrl+C
trap "echo 'Stopping services...'; kill $BACKEND_PID $AI_PID; exit 0" SIGINT
wait