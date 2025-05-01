#!/usr/bin/env bash

# Initialize checksum
CSVS_CHECKSUM=$(ls -1 raw_events/*.csv 2>/dev/null | md5sum)

# Watch for changes to CSV files
while true; do
  # Sleep for 60 seconds
  sleep 60
  
  # Calculate new checksum
  NEW_CHECKSUM=$(ls -1 raw_events/*.csv 2>/dev/null | md5sum)
  
  # If checksum has changed, run refresh
  if [ "$CSVS_CHECKSUM" != "$NEW_CHECKSUM" ]; then
    echo "CSV files changed, running refresh..."
    ./refresh.sh
    
    # Update checksum
    CSVS_CHECKSUM=$NEW_CHECKSUM
  fi
done
