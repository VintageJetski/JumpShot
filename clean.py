#!/usr/bin/env python
# clean.py - Process raw CS2 match data into standardized parquet files
import pandas as pd
import numpy as np
import os
import glob
from pathlib import Path

# Constants
RAW_FOLDER = 'raw_events'
OUTPUT_FOLDER = 'clean'
CS_PLAYER_STATS_PATH = 'attached_assets/CS Data Points (IEM_Katowice_2025) - player_stats (IEM_Katowice_2025).csv'
CS_ROUNDS_PATH = 'attached_assets/CS Data Points (IEM_Katowice_2025) - rounds (IEM_Katowice_2025).csv'

# Make sure output folder exists
Path(OUTPUT_FOLDER).mkdir(exist_ok=True)

def standardise_cols(df):
    """Standardize column names and types"""
    # Convert column names to snake_case
    df.columns = df.columns.str.lower().str.replace(' ', '_')
    
    # Standardize specific columns
    col_map = {
        'steamid': 'steam_id',
        'username': 'name',
        'teamname': 'team'
    }
    
    # Rename columns if they exist
    for old_col, new_col in col_map.items():
        if old_col in df.columns:
            df = df.rename(columns={old_col: new_col})
    
    return df

def load_event(path):
    """Load a single event file"""
    try:
        print(f"Loading data from: {path}")
        df = pd.read_csv(path)
        # Standardize columns
        df = standardise_cols(df)
        # Add source file info
        df['source_file'] = os.path.basename(path)
        print(f"Loaded {len(df)} rows from {path}")
        return df
    except Exception as e:
        print(f"Error loading {path}: {e}")
        return None

def concat_events(folder=RAW_FOLDER):
    """Load and concatenate all event files"""
    # If raw_events folder doesn't exist, use attached_assets
    if not os.path.exists(folder):
        print(f"Folder {folder} not found, using attached_assets instead")
        folder = 'attached_assets'
    
    # Find all CSV files
    csv_paths = glob.glob(f"{folder}/*.csv")
    
    # If no files found, look for IEM_Katowice_2025 files specifically
    if not csv_paths:
        csv_paths = [CS_PLAYER_STATS_PATH]
        if os.path.exists(CS_ROUNDS_PATH):
            csv_paths.append(CS_ROUNDS_PATH)
    
    # Check if we found any files
    if not csv_paths:
        print("No CSV files found!")
        return None
    
    print(f"Found {len(csv_paths)} CSV files")
    
    # Load each file
    dfs = []
    for path in csv_paths:
        if os.path.exists(path):
            df = load_event(path)
            if df is not None:
                dfs.append(df)
        else:
            print(f"File not found: {path}")
    
    # Combine all data
    if not dfs:
        print("No data loaded!")
        return None
    
    # If we have player stats and rounds, process them separately
    player_stats_df = None
    rounds_df = None
    
    # Check if we have specific IEM Katowice files
    for df in dfs:
        source = df['source_file'].iloc[0]
        if 'player_stats' in source:
            player_stats_df = df
        elif 'rounds' in source:
            rounds_df = df
    
    # Process player stats
    if player_stats_df is not None:
        print("Processing player statistics...")
        # Extract only the necessary columns
        if 'steam_id' in player_stats_df.columns and 'name' in player_stats_df.columns and 'team' in player_stats_df.columns:
            # Basic player info and stats
            player_columns = ['steam_id', 'name', 'team']
            # Add all numeric columns (stats)
            for col in player_stats_df.columns:
                if col not in player_columns and pd.api.types.is_numeric_dtype(player_stats_df[col]):
                    player_columns.append(col)
            
            # Select columns and save
            player_df = player_stats_df[player_columns]
            player_df.to_parquet(f"{OUTPUT_FOLDER}/events.parquet", index=False)
            print(f"Saved {len(player_df)} player statistics to {OUTPUT_FOLDER}/events.parquet")
            
            # Return the dataframe for further processing
            return player_df
    
    # If we don't have specific files, just concatenate everything
    combined_df = pd.concat(dfs, ignore_index=True)
    print(f"Combined {len(combined_df)} rows from all files")
    
    # Save to parquet
    combined_df.to_parquet(f"{OUTPUT_FOLDER}/events.parquet", index=False)
    print(f"Saved combined data to {OUTPUT_FOLDER}/events.parquet")
    
    return combined_df

if __name__ == "__main__":
    # Load and clean data
    events_df = concat_events()
    
    if events_df is not None:
        print("Data processing complete.")
    else:
        print("Failed to process data.")
