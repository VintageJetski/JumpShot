#!/usr/bin/env python
# metrics/piv_v14.py - Calculate PIV v1.4 with recalibrated methodology
import pandas as pd
import numpy as np
from pathlib import Path
import os

# File paths
INPUT_PATH = 'clean/enriched.parquet'
ROLES_CSV_PATH = 'attached_assets/CS2dkbasics - Roles Metrics Weights (1).csv'
OUTPUT_PATH = 'clean/piv.parquet'

# Ensure output directory exists
output_dir = os.path.dirname(OUTPUT_PATH)
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

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

def load_role_weights():
    """Load role weightings table from CSV"""
    print(f"Loading role weights from {ROLES_CSV_PATH}")
    try:
        # Load weights CSV and skip header row
        w = pd.read_csv(ROLES_CSV_PATH, skiprows=1)
        w.columns = ['role', 'metric', 'weight', 'definition']
        
        # Convert to pivot table format for easier lookup
        role_weights = w.pivot_table(index='role', columns='metric', values='weight', aggfunc='first')
        print(f"Loaded weights for {len(role_weights)} roles")
        return role_weights
    except Exception as e:
        print(f"Error loading role weights: {e}")
        return None

def assign_roles(df):
    """Assign roles to players based on their stats"""
    print("Assigning roles to players...")
    
    # Check if we already have a role assignment CSV
    role_assignments_path = 'attached_assets/CS2dkbasics - Teams and roles.csv'
    
    try:
        if os.path.exists(role_assignments_path):
            # Load role assignments
            roles_df = pd.read_csv(role_assignments_path)
            
            # Create mapping from player name to role
            role_map = {}
            for _, row in roles_df.iterrows():
                if 'Player' in row and 'Primary Role' in row:
                    role_map[row['Player']] = row['Primary Role']
            
            # Assign roles based on mapping
            df['assigned_role'] = df['name'].map(role_map)
            
            # Fill missing roles with default
            missing_roles = 0
            if 'assigned_role' in df.columns:
                missing_roles = df['assigned_role'].isna().sum()
                if missing_roles > 0:
                    print(f"Warning: {missing_roles} players have no assigned role, using defaults")
            
            # Default role assignment based on stats
            mask = df['assigned_role'].isna()
            df.loc[mask & (df['kd'] > 1.3), 'assigned_role'] = 'AWP'
            df.loc[mask & (df['first_kill_success'] > 0.6) & (df['kd'] <= 1.3), 'assigned_role'] = 'Entry'
            df.loc[mask & (df['flash_efficiency'] > 0.3) & (df['kd'] <= 1.3), 'assigned_role'] = 'Support'
            df.loc[mask & (df['assigned_role'].isna()), 'assigned_role'] = 'Flex'
                
            assigned_count = len(df) - (df['assigned_role'].isna().sum())
            print(f"Assigned roles from mapping file to {assigned_count} players")
            
        else:
            # Default role assignment based on stats
            df['assigned_role'] = 'Flex'  # Default
            df.loc[df['kd'] > 1.3, 'assigned_role'] = 'AWP'
            df.loc[(df['first_kill_success'] > 0.6) & (df['kd'] <= 1.3), 'assigned_role'] = 'Entry'
            df.loc[(df['flash_efficiency'] > 0.3) & (df['kd'] <= 1.3), 'assigned_role'] = 'Support'
            
            print("No role mapping file found, assigned default roles based on stats")
    
    except Exception as e:
        print(f"Error assigning roles: {e}")
        # Fall back to simple role assignment
        df['assigned_role'] = 'Flex'  # Default
        df.loc[df['kd'] > 1.3, 'assigned_role'] = 'AWP'
    
    # Ensure all players have an assigned role
    if 'assigned_role' not in df.columns or df['assigned_role'].isna().any():
        print("Warning: Some players still have no assigned role, setting to 'Flex'")
        df['assigned_role'] = df['assigned_role'].fillna('Flex')
    
    return df

def calculate_icf(df):
    """Calculate Individual Consistency Factor (ICF)"""
    print("Calculating ICF...")
    
    # Use the consistency column if it exists
    if 'consistency' in df.columns:
        df['ICF'] = df['consistency'].clip(0.4, 1.0)
    else:
        # Default ICF calculation based on KD variance within team
        df['ICF'] = df.groupby('team')['kd'].transform(
            lambda x: 1.0 - ((x - x.mean()).abs() / x.mean()).clip(0, 0.6))
    
    return df

def calculate_osm(df):
    """Calculate Opponent Strength Multiplier (OSM)"""
    print("Calculating OSM...")
    
    # For this implementation, we'll use a default value
    # In a real implementation, this would be based on opponent rankings
    df['OSM'] = 1.0
    
    return df

def calculate_piv_v14(df, role_weights):
    """Calculate PIV v1.4 using the new methodology"""
    print("Calculating PIV v1.4...")
    
    # Ensure we have role weights
    if role_weights is None:
        print("No role weights available, using default weights")
        # Create default weights
        default_roles = ['AWP', 'Entry', 'Support', 'Flex', 'IGL']
        default_metrics = ['kd', 'impact_score', 'flash_efficiency', 'first_kill_success', 'utility_effectiveness']
        role_weights = pd.DataFrame(index=default_roles, columns=default_metrics).fillna(0.2)
    
    # Function to calculate PIV for each row based on assigned role
    def piv_row(row):
        role = row['assigned_role']
        
        # Handle missing roles in the weights table
        if role not in role_weights.index:
            print(f"Warning: Role '{role}' not found in weights table, using 'Flex' instead")
            role = 'Flex'
        
        # Get weights for this role, dropping NaN values
        rw = role_weights.loc[role].dropna()
        
        # Calculate base score by adding weighted metrics
        score = 0
        for metric, weight in rw.items():
            if metric in row and not pd.isna(row[metric]):
                score += row[metric] * weight
            
        # Apply consistency bonus (additive with tanh limiter)
        if 'ICF' in row and not pd.isna(row['ICF']):
            score *= (1 + 0.1 * np.tanh(row['ICF'] - 1))
        
        # Apply opponent strength multiplier (additive with tanh limiter)
        if 'OSM' in row and not pd.isna(row['OSM']):
            score *= (1 + 0.05 * np.tanh(row['OSM'] - 1))
        
        return score
    
    # Apply the PIV calculation to each row
    df['PIV_v14'] = df.apply(piv_row, axis=1)
    
    # Ensure PIV is within a reasonable range
    df['PIV_v14'] = df['PIV_v14'].clip(0.5, 3.0)
    
    # For backward compatibility, also set 'piv' column
    df['piv'] = df['PIV_v14']
    
    return df

def main():
    # Load enriched data
    df = load_enriched_data()
    if df is None:
        print("Failed to load enriched data. Exiting.")
        return
    
    # Load role weights
    role_weights = load_role_weights()
    
    # Assign roles to players
    df = assign_roles(df)
    
    # Calculate ICF and OSM
    df = calculate_icf(df)
    df = calculate_osm(df)
    
    # Calculate PIV v1.4
    df = calculate_piv_v14(df, role_weights)
    
    # Save PIV data
    print(f"Saving PIV data to {OUTPUT_PATH}")
    df.to_parquet(OUTPUT_PATH, index=False)
    print(f"Saved {len(df)} player records with PIV v1.4 calculations")

if __name__ == "__main__":
    main()
