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
# Default paths for IEM Katowice event
CS_KATOWICE_PLAYER_STATS_PATH = 'attached_assets/CS Data Points (IEM_Katowice_2025) - player_stats (IEM_Katowice_2025).csv'
CS_KATOWICE_ROUNDS_PATH = 'attached_assets/CS Data Points (IEM_Katowice_2025) - rounds (IEM_Katowice_2025).csv'
# New paths for PGL Bucharest event
CS_BUCHAREST_PLAYER_STATS_PATH = 'raw_events/PGL_Bucharest_2025/CS Data Points - player_stats (PGL_Bucharest_2025).csv'
CS_BUCHAREST_ROUNDS_PATH = 'raw_events/PGL_Bucharest_2025/CS Data Points - rounds (PGL_Bucharest_2025).csv'

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
        
        # Add event tag based on file path
        if 'IEM_Katowice_2025' in path:
            df['event'] = 'IEM_Katowice_2025'
        elif 'PGL_Bucharest_2025' in path:
            df['event'] = 'PGL_Bucharest_2025'
        else:
            df['event'] = 'unknown'
            
        print(f"Loaded {len(df)} rows from {path}")
        return df
    except Exception as e:
        print(f"Error loading {path}: {e}")
        return None

def concat_events(folder=RAW_FOLDER):
    """Load and concatenate all event files"""
    # Collect all CSV files from both events
    csv_paths = []
    
    # Add Katowice files if they exist
    if os.path.exists(CS_KATOWICE_PLAYER_STATS_PATH):
        csv_paths.append(CS_KATOWICE_PLAYER_STATS_PATH)
    if os.path.exists(CS_KATOWICE_ROUNDS_PATH):
        csv_paths.append(CS_KATOWICE_ROUNDS_PATH)
        
    # Add Bucharest files if they exist
    if os.path.exists(CS_BUCHAREST_PLAYER_STATS_PATH):
        csv_paths.append(CS_BUCHAREST_PLAYER_STATS_PATH)
    if os.path.exists(CS_BUCHAREST_ROUNDS_PATH):
        csv_paths.append(CS_BUCHAREST_ROUNDS_PATH)
    
    # Find any additional CSV files in raw_events folder and subfolders
    if os.path.exists(folder):
        # Look in subfolders too
        for root, dirs, files in os.walk(folder):
            for file in files:
                if file.endswith('.csv') and 'player_stats' in file:
                    file_path = os.path.join(root, file)
                    if file_path not in csv_paths:
                        csv_paths.append(file_path)
    
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
    
    # Process player_stats and rounds files separately
    player_stats_dfs = []
    rounds_dfs = []
    
    for df in dfs:
        source = df['source_file'].iloc[0]
        if 'player_stats' in source:
            player_stats_dfs.append(df)
        elif 'rounds' in source:
            rounds_dfs.append(df)
    
    # Combine all player stats files if we have multiple
    if player_stats_dfs:
        print(f"Combining {len(player_stats_dfs)} player_stats files")
        player_stats_df = pd.concat(player_stats_dfs, ignore_index=True)
    else:
        player_stats_df = None
        
    # Combine all rounds files if we have multiple
    if rounds_dfs:
        print(f"Combining {len(rounds_dfs)} rounds files")
        rounds_df = pd.concat(rounds_dfs, ignore_index=True)
    else:
        rounds_df = None
    
    # Process player stats
    if player_stats_df is not None:
        print("Processing player statistics...")
        # Extract only the necessary columns
        if 'steam_id' in player_stats_df.columns and 'name' in player_stats_df.columns and 'team' in player_stats_df.columns:
            # Basic player info and stats
            player_columns = ['steam_id', 'name', 'team', 'event', 'source_file']
            # Add all numeric columns (stats)
            for col in player_stats_df.columns:
                if col not in player_columns and pd.api.types.is_numeric_dtype(player_stats_df[col]):
                    player_columns.append(col)
            
            # Select columns and save
            player_df = player_stats_df[player_columns]
            player_df.to_parquet(f"{OUTPUT_FOLDER}/events.parquet", index=False)
            print(f"Saved {len(player_df)} player statistics to {OUTPUT_FOLDER}/events.parquet")
            
            # Process rounds data if available
            if rounds_df is not None:
                print("Processing round data...")
                # Save rounds data separately
                # Ensure the output folder exists
                Path(f"{OUTPUT_FOLDER}/rounds").mkdir(exist_ok=True)
                rounds_df.to_parquet(f"{OUTPUT_FOLDER}/rounds/rounds.parquet", index=False)
                print(f"Saved {len(rounds_df)} round statistics to {OUTPUT_FOLDER}/rounds/rounds.parquet")
            
            # Return the player dataframe for further processing
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
