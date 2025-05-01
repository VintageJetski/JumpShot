#!/usr/bin/env python
# metrics/core.py - Core metrics calculation and data enrichment
import pandas as pd
import numpy as np
from pathlib import Path

# File paths
INPUT_PATH = 'clean/events.parquet'
OUTPUT_PATH = 'clean/enriched.parquet'

def load_data():
    """Load data from clean/events.parquet"""
    print(f"Loading data from {INPUT_PATH}")
    try:
        df = pd.read_parquet(INPUT_PATH)
        print(f"Loaded {len(df)} player records")
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return None

def calculate_core_metrics(df):
    """Calculate and add core metrics to the dataframe"""
    print("Calculating core metrics...")
    
    # Ensure required columns exist
    required_cols = ['kills', 'deaths', 'assists', 'headshots']
    for col in required_cols:
        if col not in df.columns:
            print(f"Warning: Required column '{col}' not found in data")
            df[col] = 0
    
    # Calculate or fix KD ratio if not present or incorrect
    if 'kd' not in df.columns:
        print("Adding KD ratio column")
        df['kd'] = df['kills'] / df['deaths'].replace(0, 1)  # Avoid division by zero
    
    # Add KAST if we have the data (Kill, Assist, Survived, Traded)
    if all(col in df.columns for col in ['rounds_survived', 'times_traded']):
        df['kast'] = ((df['kills'] + df['assists'] + df['rounds_survived'] + df['times_traded']) / 
                      df['total_rounds_played']).clip(0, 1)
    else:
        # Estimate KAST from available data
        print("Estimating KAST from available data")
        total_rounds = df['total_rounds_won'] + df['deaths']
        df['kast'] = ((df['kills'] + df['assists'] + (total_rounds - df['deaths'])) / 
                     total_rounds).clip(0, 1)  # Clip to 0-1 range
    
    # Headshot percentage
    df['hs_percentage'] = (df['headshots'] / df['kills']).fillna(0) * 100
    
    # First kill success rate
    if all(col in df.columns for col in ['first_kills', 'first_deaths']):
        df['first_kill_success'] = df['first_kills'] / (df['first_kills'] + df['first_deaths']).replace(0, 1)
        
        # Calculate T-side and CT-side First Kill Success separately
        if all(col in df.columns for col in ['t_first_kills', 't_first_deaths', 'ct_first_kills', 'ct_first_deaths']):
            df['t_first_kill_success'] = df['t_first_kills'] / (df['t_first_kills'] + df['t_first_deaths']).replace(0, 1)
            df['ct_first_kill_success'] = df['ct_first_kills'] / (df['ct_first_kills'] + df['ct_first_deaths']).replace(0, 1)
    
    # Utility metrics
    if 'total_utility_thrown' in df.columns:
        # Calculate utility effectiveness if we have that data
        utility_effects = ['flashes_that_led_to_kill', 'enemies_flashed', 'damage_by_he', 'incendiary_damage']
        has_utility_effect = all(col in df.columns for col in utility_effects)
        
        if has_utility_effect:
            df['utility_effectiveness'] = (
                df['flashes_that_led_to_kill'] * 2 + 
                df['enemies_flashed'] * 0.5 + 
                df['damage_by_he'] / 100 + 
                df['incendiary_damage'] / 100
            ) / df['total_utility_thrown'].replace(0, 1)  # Normalize by utility used
        else:
            # Basic utility estimate based on available data
            df['utility_effectiveness'] = 0.5  # Default moderate effectiveness
    
    # Add consistency measure (standard deviation of kills per round)
    # This is a placeholder since we don't have round-by-round data
    # The lower the better for consistency (less variance)
    df['consistency'] = 1 - (df['deaths'] / df['kills'].replace(0, 1)).clip(0, 1) * 0.5
    
    # Calculate impact (higher impact = higher rating)
    # Impact factors in first kills, multi-kills, and clutches
    impact_cols = [
        'first_kills', 'wallbang_kills', 'no_scope', 'through_smoke',
        'blind_kills', 'headshots'
    ]
    
    # Only use columns that exist in our data
    available_impact_cols = [col for col in impact_cols if col in df.columns]
    
    # Calculate impact score from available metrics
    if available_impact_cols:
        # Normalize each metric before summing
        for col in available_impact_cols:
            col_norm = f"{col}_norm"
            df[col_norm] = df[col] / df[col].max().replace(0, 1)
        
        # Calculate impact score as weighted sum of normalized metrics
        impact_norm_cols = [f"{col}_norm" for col in available_impact_cols]
        df['impact_score'] = df[impact_norm_cols].sum(axis=1) / len(impact_norm_cols)
        
        # Clean up temporary columns
        df.drop(columns=impact_norm_cols, inplace=True)
    else:
        # Fallback if no impact metrics are available
        df['impact_score'] = df['kd'] * 0.5 + 0.5  # Simple estimate based on KD
    
    return df

def normalize_team_metrics(df):
    """Normalize metrics within teams"""
    print("Normalizing metrics within teams...")
    
    # List of metrics to normalize
    metrics_to_normalize = [
        'kd', 'kast', 'impact_score', 'first_kill_success',
        'utility_effectiveness', 'consistency'
    ]
    
    # Only use metrics that exist in our data
    available_metrics = [m for m in metrics_to_normalize if m in df.columns]
    
    # Normalize metrics within each team
    team_normalized = []
    for team_name, team_df in df.groupby('team_clan_name'):
        for metric in available_metrics:
            norm_col = f"{metric}_team_norm"
            max_val = team_df[metric].max()
            if max_val > 0:  # Avoid division by zero
                team_df[norm_col] = team_df[metric] / max_val
            else:
                team_df[norm_col] = 0.5  # Default if all values are zero
        
        team_normalized.append(team_df)
    
    # Combine all teams back into a single dataframe
    if team_normalized:
        return pd.concat(team_normalized)
    else:
        return df

def main():
    # Load data
    df = load_data()
    if df is None:
        print("Failed to load data. Exiting.")
        return
    
    # Calculate core metrics
    df = calculate_core_metrics(df)
    
    # Normalize team metrics
    df = normalize_team_metrics(df)
    
    # Save enriched data
    print(f"Saving enriched data to {OUTPUT_PATH}")
    df.to_parquet(OUTPUT_PATH)
    print(f"Saved {len(df)} enriched player records")

if __name__ == "__main__":
    main()
