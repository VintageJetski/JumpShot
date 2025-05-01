#!/bin/bash
# Script to update weights daily and serve them to the frontend

echo "Running daily weight learning update at $(date)"

# Run the weight learning script
python -m metrics.learn_weights

echo "Weight update complete"

# Check if we have the latest weights
if [ -f "clean/weights/latest/learned_weights.csv" ]; then
  echo "Successfully created new weights"
  exit 0
else
  echo "Failed to create new weights"
  exit 1
fi
