#!/usr/bin/env python
# insights/api.py - Flask API for serving CS2 analytics
from flask import Blueprint, request, jsonify
import pandas as pd
import numpy as np
from pathlib import Path
import os
import json
from datetime import datetime

# File paths
EVENTS_PATH = 'clean/events.parquet'
ENRICHED_PATH = 'clean/enriched.parquet'
PIV_PATH = 'clean/piv.parquet'
WEIGHTS_PATH = 'clean/weights/latest/learned_weights.csv'

# Global data stores
players_df = None
teams_df = None

# Create blueprint
api = Blueprint('api', __name__)

def load_data():
    """Load data from parquet files - called at startup and when refresh happens"""
    global players_df, teams_df
    
    try:
        print("Loading player data...")
        if os.path.exists(PIV_PATH):
            players_df = pd.read_parquet(PIV_PATH)
            print(f"Loaded {len(players_df)} players with PIV data")
        elif os.path.exists(ENRICHED_PATH):
            players_df = pd.read_parquet(ENRICHED_PATH)
            print(f"Loaded {len(players_df)} players from enriched data (no PIV)")
        elif os.path.exists(EVENTS_PATH):
            players_df = pd.read_parquet(EVENTS_PATH)
            print(f"Loaded {len(players_df)} players from basic events data")
        else:
            print("No player data found!")
            players_df = pd.DataFrame()
        
        # Create teams dataframe from player data
        if not players_df.empty and 'team' in players_df.columns:
            teams = players_df['team'].unique()
            teams_df = pd.DataFrame({'name': teams})
            teams_df['id'] = teams_df['name'].str.lower().str.replace(' ', '-')
            # Default TIR
            teams_df['tir'] = 1.0
            print(f"Created teams dataframe with {len(teams_df)} teams")
        else:
            teams_df = pd.DataFrame()
            print("No team data created")
        
        return True
    except Exception as e:
        print(f"Error loading data: {e}")
        return False

@api.route('/players', methods=['GET'])
def players():
    """Return all players with optional field filtering"""
    global players_df
    
    # Check if data is loaded
    if players_df is None or players_df.empty:
        if not load_data():
            return jsonify({"error": "Failed to load player data"}), 500
    
    # Get fields parameter for filtering
    fields = request.args.get('fields')
    if fields:
        field_list = fields.split(',')
        # Ensure 'id' is included
        if 'id' not in field_list and 'steam_id' in players_df.columns:
            field_list.append('steam_id')
        # Filter to only requested fields that exist in the dataframe
        field_list = [f for f in field_list if f in players_df.columns]
        filtered_df = players_df[field_list]
    else:
        filtered_df = players_df
        
    # Add PIV_v14 to filtered_df if it exists in the original dataframe but not in filtered
    if 'PIV_v14' in players_df.columns and 'PIV_v14' not in filtered_df.columns:
        filtered_df = filtered_df.assign(PIV_v14=players_df['PIV_v14'])
    
    # Convert DataFrame to list of dictionaries for JSON response
    players_list = filtered_df.to_dict(orient='records')
    
    # Ensure each player has a proper ID
    for player in players_list:
        if 'id' not in player and 'steam_id' in player:
            player['id'] = player['steam_id']
    
    return jsonify(players_list)

@api.route('/player/<steam_id>', methods=['GET'])
def player(steam_id):
    """Return a single player by steam_id"""
    global players_df
    
    # Check if data is loaded
    if players_df is None or players_df.empty:
        if not load_data():
            return jsonify({"error": "Failed to load player data"}), 500
    
    # Find player by steam_id
    if 'steam_id' in players_df.columns:
        player_row = players_df[players_df['steam_id'] == steam_id]
    else:
        return jsonify({"error": "Steam ID column not found in data"}), 404
    
    # Check if player exists
    if len(player_row) == 0:
        return jsonify({"error": f"Player with steam_id {steam_id} not found"}), 404
    
    # Convert single row to dictionary
    player_data = player_row.iloc[0].to_dict()
    
    # Add PIV_v14 if it exists in the original dataframe but not in the player data
    if 'PIV_v14' in players_df.columns and 'PIV_v14' not in player_data:
        player_data['PIV_v14'] = float(players_df.loc[player_row.index[0], 'PIV_v14'])
    
    # Ensure player has an ID
    if 'id' not in player_data:
        player_data['id'] = steam_id
    
    return jsonify(player_data)

@api.route('/teams', methods=['GET'])
def teams():
    """Return all teams with their TIR"""
    global teams_df
    
    # Check if data is loaded
    if teams_df is None or teams_df.empty:
        if not load_data():
            return jsonify({"error": "Failed to load team data"}), 500
    
    # Get fields parameter for filtering
    fields = request.args.get('fields')
    if fields:
        field_list = fields.split(',')
        # Ensure 'id' is included
        if 'id' not in field_list:
            field_list.append('id')
        # Filter to only requested fields that exist in the dataframe
        field_list = [f for f in field_list if f in teams_df.columns]
        filtered_df = teams_df[field_list]
    else:
        filtered_df = teams_df
    
    # Convert DataFrame to list of dictionaries for JSON response
    teams_list = filtered_df.to_dict(orient='records')
    
    return jsonify(teams_list)

@api.route('/team/<team_name>', methods=['GET'])
def team(team_name):
    """Return a single team by name"""
    global teams_df, players_df
    
    # Check if data is loaded
    if teams_df is None or teams_df.empty or players_df is None or players_df.empty:
        if not load_data():
            return jsonify({"error": "Failed to load team data"}), 500
    
    # Try to match by ID first (lowercase with hyphens)
    team_id = team_name.lower().replace(' ', '-')
    team_row = teams_df[teams_df['id'] == team_id]
    
    # If not found, try by name
    if len(team_row) == 0:
        team_row = teams_df[teams_df['name'] == team_name]
    
    # Check if team exists
    if len(team_row) == 0:
        return jsonify({"error": f"Team '{team_name}' not found"}), 404
    
    # Get team data
    team_data = team_row.iloc[0].to_dict()
    
    # Get all players for this team
    if 'team' in players_df.columns:
        team_players = players_df[players_df['team'] == team_data['name']]
        team_data['players'] = team_players.to_dict(orient='records')
    else:
        team_data['players'] = []
    
    return jsonify(team_data)

@api.route('/lineup/synergy', methods=['POST'])
def lineup_synergy():
    """Calculate synergy matrix for a set of players"""
    # Get player IDs from request
    data = request.get_json()
    if not data or 'playerIds' not in data:
        return jsonify({"error": "playerIds array is required"}), 400
    
    player_ids = data['playerIds']
    if not isinstance(player_ids, list) or len(player_ids) < 2:
        return jsonify({"error": "At least two playerIds are required"}), 400
    
    # Calculate synergy matrix
    synergy_data = synergy_matrix(player_ids)
    
    return jsonify(synergy_data)

@api.route('/recommend/replacement', methods=['POST'])
def recommend_replacement():
    """Recommend player replacements for a team based on PIV impact"""
    # Get request data
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400
        
    # Team to find replacements for
    if 'teamId' not in data:
        return jsonify({"error": "teamId is required"}), 400
    team_id = data['teamId']
    
    # Optional player pool (if not provided, use all players not in the team)
    candidate_pool = data.get('candidatePool', [])
    
    # Optional role to replace
    target_role = data.get('targetRole', None)
    
    # Generate recommendations
    recommendations = recommend_swap(team_id, candidate_pool, target_role)
    
    return jsonify(recommendations)

def recommend_swap(team_id, candidate_pool=None, target_role=None):
    """Recommend player replacements for a team based on PIV impact"""
    global players_df
    
    # Check if data is loaded
    if players_df is None or players_df.empty:
        load_data()
        
    if players_df is None or players_df.empty:
        return {"error": "No player data available"}
        
    # Get team players
    if 'team' in players_df.columns:
        # Find team name from ID
        team_name = None
        for _, team_row in players_df.iterrows():
            if team_row.get('team', '').lower().replace(' ', '-') == team_id:
                team_name = team_row.get('team')
                break
                
        if not team_name:
            return {"error": f"Team with ID {team_id} not found"}
            
        # Get all players in the team
        team_players = players_df[players_df['team'] == team_name].copy()
    else:
        return {"error": "Team data not available"}
        
    if len(team_players) == 0:
        return {"error": f"No players found for team {team_id}"}
        
    # Filter by role if specified
    if target_role and 'role' in team_players.columns:
        team_players_to_replace = team_players[team_players['role'] == target_role]
        if len(team_players_to_replace) == 0:
            return {"error": f"No players with role {target_role} found in team {team_id}"}
    else:
        team_players_to_replace = team_players
        
    # Calculate team's average PIV
    if 'PIV_v14' in team_players.columns:
        piv_col = 'PIV_v14'
    elif 'piv' in team_players.columns:
        piv_col = 'piv'
    else:
        return {"error": "PIV data not available"}
        
    team_avg_piv = team_players[piv_col].mean()
    
    # Get candidate players (players not in the team)
    if candidate_pool and len(candidate_pool) > 0:
        # Use provided candidate pool
        if 'steam_id' in players_df.columns:
            candidates = players_df[players_df['steam_id'].isin(candidate_pool)].copy()
        else:
            return {"error": "Player ID column not found"}
    else:
        # Use all players not in the team
        candidates = players_df[players_df['team'] != team_name].copy()
        
    # Filter candidates by role if target_role is specified
    if target_role and 'role' in candidates.columns:
        candidates = candidates[candidates['role'] == target_role]
        
    if len(candidates) == 0:
        return {"error": "No suitable candidates found"}
        
    # Calculate projected PIV gain
    candidates['projected_gain'] = candidates[piv_col] - team_avg_piv
    
    # Sort by projected gain (descending)
    candidates = candidates.sort_values('projected_gain', ascending=False)
    
    # Get top 10 candidates
    top_candidates = candidates.head(10)
    
    # Prepare result
    result = {
        "team": {
            "id": team_id,
            "name": team_name,
            "avg_piv": float(team_avg_piv)
        },
        "recommendations": []
    }
    
    # Add recommendations
    for _, candidate in top_candidates.iterrows():
        recommendation = {
            "id": candidate['steam_id'] if 'steam_id' in candidate else '',
            "name": candidate['name'] if 'name' in candidate else '',
            "team": candidate['team'] if 'team' in candidate else '',
            "role": candidate['role'] if 'role' in candidate else '',
            "piv": float(candidate[piv_col]),
            "projected_gain": float(candidate['projected_gain']),
            "percentage_improvement": float(candidate['projected_gain'] / team_avg_piv * 100) if team_avg_piv > 0 else 0
        }
        result["recommendations"].append(recommendation)
        
    return result

def synergy_matrix(player_ids):
    """Calculate synergy ratings between players"""
    global players_df
    
    # Check if data is loaded
    if players_df is None or players_df.empty:
        load_data()
    
    # Filter for requested players
    if 'steam_id' in players_df.columns:
        player_filter = players_df['steam_id'].isin(player_ids)
        selected_players = players_df[player_filter].copy()
    else:
        # Fallback if steam_id column doesn't exist
        return {"error": "Player ID column not found in data"}
    
    if len(selected_players) == 0:
        return {"error": "None of the requested players were found"}
    
    # Create matrix structure
    matrix = {
        "players": [],
        "synergy": []
    }
    
    # Add player info
    for _, player in selected_players.iterrows():
        player_info = {
            "id": player['steam_id'] if 'steam_id' in player else '',
            "name": player['name'] if 'name' in player else '',
            "role": player['role'] if 'role' in player else 'Support',
            "piv": float(player['piv']) if 'piv' in player else 1.0
        }
        matrix["players"].append(player_info)
    
    # Calculate synergy scores between pairs
    for i, player1 in enumerate(matrix["players"]):
        synergy_row = []
        for j, player2 in enumerate(matrix["players"]):
            if i == j:  # Self-synergy is 1.0
                synergy_row.append(1.0)
            else:
                # Find full player data
                p1_data = selected_players[selected_players['steam_id'] == player1["id"]].iloc[0]
                p2_data = selected_players[selected_players['steam_id'] == player2["id"]].iloc[0]
                
                # Calculate synergy
                synergy = calculate_player_synergy(p1_data, p2_data)
                synergy_row.append(synergy)
        
        matrix["synergy"].append(synergy_row)
    
    return matrix

@api.route('/weights', methods=['GET'])
def get_weights():
    """Return the current learned weights for PIV and TIR calculations"""
    try:
        # Check if weights file exists
        if not os.path.exists(WEIGHTS_PATH):
            return jsonify({
                "error": "No learned weights available",
                "weights": {},
                "metadata": {
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "version": "default",
                    "samples": 0
                }
            }), 404
            
        # Load weights from CSV
        weights_df = pd.read_csv(WEIGHTS_PATH)
        
        # Extract metadata
        metadata = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "version": "unknown",
            "samples": 0
        }
        
        # Get metadata rows
        for _, row in weights_df.iterrows():
            if row['feature'].startswith('metadata_'):
                key = row['feature'].replace('metadata_', '')
                metadata[key] = row['weight']
        
        # Filter out metadata rows
        weights_df = weights_df[~weights_df['feature'].str.startswith('metadata_')]
        
        # Convert to dictionary
        weights = {}
        for _, row in weights_df.iterrows():
            weights[row['feature']] = float(row['weight'])
            
        return jsonify({
            "weights": weights,
            "metadata": metadata
        })
    except Exception as e:
        return jsonify({"error": f"Error loading weights: {str(e)}"}), 500

def calculate_player_synergy(player1, player2):
    """Calculate synergy score between two players based on complementary metrics"""
    # Extract needed metrics with fallbacks
    p1_flash_efficiency = float(player1.get('flash_efficiency', 0))
    p1_utility_dmg = float(player1.get('utility_dmg_round', 0))
    p2_entry_ratio = float(player2.get('entry_ratio', 0)) 
    p2_kd = float(player2.get('kd', 1.0))
    
    # Base synergy calculation from example code (normalized to 0-1 scale)
    base_synergy = (
        (p1_flash_efficiency * p2_entry_ratio) +
        (p1_utility_dmg * p2_kd)
    ) / 2
    
    # Normalize to reasonable range (0.3-0.9)
    base_synergy = min(max(base_synergy * 0.6 + 0.3, 0.3), 0.9)
    
    # Role synergy modifiers
    role_synergy = 0
    
    # Extract roles with fallbacks
    p1_role = str(player1.get('role', '')).lower()
    p2_role = str(player2.get('role', '')).lower()
    
    # Higher synergy between complementary roles
    role_pairs = {
        ('support', 'spacetaker'): 0.15,  # Support players work well with entry fraggers
        ('support', 'awp'): 0.2,         # Support players help AWPers 
        ('awp', 'spacetaker'): 0.1,      # AWPers create space for entry
        ('igl', 'support'): 0.15,        # IGLs often work with support players
        ('lurker', 'spacetaker'): 0.1,   # Lurkers benefit from entry distraction
        ('anchor', 'rotator'): 0.2,      # Good CT side synergy
    }
    
    # Check if this role combination has a synergy bonus
    for (role1, role2), bonus in role_pairs.items():
        if (p1_role == role1 and p2_role == role2) or \
           (p1_role == role2 and p2_role == role1):
            role_synergy = bonus
            break
    
    # Team synergy (players from same team have higher baseline synergy)
    team_synergy = 0.1 if player1.get('team') == player2.get('team') else 0
    
    # Combine all synergy factors
    total_synergy = base_synergy * (1 + role_synergy + team_synergy)
    
    # Cap at 1.0 and round to 2 decimal places  
    return round(min(total_synergy, 1.0), 2)

def create_app():
    """Create Flask app with API blueprint"""
    from flask import Flask
    
    app = Flask(__name__)
    attach_routes(app)
    
    @app.route('/')
    def index():
        return jsonify({"message": "JumpShot API", "version": "1.0"})
    
    return app

def attach_routes(app):
    """Register API blueprint with an existing Flask app"""
    # Load data at startup
    load_data()
    
    # Register API blueprint
    app.register_blueprint(api, url_prefix='/api')
    
    return app
