#!/usr/bin/env bash
python clean.py &&
python -m metrics.core &&
python -m metrics.piv &&
python -m metrics.learn_weights

echo "Data refresh complete. All metrics have been updated."
