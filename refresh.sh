#!/bin/bash
# refresh.sh - Refresh the data pipeline

echo "Starting data pipeline refresh..."

# Run the clean script to process raw data
echo "Step 1: Processing raw data with clean.py"
python clean.py

# Run the core metrics calculation
echo "Step 2: Calculating core metrics with metrics/core.py"
python -m metrics.core

# Run the simplified PIV calculation
echo "Step 3: Calculating PIV values with metrics/simple_piv.py"
python -m metrics.simple_piv

echo "Data pipeline refresh complete!"
