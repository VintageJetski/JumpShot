#!/usr/bin/env bash

# Start the file watcher in the background
./watch.sh &
WATCH_PID=$!

# Store PID for cleanup on exit
echo $WATCH_PID > .watch.pid

# Echo some helpful information
echo "File watcher started with PID $WATCH_PID"
echo "It will automatically run refresh.sh when new CSV files are dropped into raw_events/"
echo "Starting application server..."
echo "-----------------------------------------"

# Start the application
npm run dev

# Cleanup watch process when this script exits
trap "kill $WATCH_PID 2>/dev/null; rm .watch.pid 2>/dev/null" EXIT
