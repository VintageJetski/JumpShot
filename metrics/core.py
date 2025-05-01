#!/usr/bin/env python
# metrics/core.py - Calculate core metrics from event data
import pandas as pd
import numpy as np
from pathlib import Path
import os

# File paths
INPUT_PATH = 'clean/events.parquet'
OUTPUT_PATH = 'clean/enriched.parquet'

# Ensure output directory exists
output_dir = os.path.dirname(OUTPUT_PATH)
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

def load_data():
    """Load data from clean/events.parquet"""
    print(f"Loading data from {INPUT_PATH}")
    try:
        df = pd.read_parquet(INPUT_PATH)
        print(f"Loaded {len(df)} rows from {INPUT_PATH}")
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def calculate_core_metrics(df):
    """Calculate and add core metrics to the dataframe"""
    print("Calculating core metrics...")
    
    # Check if dataframe is empty
    if df is None or df.empty:
        print("No data to process!")
        return None
    
    # Make a copy to avoid modifying the original
    df = df.copy()
    
    # Map column names to standardized names
    col_map = {
        'user_name': 'name',
        'team_clan_name': 'team',
        'username': 'name',
        'teamname': 'team',
        'flahes_thrown': 'flashes_thrown',
        'firstkills': 'first_kills',
        'firstdeaths': 'first_deaths'
    }
    
    # Rename columns if they exist
    for old_col, new_col in col_map.items():
        if old_col in df.columns and new_col not in df.columns:
            df = df.rename(columns={old_col: new_col})
    
    # Ensure required columns exist
    required_cols = ['steam_id', 'name', 'team']
    missing_cols = [col for col in required_cols if col not in df.columns]
    if missing_cols:
        print(f"Missing required columns: {missing_cols}")
        return None
    
    # Calculate KD ratio if kills and deaths columns exist
    if 'kills' in df.columns and 'deaths' in df.columns:
        df['kd'] = df['kills'] / df['deaths'].replace(0, 1)  # Avoid division by zero
    
    # Calculate headshot percentage if headshots and kills columns exist
    if 'headshots' in df.columns and 'kills' in df.columns:
        df['hs_percent'] = (df['headshots'] / df['kills'].replace(0, 1)) * 100
    
    # Calculate first kill ratio if firstKills and firstDeaths columns exist
    if 'firstkills' in df.columns and 'firstdeaths' in df.columns:
        df['first_kill_ratio'] = df['firstkills'] / (df['firstkills'] + df['firstdeaths']).replace(0, 1)
    
    # Standardize column names if needed
    col_map = {
        'firstkills': 'first_kills',
        'firstdeaths': 'first_deaths',
        'totalkills': 'kills',
        'totaldeaths': 'deaths',
        'username': 'name',
        'teamname': 'team'
    }
    
    # Rename columns if they exist
    for old_col, new_col in col_map.items():
        if old_col in df.columns and new_col not in df.columns:
            df = df.rename(columns={old_col: new_col})
    
    # Calculate first kill success rate
    if 'first_kills' in df.columns and 'first_deaths' in df.columns:
        total_first_duels = df['first_kills'] + df['first_deaths']
        df['first_kill_success'] = df['first_kills'] / total_first_duels.replace(0, 1)
    
    # Calculate utility metrics if available
    utility_cols = ['flashesthrown', 'hethrown', 'smokesthrown', 'infernosthrown']
    renamed_utility = ['flashes_thrown', 'he_thrown', 'smokes_thrown', 'infernos_thrown']
    
    # Rename utility columns if needed
    for i, old_col in enumerate(utility_cols):
        if old_col in df.columns and renamed_utility[i] not in df.columns:
            df = df.rename(columns={old_col: renamed_utility[i]})
    
    # Calculate total utility thrown
    utility_cols = [col for col in renamed_utility if col in df.columns]
    if utility_cols:
        df['total_utility'] = df[utility_cols].sum(axis=1)
    
    # Calculate flash efficiency if available
    if 'flashes_thrown' in df.columns and 'assisted_flashes' in df.columns:
        df['flash_efficiency'] = df['assisted_flashes'] / df['flashes_thrown'].replace(0, 1)
    elif 'flahes_thrown' in df.columns and 'assisted_flashes' in df.columns:  # Note: 'flahes_thrown' is misspelled in the CSV
        df['flash_efficiency'] = df['assisted_flashes'] / df['flahes_thrown'].replace(0, 1)
    elif 'flashesthrown' in df.columns and 'assistedflashes' in df.columns:
        df['flash_efficiency'] = df['assistedflashes'] / df['flashesthrown'].replace(0, 1)
    
    # Calculate impact score (composite metric)
    if all(col in df.columns for col in ['kd', 'first_kill_success']):
        df['impact_score'] = 0.5 * df['kd'] + 0.3 * df['first_kill_success']
        # Add flash efficiency component if available
        if 'flash_efficiency' in df.columns:
            df['impact_score'] = 0.4 * df['kd'] + 0.3 * df['first_kill_success'] + 0.2 * df['flash_efficiency']
    
    # Calculate entry ratio if appropriate columns exist
    if 'first_kills' in df.columns and 'first_deaths' in df.columns:
        entries = df['first_kills'] + df['first_deaths']
        df['entry_ratio'] = np.where(entries > 0, df['first_kills'] / entries, 0.5)
    
    # Calculate utility effectiveness (simplified proxy)
    if 'assists' in df.columns and 'total_utility' in df.columns:
        df['utility_effectiveness'] = df['assists'] / (df['total_utility'] + 1)
        # Scale to a reasonable range (0-1)
        if 'utility_effectiveness' in df.columns:
            max_ue = df['utility_effectiveness'].max()
            if max_ue > 0:
                df['utility_effectiveness'] = df['utility_effectiveness'] / max_ue
    
    # Calculate consistency metric (placeholder based on KD variance proxy)
    if 'kd' in df.columns:
        # Group by team to calculate team averages and variance proxies
        team_groups = df.groupby('team')
        
        # Function to calculate consistency within a team
        def icf_calc(sub):
            team_kd_mean = sub['kd'].mean()
            # Estimate variance - this is just a placeholder without real match-by-match data
            # In a real implementation, we would calculate the standard deviation across matches
            player_kd_diff = abs(sub['kd'] - team_kd_mean) / team_kd_mean
            # Invert so higher values mean more consistent
            return 1.0 - player_kd_diff.clip(0, 0.9)
        
        # Apply the function to each player within their team
        df['consistency'] = df.groupby('team')['kd'].transform(lambda x: 1.0 - (abs(x - x.mean()) / x.mean()).clip(0, 0.9))
    
    # Normalize metrics to a 0-1 scale for easier comparison
    metrics_to_normalize = ['kd', 'impact_score', 'flash_efficiency', 'entry_ratio', 'utility_effectiveness']
    
    # Drop any NaN values that might have been introduced
    df = df.fillna(0)
    
    print(f"Calculated core metrics for {len(df)} players")
    return df

def normalize_team_metrics(df):
    """Normalize metrics within teams"""
    print("Normalizing metrics within teams...")
    
    if 'team' not in df.columns:
        print("Team column not found, skipping team normalization")
        return df
    
    # List of metrics to normalize within teams
    metrics = ['kd', 'impact_score', 'first_kill_success', 'flash_efficiency', 'utility_effectiveness', 'consistency']
    metrics = [m for m in metrics if m in df.columns]
    
    # Group by team and normalize each metric
    for metric in metrics:
        # Calculate mean and std within each team
        team_mean = df.groupby('team')[metric].transform('mean')
        team_std = df.groupby('team')[metric].transform('std').fillna(1)  # Avoid division by zero
        
        # Z-score normalization within team
        normalized_name = f'{metric}_team_normalized'
        df[normalized_name] = (df[metric] - team_mean) / team_std
        
        # Scale to 0-1 range for the entire dataset
        min_val = df[normalized_name].min()
        max_val = df[normalized_name].max()
        if max_val > min_val:  # Avoid division by zero
            df[normalized_name] = (df[normalized_name] - min_val) / (max_val - min_val)
    
    print(f"Normalized team metrics for {len(df)} players")
    return df

def main():
    # Load data
    df = load_data()
    if df is None:
        print("Failed to load data from parquet file.")
        return
    
    # Calculate core metrics
    df = calculate_core_metrics(df)
    if df is None:
        print("Failed to calculate core metrics.")
        return
    
    # Normalize metrics within teams
    df = normalize_team_metrics(df)
    
    # Save to parquet
    print(f"Saving enriched data to {OUTPUT_PATH}")
    df.to_parquet(OUTPUT_PATH, index=False)
    print(f"Saved enriched data with {len(df)} rows")

if __name__ == "__main__":
    main()
