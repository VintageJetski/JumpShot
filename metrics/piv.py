#!/usr/bin/env python
# metrics/piv.py - Player Impact Value calculation
import pandas as pd
import numpy as np
from pathlib import Path

# File paths
INPUT_PATH = 'clean/enriched.parquet'
OUTPUT_PATH = 'clean/piv.parquet'

# Role enum mapping (to match TypeScript enum in schema.ts)
ROLES = {
    'AWP': 1,
    'Lurker': 2,
    'Support': 3,
    'Spacetaker': 4,
    'Anchor': 5,
    'Rotator': 6,
    'IGL': 7
}

def get_role_name(role_id):
    """Convert role ID to role name"""
    role_map = {v: k for k, v in ROLES.items()}
    return role_map.get(role_id, 'Unknown')

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

def load_role_assignments():
    """Load role assignments from CSV"""
    roles_path = 'attached_assets/CS2dkbasics - Teams and roles.csv'
    print(f"Loading role assignments from {roles_path}")
    try:
        roles_df = pd.read_csv(roles_path)
        # Clean up player names for better matching
        roles_df['player'] = roles_df['player'].str.strip()
        print(f"Loaded {len(roles_df)} role assignments")
        return roles_df
    except Exception as e:
        print(f"Error loading role assignments: {e}. Will assign default roles.")
        return None

def assign_player_roles(df, roles_df=None):
    """Assign roles to players based on provided role assignments or heuristics"""
    print("Assigning roles to players...")
    
    if roles_df is not None:
        # Create role assignment map
        role_map = {}
        for _, row in roles_df.iterrows():
            player_name = row['player']
            role_info = {
                'team': row['team'] if 'team' in row else None,
                'is_igl': row['is_igl'] if 'is_igl' in row else False,
                't_role': row['t_role'] if 't_role' in row else None,
                'ct_role': row['ct_role'] if 'ct_role' in row else None
            }
            role_map[player_name] = role_info
        
        # Assign roles from map
        for idx, player in df.iterrows():
            player_name = player['user_name']
            
            # Simple exact match
            if player_name in role_map:
                role_info = role_map[player_name]
                df.at[idx, 'is_igl'] = role_info['is_igl']
                df.at[idx, 't_role'] = ROLES.get(role_info['t_role'], ROLES['Support'])
                df.at[idx, 'ct_role'] = ROLES.get(role_info['ct_role'], ROLES['Rotator'])
                df.at[idx, 'primary_role'] = determine_primary_role(df.at[idx, 't_role'], df.at[idx, 'ct_role'], df.at[idx, 'is_igl'])
            else:
                # Fuzzy match implementation would go here
                # For now, we'll assign default roles
                df.at[idx, 'is_igl'] = False
                df.at[idx, 't_role'] = ROLES['Support']
                df.at[idx, 'ct_role'] = ROLES['Rotator']
                df.at[idx, 'primary_role'] = determine_primary_role(df.at[idx, 't_role'], df.at[idx, 'ct_role'], df.at[idx, 'is_igl'])
    else:
        # No role assignments provided, use heuristics
        for idx, player in df.iterrows():
            # Heuristics for role assignment
            awp_score = 0.5  # Default score
            spacetaker_score = 0.5
            
            # Check for AWP tendencies
            if 'awp_kills' in df.columns:
                awp_score = player['awp_kills'] / player['kills'] if player['kills'] > 0 else 0.1
            
            # Check for Entry/Spacetaker tendencies
            if 'first_kills' in df.columns and 'first_deaths' in df.columns:
                entry_attempts = player['first_kills'] + player['first_deaths']
                spacetaker_score = player['first_kills'] / entry_attempts if entry_attempts > 0 else 0.3
            
            # Check for Support tendencies (high flash assists)
            support_score = 0.5
            if 'assisted_flashes' in df.columns:
                support_score = player['assisted_flashes'] / player['kills'] if player['kills'] > 0 else 0.3
            
            # Assign roles based on scores
            if awp_score > 0.3:
                # High AWP usage - likely AWPer
                df.at[idx, 't_role'] = ROLES['AWP']
                df.at[idx, 'ct_role'] = ROLES['AWP']
            elif spacetaker_score > 0.6:
                # Good entry success - likely Spacetaker
                df.at[idx, 't_role'] = ROLES['Spacetaker']
                df.at[idx, 'ct_role'] = ROLES['Anchor']
            elif support_score > 0.4:
                # High flash assists - likely Support
                df.at[idx, 't_role'] = ROLES['Support']
                df.at[idx, 'ct_role'] = ROLES['Rotator']
            else:
                # Default roles
                df.at[idx, 't_role'] = ROLES['Lurker']
                df.at[idx, 'ct_role'] = ROLES['Rotator']
            
            # Default IGL flag (no way to detect from stats)
            df.at[idx, 'is_igl'] = False
            
            # Determine primary role
            df.at[idx, 'primary_role'] = determine_primary_role(df.at[idx, 't_role'], df.at[idx, 'ct_role'], df.at[idx, 'is_igl'])
    
    return df

def determine_primary_role(t_role, ct_role, is_igl=False):
    """Determine primary role based on T and CT roles"""
    if is_igl:
        return ROLES['IGL']
    elif t_role == ROLES['AWP'] or ct_role == ROLES['AWP']:
        return ROLES['AWP']
    elif t_role == ROLES['Spacetaker']:
        return ROLES['Spacetaker']
    elif t_role == ROLES['Lurker']:
        return ROLES['Lurker']
    elif ct_role == ROLES['Anchor']:
        return ROLES['Anchor']
    else:
        return ROLES['Support']  # Default to Support

def calculate_role_metrics(df):
    """Calculate role-specific metrics for PIV"""
    print("Calculating role-specific metrics...")
    
    # Initialize core metric columns if they don't exist
    core_metrics = ['rcs', 'icf', 'sc', 'osm', 'piv', 'ct_piv', 't_piv']
    for metric in core_metrics:
        if metric not in df.columns:
            df[metric] = 0.0
    
    # Calculate metrics for each player
    for idx, player in df.iterrows():
        # Get roles
        t_role = player['t_role']
        ct_role = player['ct_role']
        primary_role = player['primary_role']
        is_igl = player['is_igl']
        
        # For ease of reference
        t_role_name = get_role_name(t_role)
        ct_role_name = get_role_name(ct_role)
        primary_role_name = get_role_name(primary_role)
        
        # Calculate role-specific metrics
        # T-side metrics
        t_role_metrics = calculate_t_side_metrics(player, t_role_name)
        
        # CT-side metrics
        ct_role_metrics = calculate_ct_side_metrics(player, ct_role_name)
        
        # Overall metrics (combined T and CT)
        overall_metrics = combine_side_metrics(t_role_metrics, ct_role_metrics, primary_role_name, is_igl)
        
        # Store the metrics
        df.at[idx, 'rcs'] = overall_metrics['rcs']
        df.at[idx, 'icf'] = overall_metrics['icf']
        df.at[idx, 'sc'] = overall_metrics['sc']
        df.at[idx, 'osm'] = overall_metrics['osm']
        df.at[idx, 'piv'] = overall_metrics['piv']
        df.at[idx, 'ct_piv'] = ct_role_metrics['piv']
        df.at[idx, 't_piv'] = t_role_metrics['piv']
        
        # Add detailed metrics for UI
        df.at[idx, 'detailed_metrics'] = {
            'overall': overall_metrics,
            't_side': t_role_metrics,
            'ct_side': ct_role_metrics
        }
    
    return df

def calculate_t_side_metrics(player, role):
    """Calculate T-side role-specific metrics"""
    metrics = {}
    
    # Base metrics every role has
    metrics['kd'] = player['kd'] if 'kd' in player else 1.0
    metrics['first_kill_success'] = player['t_first_kill_success'] if 't_first_kill_success' in player else 0.5
    
    # Calculate Role Core Score (RCS)
    rcs_value = calculate_rcs(metrics, role, 'T')
    
    # Calculate Individual Consistency Factor (ICF)
    icf_value = calculate_icf(player, player['is_igl'])
    
    # Calculate Synergy Contribution (SC)
    sc_value = calculate_sc(player, role, 'T')
    
    # Calculate Opponent Strength Multiplier (OSM)
    osm_value = calculate_osm()
    
    # Calculate basic metrics score
    basic_score = calculate_basic_metrics_score(player, role, 'T')
    
    # Calculate PIV
    piv_value = calculate_piv(rcs_value, icf_value, sc_value, osm_value, metrics['kd'], basic_score, role)
    
    # Return all metrics
    return {
        'role': role,
        'metrics': metrics,
        'rcs': rcs_value,
        'icf': icf_value,
        'sc': sc_value,
        'osm': osm_value,
        'basic_score': basic_score,
        'piv': piv_value
    }

def calculate_ct_side_metrics(player, role):
    """Calculate CT-side role-specific metrics"""
    metrics = {}
    
    # Base metrics every role has
    metrics['kd'] = player['kd'] if 'kd' in player else 1.0
    metrics['first_kill_success'] = player['ct_first_kill_success'] if 'ct_first_kill_success' in player else 0.5
    
    # Calculate Role Core Score (RCS)
    rcs_value = calculate_rcs(metrics, role, 'CT')
    
    # Calculate Individual Consistency Factor (ICF)
    icf_value = calculate_icf(player, player['is_igl'])
    
    # Calculate Synergy Contribution (SC)
    sc_value = calculate_sc(player, role, 'CT')
    
    # Calculate Opponent Strength Multiplier (OSM)
    osm_value = calculate_osm()
    
    # Calculate basic metrics score
    basic_score = calculate_basic_metrics_score(player, role, 'CT')
    
    # Calculate PIV
    piv_value = calculate_piv(rcs_value, icf_value, sc_value, osm_value, metrics['kd'], basic_score, role)
    
    # Return all metrics
    return {
        'role': role,
        'metrics': metrics,
        'rcs': rcs_value,
        'icf': icf_value,
        'sc': sc_value,
        'osm': osm_value,
        'basic_score': basic_score,
        'piv': piv_value
    }

def combine_side_metrics(t_metrics, ct_metrics, primary_role, is_igl):
    """Combine T and CT side metrics with appropriate weighting"""
    # Different weighting for IGL vs non-IGL
    if is_igl:
        # IGL weighting: 50% IGL, 25% T-side role, 25% CT-side role
        weights = {'t': 0.25, 'ct': 0.25}
        # Add IGL-specific metrics here
        igl_metrics = {
            'rcs': 0.7,  # Higher baseline for IGL
            'icf': 0.75,  # Lower baseline as fragging is less critical
            'sc': 0.85,  # Higher synergy contribution
            'osm': 1.0
        }
        piv = 0.5 * calculate_piv(igl_metrics['rcs'], igl_metrics['icf'], igl_metrics['sc'], igl_metrics['osm']) + \
              weights['t'] * t_metrics['piv'] + weights['ct'] * ct_metrics['piv']
        
        return {
            'role': 'IGL',
            'metrics': {},  # Combined metrics would go here
            'rcs': 0.5 * igl_metrics['rcs'] + weights['t'] * t_metrics['rcs'] + weights['ct'] * ct_metrics['rcs'],
            'icf': 0.5 * igl_metrics['icf'] + weights['t'] * t_metrics['icf'] + weights['ct'] * ct_metrics['icf'],
            'sc': 0.5 * igl_metrics['sc'] + weights['t'] * t_metrics['sc'] + weights['ct'] * ct_metrics['sc'],
            'osm': igl_metrics['osm'],
            'piv': piv
        }
    else:
        # Non-IGL weighting: 50% T-side role, 50% CT-side role
        weights = {'t': 0.5, 'ct': 0.5}
        
        # Basic weighted average
        return {
            'role': primary_role,
            'metrics': {},  # Combined metrics would go here
            'rcs': weights['t'] * t_metrics['rcs'] + weights['ct'] * ct_metrics['rcs'],
            'icf': weights['t'] * t_metrics['icf'] + weights['ct'] * ct_metrics['icf'],
            'sc': weights['t'] * t_metrics['sc'] + weights['ct'] * ct_metrics['sc'],
            'osm': max(t_metrics['osm'], ct_metrics['osm']),  # Use higher of the two
            'piv': weights['t'] * t_metrics['piv'] + weights['ct'] * ct_metrics['piv']
        }

def calculate_rcs(metrics, role, side):
    """Calculate Role Core Score (RCS)"""
    # Role-specific weighting of metrics
    weights = {
        'AWP': {
            'kd': 0.35,  # Reduced from 0.5
            'first_kill_success': 0.22,  # Reduced from 0.28
            'utility': 0.15,  # Added utility component
            'T': {'kd': 0.4, 'first_kill_success': 0.4, 'utility': 0.2},
            'CT': {'kd': 0.3, 'first_kill_success': 0.3, 'utility': 0.1, 'site_lockdown': 0.3}
        },
        'Spacetaker': {
            'kd': 0.3,
            'first_kill_success': 0.4,
            'utility': 0.1,
            'T': {'kd': 0.2, 'first_kill_success': 0.5, 'utility': 0.3},
            'CT': {'kd': 0.4, 'first_kill_success': 0.3, 'utility': 0.3}
        },
        'Lurker': {
            'kd': 0.4,
            'first_kill_success': 0.1,
            'utility': 0.1,
            'T': {'kd': 0.4, 'first_kill_success': 0.1, 'utility': 0.1, 'flanking': 0.4},
            'CT': {'kd': 0.4, 'first_kill_success': 0.2, 'utility': 0.2, 'rotation': 0.2}
        },
        'Support': {
            'kd': 0.2,
            'first_kill_success': 0.1,
            'utility': 0.4,
            'T': {'kd': 0.2, 'first_kill_success': 0.1, 'utility': 0.5, 'assists': 0.2},
            'CT': {'kd': 0.2, 'first_kill_success': 0.2, 'utility': 0.4, 'retake': 0.2}
        },
        'Anchor': {
            'kd': 0.3,
            'first_kill_success': 0.25,
            'utility': 0.25,
            'T': {'kd': 0.3, 'first_kill_success': 0.3, 'utility': 0.4},
            'CT': {'kd': 0.3, 'first_kill_success': 0.2, 'utility': 0.2, 'site_defense': 0.3}
        },
        'Rotator': {
            'kd': 0.3,
            'first_kill_success': 0.2,
            'utility': 0.2,
            'T': {'kd': 0.3, 'first_kill_success': 0.3, 'utility': 0.4},
            'CT': {'kd': 0.3, 'first_kill_success': 0.2, 'utility': 0.2, 'rotation_timing': 0.3}
        },
        'IGL': {
            'kd': 0.1,
            'first_kill_success': 0.1,
            'utility': 0.2,
            'leadership': 0.6,
            'T': {'kd': 0.1, 'first_kill_success': 0.1, 'utility': 0.3, 'leadership': 0.5},
            'CT': {'kd': 0.1, 'first_kill_success': 0.1, 'utility': 0.3, 'leadership': 0.5}
        }
    }
    
    # Select weights based on role and side
    if role in weights and side in weights[role]:
        side_weights = weights[role][side]
    else:
        # Default weights
        side_weights = {'kd': 0.5, 'first_kill_success': 0.3, 'utility': 0.2}
    
    # Apply weights to metrics
    rcs = 0
    total_weight = 0
    
    for metric, weight in side_weights.items():
        if metric in metrics:
            rcs += metrics[metric] * weight
            total_weight += weight
    
    # If no metrics were applied, use a default value
    if total_weight == 0:
        return 0.5
    
    # Normalize by total weight applied
    return rcs / total_weight

def calculate_icf(player, is_igl=False):
    """Calculate Individual Consistency Factor (ICF)"""
    # Base value adjusted for role
    base_icf = 0.7 if is_igl else 0.8
    
    # Sigma (standard deviation) affects consistency
    sigma = 0.1  # Default low variance
    
    # Adjust for high-fragging players
    if 'kd' in player and player['kd'] > 1.3:
        # Higher weight to K/D for star players
        kd_bonus = min((player['kd'] - 1.0) * 0.15, 0.2)  # Cap at 0.2 bonus
        base_icf += kd_bonus
    
    # Consistency indicator (lower is more consistent)
    if 'consistency' in player:
        # Consistency is already calculated in core.py
        consistency_modifier = player['consistency'] * 0.1  # Scale to have minor impact
        base_icf += consistency_modifier
        sigma = 0.3 * (1 - player['consistency'])  # Lower consistency = higher sigma
    
    # Cap ICF at 0.95
    icf = min(base_icf, 0.95)
    
    return {'value': icf, 'sigma': sigma}

def calculate_sc(player, role, side):
    """Calculate Synergy Contribution (SC)"""
    # Default SC
    base_sc = 0.6
    key_metric = 'Default Synergy'
    
    # Role-specific SC calculations
    if role == 'AWP':
        if 'first_kill_success' in player:
            sc_value = player['first_kill_success'] * 0.8 + 0.2  # Scale from 0.2-1.0
            key_metric = 'AWP Impact Rating'
            return {'value': sc_value, 'metric': key_metric}
        
    elif role == 'Spacetaker':
        if 'first_kill_success' in player and side == 'T':
            sc_value = player['first_kill_success'] * 0.7 + 0.3  # Scale from 0.3-1.0
            key_metric = 'Entry Success Rate'
            return {'value': sc_value, 'metric': key_metric}
        
    elif role == 'Support':
        if 'utility_effectiveness' in player:
            sc_value = player['utility_effectiveness'] * 0.6 + 0.4  # Scale from 0.4-1.0
            key_metric = 'Team Setup Rating'
            return {'value': sc_value, 'metric': key_metric}
        
    elif role == 'Lurker':
        if 'impact_score' in player:
            sc_value = player['impact_score'] * 0.6 + 0.3  # Scale from 0.3-0.9
            key_metric = 'Timing Disruption'
            return {'value': sc_value, 'metric': key_metric}
        
    elif role == 'Anchor' and side == 'CT':
        # Estimate site defense capability
        if 'kd' in player:
            sc_value = min(player['kd'] * 0.4 + 0.4, 0.9)  # Scale from 0.4-0.9
            key_metric = 'Site Defense Rating'
            return {'value': sc_value, 'metric': key_metric}
        
    elif role == 'Rotator' and side == 'CT':
        # Estimate rotation effectiveness
        if 'kd' in player and 'utility_effectiveness' in player:
            sc_value = (player['kd'] * 0.3 + player['utility_effectiveness'] * 0.5) * 0.8 + 0.2  # Scale from 0.2-1.0
            key_metric = 'Rotation Effectiveness'
            return {'value': sc_value, 'metric': key_metric}
        
    elif role == 'IGL':
        # IGL has a high base SC for team coordination
        sc_value = 0.8
        key_metric = 'Team Coordination'
        return {'value': sc_value, 'metric': key_metric}
    
    # Default if no role-specific calculation
    return {'value': base_sc, 'metric': key_metric}

def calculate_osm():
    """Calculate Opponent Strength Multiplier (OSM)"""
    # For this implementation, use a fixed value
    # In a real system, this would be based on opponent rankings
    return 1.0

def calculate_basic_metrics_score(player, role, side):
    """Calculate basic metrics score based on role from CS2dkbasics weightings"""
    # Default score
    base_score = 0.5
    
    # Role-specific basic metrics scoring
    if role == 'AWP':
        if 'kd' in player and 'first_kill_success' in player:
            # AWPer prioritizes KD and first kill success
            score = player['kd'] * 0.4 + player['first_kill_success'] * 0.4 + 0.2  # 0.2-1.0 scale
            return min(max(score, 0.2), 1.0)  # Clamp between 0.2 and 1.0
        
    elif role == 'Spacetaker' and side == 'T':
        if 'first_kill_success' in player and 'kd' in player:
            # Entry prioritizes first kill success heavily
            score = player['first_kill_success'] * 0.6 + player['kd'] * 0.2 + 0.2  # 0.2-1.0 scale
            return min(max(score, 0.2), 1.0)  # Clamp between 0.2 and 1.0
        
    elif role == 'Support':
        if 'utility_effectiveness' in player and 'assists' in player and 'kills' in player:
            # Support prioritizes utility and assists
            assist_ratio = player['assists'] / player['kills'] if player['kills'] > 0 else 0.5
            score = player['utility_effectiveness'] * 0.5 + assist_ratio * 0.3 + 0.2  # 0.2-1.0 scale
            return min(max(score, 0.3), 1.0)  # Clamp between 0.3 and 1.0
    
    # Default scoring if no specific formula matches
    if 'kd' in player:
        return min(max(player['kd'] * 0.3 + 0.3, 0.3), 0.9)  # 0.3-0.9 scale
    else:
        return base_score

def calculate_piv(rcs, icf, sc, osm, kd=1.0, basic_score=0.5, role='Support'):
    """Calculate Player Impact Value (PIV)"""
    # Extract values from objects if needed
    rcs_value = rcs['value'] if isinstance(rcs, dict) else rcs
    icf_value = icf['value'] if isinstance(icf, dict) else icf
    sc_value = sc['value'] if isinstance(sc, dict) else sc
    
    # Role-specific modifiers
    role_modifiers = {
        'AWP': 0.90,        # Slightly reduce AWP impact (already high KD)
        'Support': 1.08,    # Boost Support (often undervalued)
        'IGL': 1.05,        # Boost IGL (leadership value)
        'Spacetaker': 1.03  # Slightly boost Spacetakers (high risk role)
    }
    
    # Get string role name if it's a number
    role_name = role
    if isinstance(role, int):
        role_name = get_role_name(role)
    
    # Apply role modifier
    modifier = role_modifiers.get(role_name, 1.0)
    
    # Calculate Raw PIV
    raw_piv = (rcs_value * 0.35 + icf_value * 0.25 + sc_value * 0.25 + basic_score * 0.15) * osm
    
    # Apply KD scaling for extreme values (rewards very high KD)
    kd_scaling = 1.0
    if kd > 1.3:
        kd_scaling = 1.0 + (kd - 1.3) * 0.15  # Bonus for high KD
        kd_scaling = min(kd_scaling, 1.3)      # Cap at 30% bonus
    
    # Apply modifiers
    final_piv = raw_piv * kd_scaling * modifier
    
    # Cap PIV at a reasonable maximum (4.0)
    return min(max(final_piv, 0.5), 4.0)

def main():
    # Load enriched data
    df = load_enriched_data()
    if df is None:
        print("Failed to load enriched data. Exiting.")
        return
    
    # Load role assignments
    roles_df = load_role_assignments()
    
    # Assign roles
    df = assign_player_roles(df, roles_df)
    
    # Calculate PIV metrics
    df = calculate_role_metrics(df)
    
    # Save PIV data
    print(f"Saving PIV data to {OUTPUT_PATH}")
    df.to_parquet(OUTPUT_PATH)
    print(f"Saved {len(df)} player records with PIV calculations")

if __name__ == "__main__":
    main()
