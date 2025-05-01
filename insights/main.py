#!/usr/bin/env python
# insights/main.py - Entry point for the Flask API server
from flask import Flask
from insights.api import attach_routes, load_data
import os

def create_app():
    """Create the Flask application"""
    app = Flask(__name__)
    
    # Register API routes
    attach_routes(app)
    
    # Reload data on startup
    load_data()
    
    # Return the configured app
    return app

# Create the app
app = create_app()

# Run the app if this script is executed directly
if __name__ == '__main__':
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 5001))
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=port, debug=True)
