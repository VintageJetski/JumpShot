#!/usr/bin/env python
# metrics/learn_weights.py - Learn optimal metric weights from match results

import pandas as pd
import numpy as np
from pathlib import Path
import os
from sklearn.linear_model import Ridge
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split

# File paths
INPUT_PATH = 'clean/metrics_ready.parquet'
MATCH_RESULTS_PATH = 'attached_assets/CS Data Points (IEM_Katowice_2025) - rounds (IEM_Katowice_2025).csv'
WEIGHTS_OUTPUT_PATH = 'clean/learned_weights.csv'
WEIGHTS_DAILY_OUTPUT_PATH = 'clean/weights/daily/learned_weights_{date}.csv'
WEIGHTS_LATEST_PATH = 'clean/weights/latest/learned_weights.csv'
TIR_OUTPUT_PATH = 'clean/team_impact_ratings.parquet'

# Import datetime for versioning
from datetime import datetime

# Ensure output directory exists
output_dir = os.path.dirname(WEIGHTS_OUTPUT_PATH)
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

def load_piv_data():
    """Load PIV data from parquet file"""
    print(f"Loading enriched data from {INPUT_PATH}")
    try:
        df = pd.read_parquet(INPUT_PATH)
        print(f"Loaded {len(df)} player records")
        return df
    except Exception as e:
        print(f"Error loading PIV data: {e}")
        return None

def load_match_results():
    """Load match results from CSV"""
    print(f"Loading match results from {MATCH_RESULTS_PATH}")
    try:
        # Load round results CSV
        rounds_df = pd.read_csv(MATCH_RESULTS_PATH)
        
        # Process to get win percentages per team per event
        rounds_df['round_win'] = rounds_df['round_winner'] == rounds_df['team']
        
        # Group by event and team to get win percentages
        match_results = rounds_df.groupby(['event', 'team'])['round_win'].mean().reset_index()
        match_results.rename(columns={'round_win': 'round_win_pct'}, inplace=True)
        
        print(f"Processed {len(match_results)} team-event combinations")
        return match_results
    except Exception as e:
        print(f"Error loading match results: {e}")
        return None

def calculate_team_metrics(piv_df):
    """Calculate team metrics from player PIV values"""
    print("Calculating team metrics")
    
    # Define the columns we want to aggregate for team metrics
    metric_cols = [
        'kd', 'piv', 'PIV_v14', 'ICF',
        'first_kill_success', 'flash_efficiency', 'utility_effectiveness',
        'site_control', 'trade_efficiency', 'impact_score'
    ]
    
    # Filter to only columns that exist in the dataframe
    available_cols = [col for col in metric_cols if col in piv_df.columns]
    
    # Group by event and team to get team-level metrics
    team_metrics = piv_df.groupby(['event', 'team'])[available_cols].mean().reset_index()
    
    # Add role balance metrics
    team_metrics = calculate_role_balance(team_metrics, piv_df)
    
    return team_metrics

def calculate_role_balance(team_df, player_df):
    """Calculate how balanced the team roles are"""
    print("Calculating team role balance")
    
    # Check if role column exists
    if 'role' not in player_df.columns:
        print("No role column found in player data, skipping role balance calculation")
        return team_df
    
    # Calculate role distribution for each team
    # Group by team and role, count, then pivot
    role_counts = player_df.groupby(['team', 'role']).size().unstack(fill_value=0)
    
    # Calculate role balance metrics
    # 1. Role diversity - number of different roles in the team
    role_counts['role_diversity'] = (role_counts > 0).sum(axis=1)
    
    # 2. Role balance - how evenly distributed roles are
    # Normalized entropy: higher values mean more balanced
    def role_entropy(row):
        probs = row[row > 0] / row.sum()
        return -(probs * np.log(probs)).sum() / np.log(len(probs)) if len(probs) > 1 else 0
    
    role_counts['role_balance'] = role_counts.apply(lambda row: role_entropy(row.iloc[:-1]), axis=1)
    
    # Get just the role metrics
    role_metrics = role_counts[['role_diversity', 'role_balance']].reset_index()
    
    # Merge with team_df
    result = pd.merge(team_df, role_metrics, on='team', how='left')
    
    return result

def calculate_team_impact_rating(team_metrics_df, match_results_df=None):
    """Calculate Team Impact Rating (TIR) from team metrics"""
    print("Calculating Team Impact Rating (TIR)")
    
    # If we don't have match results, we can't train weights
    if match_results_df is None or match_results_df.empty:
        print("No match results available, using default weights")
        # Use default weights
        weights = {
            'kd': 0.3,
            'piv': 0.4,
            'PIV_v14': 0.5,
            'role_balance': 0.2,
            'role_diversity': 0.1,
            'ICF': 0.3,
            'first_kill_success': 0.25,
            'flash_efficiency': 0.2,
            'utility_effectiveness': 0.15,
            'site_control': 0.2,
            'trade_efficiency': 0.15,
            'impact_score': 0.3
        }
    else:
        print("Training weights from match results")
        # Prepare data for training
        X = team_metrics_df.set_index(['event', 'team'])
        
        # Set index on match results
        y = match_results_df.set_index(['event', 'team'])['round_win_pct']
        
        # Keep only rows where we have both metrics and results
        common_index = X.index.intersection(y.index)
        X = X.loc[common_index]
        y = y.loc[common_index]
        
        # Select only numeric features
        numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
        X = X[numeric_cols]
        
        # Replace any NaN values
        X = X.fillna(0)
        
        # Normalize features
        scaler = MinMaxScaler()
        X_scaled = scaler.fit_transform(X)
        X_scaled = pd.DataFrame(X_scaled, index=X.index, columns=X.columns)
        
        # Train a Ridge regression model
        model = Ridge(alpha=1.0)
        model.fit(X_scaled, y)
        
        # Get weights from model coefficients
        weights = dict(zip(X.columns, model.coef_))
        
        # Normalize weights to be positive and sum to 1
        # First, shift all weights to be positive
        min_weight = min(weights.values())
        if min_weight < 0:
            for k in weights:
                weights[k] = weights[k] - min_weight
                
        # Then normalize to sum to 1
        weight_sum = sum(weights.values())
        if weight_sum > 0:
            for k in weights:
                weights[k] = weights[k] / weight_sum
                
        # Save weights to CSV with metadata
        today = datetime.now().strftime("%Y-%m-%d")
        version = datetime.now().strftime("%Y%m%d%H%M")
        
        weights_df = pd.DataFrame(list(weights.items()), columns=['feature', 'weight'])
        weights_df = weights_df.sort_values('weight', ascending=False)
        
        # Add metadata
        metadata = pd.DataFrame([
            {'feature': 'metadata_version', 'weight': version},
            {'feature': 'metadata_date', 'weight': today},
            {'feature': 'metadata_samples', 'weight': len(X)}
        ])
        
        # Combine metadata and weights
        weights_df = pd.concat([metadata, weights_df], ignore_index=True)
        
        # Save to standard location
        weights_df.to_csv(WEIGHTS_OUTPUT_PATH, index=False)
        print(f"Saved learned weights to {WEIGHTS_OUTPUT_PATH}")
        
        # Save daily versioned copy
        daily_path = WEIGHTS_DAILY_OUTPUT_PATH.format(date=today)
        os.makedirs(os.path.dirname(daily_path), exist_ok=True)
        weights_df.to_csv(daily_path, index=False)
        print(f"Saved daily versioned weights to {daily_path}")
        
        # Save latest version for frontend to access
        latest_dir = os.path.dirname(WEIGHTS_LATEST_PATH)
        os.makedirs(latest_dir, exist_ok=True)
        weights_df.to_csv(WEIGHTS_LATEST_PATH, index=False)
        print(f"Saved latest weights for frontend to {WEIGHTS_LATEST_PATH}")
        print("\nTop features by weight:")
        print(weights_df.head(10))
    
    # Calculate TIR using the weights (either learned or default)
    # 1. Get available columns
    available_weighted_cols = [col for col in weights.keys() if col in team_metrics_df.columns]
    
    # 2. Apply weights to each column
    for col in available_weighted_cols:
        team_metrics_df[f'weighted_{col}'] = team_metrics_df[col] * weights.get(col, 0)
    
    # 3. Sum weighted columns to get TIR
    weighted_cols = [f'weighted_{col}' for col in available_weighted_cols]
    team_metrics_df['TIR'] = team_metrics_df[weighted_cols].sum(axis=1)
    
    # 4. Normalize TIR to 0-1 scale
    min_tir = team_metrics_df['TIR'].min()
    max_tir = team_metrics_df['TIR'].max()
    team_metrics_df['TIR_normalized'] = (team_metrics_df['TIR'] - min_tir) / (max_tir - min_tir)
    
    return team_metrics_df

def generate_match_predictions(tir_df, match_results_df=None):
    """Generate match predictions based on TIR"""
    print("Generating match predictions")
    
    # Get unique events and teams
    events = tir_df['event'].unique()
    
    predictions = []
    
    for event in events:
        event_teams = tir_df[tir_df['event'] == event]
        teams = event_teams['team'].unique()
        
        # Generate all possible matchups
        for i, team1 in enumerate(teams):
            for team2 in teams[i+1:]:
                team1_tir = event_teams[event_teams['team'] == team1]['TIR_normalized'].values[0]
                team2_tir = event_teams[event_teams['team'] == team2]['TIR_normalized'].values[0]
                
                # Calculate win probability based on TIR difference
                # Using a simple logistic function to convert TIR difference to probability
                tir_diff = team1_tir - team2_tir
                team1_win_prob = 1 / (1 + np.exp(-5 * tir_diff))  # 5 controls the steepness
                
                predictions.append({
                    'event': event,
                    'team1': team1,
                    'team2': team2,
                    'team1_tir': team1_tir,
                    'team2_tir': team2_tir,
                    'team1_win_probability': team1_win_prob,
                    'predicted_winner': team1 if team1_win_prob > 0.5 else team2
                })
    
    predictions_df = pd.DataFrame(predictions)
    
    # If we have actual match results, we can calculate prediction accuracy
    if match_results_df is not None and not match_results_df.empty:
        print("Calculating prediction accuracy")
        # TODO: Implement prediction accuracy calculation
    
    return predictions_df

def main():
    # Load player data
    piv_df = load_piv_data()
    if piv_df is None:
        print("Failed to load PIV data. Exiting.")
        return
    
    # Load match results
    match_results = load_match_results()
    
    # Calculate team metrics
    team_metrics = calculate_team_metrics(piv_df)
    
    # Calculate Team Impact Rating
    tir_df = calculate_team_impact_rating(team_metrics, match_results)
    
    # Save TIR data
    tir_df.to_parquet(TIR_OUTPUT_PATH)
    print(f"Saved Team Impact Ratings to {TIR_OUTPUT_PATH}")
    
    # Generate match predictions
    predictions = generate_match_predictions(tir_df, match_results)
    print("\nSample match predictions:")
    if not predictions.empty:
        print(predictions.head())

if __name__ == "__main__":
    main()
