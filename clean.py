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

# IEM Katowice 2025 data
IEM_PLAYER_STATS_PATH = 'attached_assets/CS Data Points (IEM_Katowice_2025) - player_stats (IEM_Katowice_2025).csv'
IEM_ROUNDS_PATH = 'attached_assets/CS Data Points (IEM_Katowice_2025) - rounds (IEM_Katowice_2025).csv'

# PGL Bucharest 2025 data
PGL_PLAYER_STATS_PATH = 'attached_assets/CS Data Points - player_stats (PGL_Bucharest_2025).csv'
PGL_ROUNDS_PATH = 'attached_assets/CS Data Points - rounds (PGL_Bucharest_2025).csv'

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
        'teamname': 'team',
        'team_clan_name': 'team',
        'user_name': 'name'
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
    
    # If no files found, look in attached_assets for all events
    if not csv_paths:
        # First add IEM Katowice data
        csv_paths = []
        if os.path.exists(IEM_PLAYER_STATS_PATH):
            csv_paths.append(IEM_PLAYER_STATS_PATH)
        if os.path.exists(IEM_ROUNDS_PATH):
            csv_paths.append(IEM_ROUNDS_PATH)
        
        # Add PGL Bucharest data
        if os.path.exists(PGL_PLAYER_STATS_PATH):
            csv_paths.append(PGL_PLAYER_STATS_PATH)
        if os.path.exists(PGL_ROUNDS_PATH):
            csv_paths.append(PGL_ROUNDS_PATH)
    
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
    
    # Group data frames by type
    player_stats_dfs = []
    rounds_dfs = []
    
    # Sort data frames into appropriate categories
    for df in dfs:
        source = df['source_file'].iloc[0]
        # Check for player stats files based on column names
        if 'steam_id' in df.columns and 'kills' in df.columns and 'deaths' in df.columns:
            print(f"Detected player stats in {source}")
            player_stats_dfs.append(df)
        # Check for rounds files based on column names
        elif 'round_num' in df.columns and 'winner' in df.columns and 'winner_clan_name' in df.columns:
            print(f"Detected rounds data in {source}")
            rounds_dfs.append(df)
        # Fall back to filename pattern matching if column detection fails
        elif 'player_stats' in source:
            print(f"Detected player stats by filename: {source}")
            player_stats_dfs.append(df)
        elif 'rounds' in source:
            print(f"Detected rounds by filename: {source}")
            rounds_dfs.append(df)
    
    # Process player stats if we have any
    if player_stats_dfs:
        print(f"Processing player statistics from {len(player_stats_dfs)} sources...")
        
        # Concatenate all player stats first
        if len(player_stats_dfs) > 1:
            player_stats_df = pd.concat(player_stats_dfs, ignore_index=True)
            print(f"Combined {len(player_stats_df)} player records from multiple sources")
        else:
            player_stats_df = player_stats_dfs[0]
        
        # Make sure we have required columns
        if 'steam_id' in player_stats_df.columns and 'name' in player_stats_df.columns and 'team' in player_stats_df.columns:
            # Basic player info and stats
            player_columns = ['steam_id', 'name', 'team', 'source_file']
            # Add all numeric columns (stats)
            for col in player_stats_df.columns:
                if col not in player_columns and pd.api.types.is_numeric_dtype(player_stats_df[col]):
                    player_columns.append(col)
            
            # Select columns and save
            player_df = player_stats_df[player_columns]
            player_df.to_parquet(f"{OUTPUT_FOLDER}/events.parquet", index=False)
            print(f"Saved {len(player_df)} player statistics to {OUTPUT_FOLDER}/events.parquet")
            
            # Process rounds data if we have any
            if rounds_dfs:
                print(f"Processing rounds data from {len(rounds_dfs)} sources...")
                
                # Concatenate all rounds data
                if len(rounds_dfs) > 1:
                    rounds_df = pd.concat(rounds_dfs, ignore_index=True)
                    print(f"Combined {len(rounds_df)} round records from multiple sources")
                else:
                    rounds_df = rounds_dfs[0]
                
                # Save rounds data
                rounds_df.to_parquet(f"{OUTPUT_FOLDER}/rounds.parquet", index=False)
                print(f"Saved {len(rounds_df)} round records to {OUTPUT_FOLDER}/rounds.parquet")
            
            # Return the player data for further processing
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
