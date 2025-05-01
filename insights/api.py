from flask import Blueprint, request, jsonify, Flask
import pandas as pd
import numpy as np
import os.path

# Create Blueprint for API routes
bp = Blueprint("data", __name__)

# Global cache for dataframes - auto-reloaded each time script restarts
PIV = None
TEAM_TIR = None

def load_data():
    """Load data from parquet files - called at startup and when refresh happens"""
    global PIV, TEAM_TIR
    
    # Load PIV data
    piv_path = "clean/piv.parquet"
    if os.path.exists(piv_path):
        PIV = pd.read_parquet(piv_path)
        print(f"Loaded {len(PIV)} player records from {piv_path}")
    else:
        print(f"Warning: {piv_path} not found. Player data unavailable.")
        # Create empty dataframe with expected columns
        PIV = pd.DataFrame(columns=['steam_id', 'user_name', 'team_clan_name', 'piv', 'ct_piv', 't_piv'])
    
    # Load Team TIR data if available
    tir_path = "clean/team_tir.csv"
    if os.path.exists(tir_path):
        TEAM_TIR = pd.read_csv(tir_path)
        print(f"Loaded {len(TEAM_TIR)} team records from {tir_path}")
    else:
        print(f"Warning: {tir_path} not found. Team data unavailable.")
        # Create empty dataframe with expected columns
        TEAM_TIR = pd.DataFrame(columns=['team_name', 'tir', 'tir_scaled'])

# Load data on module import
load_data()

@bp.route("/players", methods=["GET"])
def players():
    """Return all players with optional field filtering"""
    # Check if PIV data is loaded
    if PIV is None or len(PIV) == 0:
        return jsonify({"error": "Player data not available"}), 404
    
    # Get fields parameter if provided
    fields = request.args.get("fields")
    if fields:
        cols = fields.split(",")
        # Only return columns that exist
        valid_cols = [col for col in cols if col in PIV.columns]
        if not valid_cols:
            return jsonify({"error": "No valid fields specified"}), 400
        return jsonify(PIV[valid_cols].to_dict(orient="records"))
    
    # Return all data if no fields specified
    return jsonify(PIV.to_dict(orient="records"))

@bp.route("/player/<steam_id>")
def player(steam_id):
    """Return a single player by steam_id"""
    # Check if PIV data is loaded
    if PIV is None or len(PIV) == 0:
        return jsonify({"error": "Player data not available"}), 404
    
    try:
        # Convert to int if it's a numeric string
        if steam_id.isdigit():
            steam_id_val = int(steam_id)
            row = PIV.loc[PIV.steam_id == steam_id_val]
        else:
            # Try matching by username if not numeric
            row = PIV.loc[PIV.user_name == steam_id]
        
        if len(row) == 0:
            return jsonify({"error": f"Player with ID {steam_id} not found"}), 404
        
        return jsonify(row.to_dict(orient="records")[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route("/teams", methods=["GET"])
def teams():
    """Return all teams with their TIR"""
    # Check if TEAM_TIR data is loaded
    if TEAM_TIR is None or len(TEAM_TIR) == 0:
        return jsonify({"error": "Team data not available"}), 404
    
    # Get fields parameter if provided
    fields = request.args.get("fields")
    if fields:
        cols = fields.split(",")
        # Only return columns that exist
        valid_cols = [col for col in cols if col in TEAM_TIR.columns]
        if not valid_cols:
            return jsonify({"error": "No valid fields specified"}), 400
        return jsonify(TEAM_TIR[valid_cols].to_dict(orient="records"))
    
    # Return all data if no fields specified
    return jsonify(TEAM_TIR.to_dict(orient="records"))

@bp.route("/team/<team_name>")
def team(team_name):
    """Return a single team by name"""
    # Check if TEAM_TIR data is loaded
    if TEAM_TIR is None or len(TEAM_TIR) == 0:
        return jsonify({"error": "Team data not available"}), 404
    
    try:
        # Match by team name
        row = TEAM_TIR.loc[TEAM_TIR.team_name == team_name]
        
        if len(row) == 0:
            return jsonify({"error": f"Team with name {team_name} not found"}), 404
        
        # Get players for this team
        if PIV is not None and len(PIV) > 0:
            team_players = PIV.loc[PIV.team_clan_name == team_name]
            team_dict = row.to_dict(orient="records")[0]
            team_dict["players"] = team_players.to_dict(orient="records")
            return jsonify(team_dict)
        else:
            return jsonify(row.to_dict(orient="records")[0])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route("/lineup/synergy", methods=["POST"])
def lineup_synergy():
    """Calculate synergy matrix for a set of players"""
    # Check if PIV data is loaded
    if PIV is None or len(PIV) == 0:
        return jsonify({"error": "Player data not available"}), 404
    
    try:
        # Get player IDs from request
        data = request.json
        if not data or "ids" not in data:
            return jsonify({"error": "No player IDs provided"}), 400
        
        ids = data["ids"]
        if not ids or len(ids) < 2:
            return jsonify({"error": "At least 2 player IDs required"}), 400
        
        # Calculate synergy matrix
        synergy_data = synergy_matrix(ids)
        return jsonify(synergy_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def synergy_matrix(player_ids):
    """Calculate synergy ratings between players"""
    # Check if PIV data is loaded
    if PIV is None or len(PIV) == 0:
        return {"error": "Player data not available"}
    
    # Get players
    players = []
    for pid in player_ids:
        player_row = None
        if isinstance(pid, int) or (isinstance(pid, str) and pid.isdigit()):
            # Match by steam_id
            player_row = PIV.loc[PIV.steam_id == int(pid)]
        else:
            # Match by username
            player_row = PIV.loc[PIV.user_name == pid]
        
        if len(player_row) > 0:
            players.append(player_row.iloc[0])
    
    if len(players) < 2:
        return {"error": "Not enough valid players found"}
    
    # Calculate synergy score for each pair
    n = len(players)
    synergy = np.zeros((n, n))
    player_info = []
    
    for i in range(n):
        player_info.append({
            "id": players[i]["steam_id"] if "steam_id" in players[i] else None,
            "name": players[i]["user_name"] if "user_name" in players[i] else f"Player {i}",
            "role": players[i]["primary_role"] if "primary_role" in players[i] else None,
            "piv": players[i]["piv"] if "piv" in players[i] else 0.0
        })
        
        for j in range(n):
            if i == j:
                # Self-synergy is always 1.0 (perfect)
                synergy[i, j] = 1.0
            else:
                # Calculate synergy between players i and j
                synergy[i, j] = calculate_player_synergy(players[i], players[j])
    
    # Return the data in a format suitable for the UI
    return {
        "players": player_info,
        "matrix": synergy.tolist()
    }

def calculate_player_synergy(player1, player2):
    """Calculate synergy score between two players"""
    # Base synergy score
    synergy = 0.5
    
    # Adjust based on roles
    if "primary_role" in player1 and "primary_role" in player2:
        role1 = player1["primary_role"]
        role2 = player2["primary_role"]
        
        # Higher synergy for complementary roles
        role_synergy_map = {
            # IGL (7) has good synergy with everyone
            (7, 1): 0.8,  # IGL + AWP
            (7, 2): 0.7,  # IGL + Lurker
            (7, 3): 0.75, # IGL + Support
            (7, 4): 0.85, # IGL + Spacetaker
            (7, 5): 0.7,  # IGL + Anchor
            (7, 6): 0.7,  # IGL + Rotator
            
            # AWP (1) synergies
            (1, 3): 0.8,  # AWP + Support
            (1, 4): 0.7,  # AWP + Spacetaker
            (1, 2): 0.6,  # AWP + Lurker
            (1, 5): 0.65, # AWP + Anchor
            (1, 6): 0.65, # AWP + Rotator
            
            # Other role pairs
            (4, 3): 0.75, # Spacetaker + Support
            (2, 5): 0.6,  # Lurker + Anchor
            (3, 5): 0.7,  # Support + Anchor
            (3, 6): 0.7,  # Support + Rotator
            (5, 6): 0.5,  # Anchor + Rotator (neutral)
        }
        
        # Get role synergy value (or default to neutral)
        key = (role1, role2)
        reverse_key = (role2, role1)
        
        if key in role_synergy_map:
            synergy = role_synergy_map[key]
        elif reverse_key in role_synergy_map:
            synergy = role_synergy_map[reverse_key]
        else:
            # Penalty for duplicate roles (except Support)
            if role1 == role2 and role1 != 3:  # 3 is Support
                synergy = 0.3  # Duplicate roles have lower synergy
            else:
                synergy = 0.5  # Neutral synergy
    
    # Adjust based on play styles
    # Assuming PIV components reflect play style
    style_synergy = 0.5
    
    # Combine all factors
    final_synergy = synergy * 0.7 + style_synergy * 0.3
    
    # Ensure result is between 0 and 1
    return max(0.1, min(1.0, final_synergy))

def create_app():
    """Create Flask app with API blueprint"""
    app = Flask(__name__)
    app.register_blueprint(bp, url_prefix="/api")
    return app

# If run directly
if __name__ == "__main__":
    # Run Flask app
    app = create_app()
    app.run(host="0.0.0.0", port=5001, debug=True)

def attach_routes(app):
    """Register API blueprint with an existing Flask app"""
    app.register_blueprint(bp, url_prefix="/api")
    return app