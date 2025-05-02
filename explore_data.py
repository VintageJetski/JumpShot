#!/usr/bin/env python
# explore_data.py - Check and fix data type issues
import pandas as pd
import os

def explore_events_data():
    """Explore the events.parquet file"""
    if not os.path.exists('clean/events.parquet'):
        print("events.parquet file not found!")
        return
    
    try:
        print("Reading events.parquet...")
        df = pd.read_parquet('clean/events.parquet')
        print(f"Loaded {len(df)} rows from events.parquet")
        
        # Print column types
        print("\nColumn types:")
        for col, dtype in df.dtypes.items():
            print(f"{col}: {dtype}")
        
        # Check for potentially problematic columns
        print("\nChecking for problematic columns...")
        for col in df.columns:
            # Check for mixed types
            try:
                if df[col].dtype == 'object':
                    unique_types = df[col].apply(type).unique()
                    if len(unique_types) > 1:
                        print(f"Column {col} has mixed types: {unique_types}")
                        # Show sample values
                        print(f"Sample values: {df[col].head()}")
            except Exception as e:
                print(f"Error checking column {col}: {e}")
                
        # Convert the problematic column (name) to string
        if 'name' in df.columns:
            print("\nConverting 'name' column to string...")
            df['name'] = df['name'].astype(str)
        
        # Also convert other object columns to string to ensure consistency
        for col in df.columns:
            if df[col].dtype == 'object':
                print(f"Converting {col} to string...")
                df[col] = df[col].astype(str)
        
        # Save the fixed data
        print("\nSaving fixed data...")
        df.to_parquet('clean/events_fixed.parquet', index=False)
        print("Saved fixed data to clean/events_fixed.parquet")
        
        # Also replace the original file
        df.to_parquet('clean/events.parquet', index=False)
        print("Replaced original events.parquet with fixed data")
        
    except Exception as e:
        print(f"Error exploring events data: {e}")

if __name__ == "__main__":
    explore_events_data()
