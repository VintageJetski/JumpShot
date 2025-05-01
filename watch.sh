#!/bin/bash
# watch.sh - Watch for changes in the raw_events directory and refresh the data pipeline

echo "Starting data pipeline watch..."

# Create raw_events directory if it doesn't exist
mkdir -p raw_events

# Initial refresh
./refresh.sh

echo "Watching for changes in raw_events directory..."
echo "Press Ctrl+C to stop watching."

# This is a simple implementation without inotify for portability
while true; do
  # Check if any files in raw_events are newer than the pipeline output
  NEWEST_RAW=$(find raw_events -type f -name "*.csv" -printf "%T@ %p\n" 2>/dev/null | sort -n | tail -1 | cut -f2- -d" ")
  NEWEST_RAW_TIME=$(stat -c %Y "$NEWEST_RAW" 2>/dev/null || echo 0)
  
  NEWEST_CLEAN=$(find clean -type f -name "*.parquet" -printf "%T@ %p\n" 2>/dev/null | sort -n | tail -1 | cut -f2- -d" ")
  NEWEST_CLEAN_TIME=$(stat -c %Y "$NEWEST_CLEAN" 2>/dev/null || echo 0)
  
  # If raw files are newer than clean files, refresh pipeline
  if [ "$NEWEST_RAW_TIME" -gt "$NEWEST_CLEAN_TIME" ]; then
    echo "Changes detected in raw_events directory."
    ./refresh.sh
  fi
  
  # Sleep for 30 seconds before checking again
  sleep 30
done
