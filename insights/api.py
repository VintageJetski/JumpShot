#!/usr/bin/env python
# insights/api.py - Flask API for serving CS2 analytics
from flask import Blueprint, request, jsonify
import pandas as pd
import numpy as np
from pathlib import Path
import os
import json

# File paths
EVENTS_PATH = 'clean/events.parquet'
ENRICHED_PATH = 'clean/enriched.parquet'
PIV_PATH = 'clean/piv.parquet'

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

def calculate_player_synergy(player1, player2):
    """Calculate synergy score between two players"""
    # Base synergy score
    base_synergy = 0.5
    
    # Role complementarity (different roles are better)
    if 'role' in player1 and 'role' in player2:
        role_synergy = 0.7 if player1['role'] != player2['role'] else 0.3
    else:
        role_synergy = 0.5
    
    # Team familiarity (same team is better)
    if 'team' in player1 and 'team' in player2:
        team_synergy = 0.8 if player1['team'] == player2['team'] else 0.4
    else:
        team_synergy = 0.5
    
    # PIV compatibility (higher is better)
    if 'piv' in player1 and 'piv' in player2:
        # Higher combined PIV = better synergy
        piv_sum = float(player1['piv']) + float(player2['piv'])
        piv_synergy = min(max(piv_sum / 4.0, 0.3), 0.9)  # Scale between 0.3-0.9
    else:
        piv_synergy = 0.5
    
    # Calculate overall synergy
    synergy = base_synergy * 0.1 + role_synergy * 0.4 + team_synergy * 0.2 + piv_synergy * 0.3
    
    # Round to 2 decimal places
    return round(synergy, 2)

def create_app():
    """Create Flask app with API blueprint"""
    from flask import Flask
    
    app = Flask(__name__)
    attach_routes(app)
    
    @app.route('/')
    def index():
        return jsonify({"message": "CS2 Analytics API", "version": "1.0"})
    
    return app

def attach_routes(app):
    """Register API blueprint with an existing Flask app"""
    # Load data at startup
    load_data()
    
    # Register API blueprint
    app.register_blueprint(api, url_prefix='/api')
    
    return app
