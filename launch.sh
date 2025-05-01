#!/bin/bash
# launch.sh - Launch both the frontend and backend servers

echo "Starting CS2 Performance Analytics Platform..."

# Create raw_events directory if it doesn't exist
mkdir -p raw_events clean

# Run the data pipeline to ensure data is up to date
echo "Running data pipeline..."
./refresh.sh

# Start the Flask API server in the background
echo "Starting Flask API server..."
python run_flask_api.py &
FLASK_PID=$!

# Give the Flask server a moment to start up
sleep 2

echo "Flask API server running on port 5001"
echo "Access API endpoints at: http://localhost:5001/api/players"

# Start the frontend server
echo "Starting frontend server..."
npm run dev

# If the frontend server stops, kill the Flask server
kill $FLASK_PID
