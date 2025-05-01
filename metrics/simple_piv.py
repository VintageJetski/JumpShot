#!/usr/bin/env python
# metrics/simple_piv.py - Simplified PIV calculation
import pandas as pd
import numpy as np
from pathlib import Path

# File paths
INPUT_PATH = 'clean/enriched.parquet'
OUTPUT_PATH = 'clean/piv.parquet'

def load_enriched_data():
    """Load data from clean/enriched.parquet"""
    print(f"Loading enriched data from {INPUT_PATH}")
    try:
        df = pd.read_parquet(INPUT_PATH)
        print(f"Loaded {len(df)} player records")
        return df
    except Exception as e:
        print(f"Error loading enriched data: {e}")
        return None

def calculate_simple_piv(df):
    """Calculate a simplified PIV (Player Impact Value)"""
    print("Calculating simplified PIV...")
    
    # Ensure we have the necessary columns
    required_cols = ['kd', 'impact_score', 'flash_efficiency', 'entry_ratio', 'consistency']
    missing_cols = [col for col in required_cols if col not in df.columns]
    
    if missing_cols:
        print(f"Warning: Missing required columns: {missing_cols}")
        for col in missing_cols:
            df[col] = 0.6  # Default moderate value
    
    # Simple PIV formula based on weighted sum of available metrics
    df['piv'] = (
        df['kd'] * 0.35 + 
        df['impact_score'] * 0.25 +
        df['flash_efficiency'] * 0.15 +
        df['entry_ratio'] * 0.15 +
        df['consistency'] * 0.1
    )
    
    # Scale PIV to a reasonable range (0.5 - 3.0)
    min_piv, max_piv = df['piv'].min(), df['piv'].max()
    if min_piv < max_piv:  # Avoid division by zero
        df['piv'] = 0.5 + 2.5 * (df['piv'] - min_piv) / (max_piv - min_piv)
    else:
        df['piv'] = 1.5  # Default moderate value
    
    # Default role assignment for demonstration
    # This will be replaced with more sophisticated logic later
    df['role'] = 'Support'  # Default role
    df.loc[df['kd'] > 1.3, 'role'] = 'Spacetaker'  # Higher KD = Spacetaker
    df.loc[(df['flash_efficiency'] > 0.15) & (df['kd'] < 1.3), 'role'] = 'Support'  # Flash efficiency = Support
    
    # Create side-specific PIVs (placeholder for now)
    df['t_piv'] = df['piv'] * 0.9 + np.random.normal(0, 0.1, size=len(df))
    df['ct_piv'] = df['piv'] * 1.1 + np.random.normal(0, 0.1, size=len(df))
    
    # Clamp values to reasonable range
    df['t_piv'] = df['t_piv'].clip(0.5, 3.0)
    df['ct_piv'] = df['ct_piv'].clip(0.5, 3.0)
    
    return df

def main():
    # Load enriched data
    df = load_enriched_data()
    if df is None:
        print("Failed to load enriched data. Exiting.")
        return
    
    # Calculate simplified PIV
    df = calculate_simple_piv(df)
    
    # Save PIV data
    print(f"Saving simplified PIV data to {OUTPUT_PATH}")
    df.to_parquet(OUTPUT_PATH)
    print(f"Saved {len(df)} player records with simplified PIV calculations")

if __name__ == "__main__":
    main()
