#!/usr/bin/env python
# metrics/learn_weights.py - Learn weights for metric components using match results
import pandas as pd
import numpy as np
from pathlib import Path
import glob
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

# File paths
PIV_PATH = 'clean/piv.parquet'
MATCH_RESULTS_PATH = 'attached_assets/match_results.csv'  # Not yet created - placeholder
OUTPUT_PATH = 'clean/learned_weights.csv'

def load_piv_data():
    """Load PIV data from parquet file"""
    print(f"Loading PIV data from {PIV_PATH}")
    try:
        df = pd.read_parquet(PIV_PATH)
        print(f"Loaded {len(df)} player records")
        return df
    except Exception as e:
        print(f"Error loading PIV data: {e}")
        return None

def load_match_results():
    """Load match results from CSV"""
    print(f"Looking for match results file...")
    
    # Check if the file exists
    if not Path(MATCH_RESULTS_PATH).exists():
        print(f"Match results file not found at {MATCH_RESULTS_PATH}")
        return None
    
    try:
        df = pd.read_csv(MATCH_RESULTS_PATH)
        print(f"Loaded {len(df)} match results")
        return df
    except Exception as e:
        print(f"Error loading match results: {e}")
        return None

def calculate_team_metrics(piv_df):
    """Calculate team metrics from player PIV values"""
    print("Calculating team metrics...")
    
    team_metrics = []
    
    for team_name, team_df in piv_df.groupby('team_clan_name'):
        # Basic team metrics
        team_data = {
            'team_name': team_name,
            'player_count': len(team_df),
            'avg_piv': team_df['piv'].mean(),
            'max_piv': team_df['piv'].max(),
            'min_piv': team_df['piv'].min(),
            'piv_spread': team_df['piv'].max() - team_df['piv'].min(),
            'ct_avg_piv': team_df['ct_piv'].mean() if 'ct_piv' in team_df else team_df['piv'].mean(),
            't_avg_piv': team_df['t_piv'].mean() if 't_piv' in team_df else team_df['piv'].mean(),
            'avg_kd': team_df['kd'].mean() if 'kd' in team_df else 1.0,
        }
        
        # Count roles
        if 'primary_role' in team_df.columns:
            for role_id in range(1, 8):  # Assuming 7 roles (1-7)
                role_count = (team_df['primary_role'] == role_id).sum()
                team_data[f'role_{role_id}_count'] = role_count
        
        # Add team balance metrics
        team_data['role_balance'] = calculate_role_balance(team_df)
        team_data['star_player_delta'] = team_df['piv'].nlargest(2).iloc[0] - team_df['piv'].nlargest(2).iloc[1] if len(team_df) >= 2 else 0
        
        team_metrics.append(team_data)
    
    return pd.DataFrame(team_metrics)

def calculate_role_balance(team_df):
    """Calculate how balanced the team roles are"""
    if 'primary_role' not in team_df.columns:
        return 0.5  # Default balance score
    
    # Count players in each role
    role_counts = team_df['primary_role'].value_counts()
    
    # Ideal distribution depends on the total players
    # For a 5-player team, we'd want certain distributions of roles
    if len(team_df) == 5:
        # Check for key roles (AWP, IGL, Spacetaker)
        has_awp = (1 in role_counts) and (role_counts[1] == 1)  # Exactly 1 AWPer
        has_igl = (7 in role_counts) and (role_counts[7] == 1)  # Exactly 1 IGL
        has_spacetaker = (4 in role_counts) and (role_counts[4] >= 1)  # At least 1 Spacetaker
        
        # Calculate balance score
        balance = 0.5  # Base score
        if has_awp:
            balance += 0.1
        if has_igl:
            balance += 0.2
        if has_spacetaker:
            balance += 0.1
        
        # Add penalty for duplicate roles (except Support)
        duplicate_roles = sum(count > 1 for role, count in role_counts.items() if role != 3)  # Role 3 is Support
        balance -= duplicate_roles * 0.05
        
        return min(max(balance, 0.3), 0.9)  # Clamp between 0.3 and 0.9
    else:
        # For non-standard team sizes
        return 0.5

def calculate_team_impact_rating(team_metrics_df, match_results_df=None):
    """Calculate Team Impact Rating (TIR) from team metrics"""
    print("Calculating Team Impact Rating (TIR)...")
    
    # Create a copy of the dataframe to avoid modifying the original
    tir_df = team_metrics_df.copy()
    
    # If we have match results, use them to learn weights
    if match_results_df is not None and len(match_results_df) > 0:
        print("Learning weights from match results...")
        
        # Prepare training data
        X = team_metrics_df[['avg_piv', 'role_balance', 'piv_spread', 'avg_kd']].values
        
        # Extract win rates from match results
        team_win_rates = {}
        for _, match in match_results_df.iterrows():
            if match['team1'] not in team_win_rates:
                team_win_rates[match['team1']] = {'wins': 0, 'matches': 0}
            if match['team2'] not in team_win_rates:
                team_win_rates[match['team2']] = {'wins': 0, 'matches': 0}
            
            team_win_rates[match['team1']]['matches'] += 1
            team_win_rates[match['team2']]['matches'] += 1
            
            if match['winner'] == match['team1']:
                team_win_rates[match['team1']]['wins'] += 1
            elif match['winner'] == match['team2']:
                team_win_rates[match['team2']]['wins'] += 1
        
        # Convert to win rate and create target variable
        y = []
        for team_name in team_metrics_df['team_name']:
            if team_name in team_win_rates and team_win_rates[team_name]['matches'] > 0:
                win_rate = team_win_rates[team_name]['wins'] / team_win_rates[team_name]['matches']
                y.append(win_rate)
            else:
                y.append(0.5)  # Default win rate
        
        y = np.array(y)
        
        # Prepare for model training
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Handle edge case with too few samples
        if len(y) < 10:
            print("Warning: Too few match results for reliable weight learning")
            weights = np.array([0.5, 0.2, 0.1, 0.2])  # Default weights
        else:
            # Split data and train model
            X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)
            model = LinearRegression()
            model.fit(X_train, y_train)
            
            # Get learned coefficients
            coeffs = model.coef_
            total = np.sum(np.abs(coeffs))
            if total > 0:
                weights = np.abs(coeffs) / total  # Normalize to sum to 1
            else:
                weights = np.array([0.5, 0.2, 0.1, 0.2])  # Default weights
            
            # Report model accuracy
            train_score = model.score(X_train, y_train)
            test_score = model.score(X_test, y_test)
            print(f"Model R² - Train: {train_score:.3f}, Test: {test_score:.3f}")
        
        # Save learned weights
        weight_df = pd.DataFrame({
            'metric': ['avg_piv', 'role_balance', 'piv_spread', 'avg_kd'],
            'weight': weights
        })
        weight_df.to_csv(OUTPUT_PATH, index=False)
        print(f"Saved learned weights to {OUTPUT_PATH}")
    else:
        print("No match results available. Using default weights.")
        # Default weights if no match results
        weights = np.array([0.5, 0.2, 0.1, 0.2])
    
    # Calculate TIR using weights
    tir_df['tir'] = (
        weights[0] * tir_df['avg_piv'] + 
        weights[1] * tir_df['role_balance'] + 
        weights[2] * (1 - tir_df['piv_spread']/2) + # Lower spread is better
        weights[3] * tir_df['avg_kd']
    )
    
    # Scale TIR to a nicer range (70-130)
    min_tir, max_tir = tir_df['tir'].min(), tir_df['tir'].max()
    if min_tir < max_tir:  # Avoid division by zero
        tir_df['tir_scaled'] = 70 + 60 * (tir_df['tir'] - min_tir) / (max_tir - min_tir)
    else:
        tir_df['tir_scaled'] = 100  # Default value
    
    # Round to 2 decimal places
    tir_df['tir'] = tir_df['tir'].round(2)
    tir_df['tir_scaled'] = tir_df['tir_scaled'].round(2)
    
    return tir_df

def generate_match_predictions(tir_df, match_results_df=None):
    """Generate match predictions based on TIR"""
    print("Generating match predictions...")
    
    # Create team TIR lookup dictionary
    team_tir = {row['team_name']: row['tir_scaled'] for _, row in tir_df.iterrows()}
    
    predictions = []
    
    # If we have match results, validate against them
    if match_results_df is not None:
        for _, match in match_results_df.iterrows():
            team1 = match['team1']
            team2 = match['team2']
            
            # Get TIR values
            team1_tir = team_tir.get(team1, 100)
            team2_tir = team_tir.get(team2, 100)
            
            # Calculate win probability based on TIR difference
            tir_diff = team1_tir - team2_tir
            # S-curve probability model
            team1_win_prob = 1 / (1 + np.exp(-0.05 * tir_diff))
            
            # Compare with actual result
            actual_winner = match['winner']
            predicted_winner = team1 if team1_win_prob > 0.5 else team2
            is_correct = (predicted_winner == actual_winner)
            
            predictions.append({
                'team1': team1,
                'team2': team2,
                'team1_tir': team1_tir,
                'team2_tir': team2_tir,
                'team1_win_prob': round(team1_win_prob, 2),
                'team2_win_prob': round(1 - team1_win_prob, 2),
                'predicted_winner': predicted_winner,
                'actual_winner': actual_winner,
                'is_correct': is_correct
            })
    
    # If we have predictions, calculate accuracy
    if predictions:
        pred_df = pd.DataFrame(predictions)
        accuracy = pred_df['is_correct'].mean()
        print(f"Prediction accuracy: {accuracy:.2f} on {len(pred_df)} matches")
    else:
        print("No match results for prediction validation")
    
    # Return full TIR dataframe
    return tir_df

def main():
    # Load PIV data
    piv_df = load_piv_data()
    if piv_df is None:
        print("Failed to load PIV data. Exiting.")
        return
    
    # Load match results if available
    match_results_df = load_match_results()
    
    # Calculate team metrics
    team_metrics_df = calculate_team_metrics(piv_df)
    
    # Calculate Team Impact Rating (TIR)
    tir_df = calculate_team_impact_rating(team_metrics_df, match_results_df)
    
    # Generate match predictions
    final_df = generate_match_predictions(tir_df, match_results_df)
    
    # Save final TIR data
    final_df.to_csv('clean/team_tir.csv', index=False)
    print(f"Saved team TIR data to clean/team_tir.csv")

if __name__ == "__main__":
    main()
