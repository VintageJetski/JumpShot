#!/bin/bash
# refresh.sh - Refresh the data pipeline

echo "Starting data pipeline refresh..."

# Run the clean script to process raw data
echo "Step 1: Processing raw data with clean.py"
python clean.py

# Run the core metrics calculation
echo "Step 2: Calculating core metrics with metrics/core.py"
python -m metrics.core

# Run the PIV calculations (both simple and v1.4)
echo "Step 3a: Calculating simple PIV values with metrics/simple_piv.py"
python -m metrics.simple_piv

echo "Step 3b: Calculating PIV v1.4 values with metrics/piv_v14.py"
python -m metrics.piv_v14

# Run the weight learning and team impact rating calculation
echo "Step 4: Learning metric weights and calculating team impact ratings"
python -m metrics.learn_weights

echo "Data pipeline refresh complete!"
