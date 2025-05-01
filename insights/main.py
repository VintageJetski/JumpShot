#!/usr/bin/env python
# insights/main.py - Flask application for CS2 analytics insights
from flask import Flask
from .api import attach_routes

# Cache app for reuse
app = None

def create_app():
    """Create the Flask application"""
    global app
    if app is not None:
        return app
    
    app = Flask(__name__)
    
    # Register API routes
    attach_routes(app)
    
    # Basic route
    @app.route('/')
    def index():
        return "CS2 Analytics API"
    
    return app
