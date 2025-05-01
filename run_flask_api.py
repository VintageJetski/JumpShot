#!/usr/bin/env python
# run_flask_api.py - Run Flask API server that reads from our data pipeline
import subprocess
import time
import os
from insights.main import app

def run_data_pipeline():
    """Run the complete data pipeline as a background process"""
    print("Running data pipeline in background...")
    try:
        # Check if events.parquet exists
        if not os.path.exists('clean/events.parquet'):
            print("Running clean.py to create events.parquet")
            subprocess.call(['python', 'clean.py'])
        
        # Process with metrics.core
        print("Running metrics/core.py")
        subprocess.call(['python', '-m', 'metrics.core'])
        
        # Process with simple_piv.py
        print("Running metrics/simple_piv.py")
        subprocess.call(['python', '-m', 'metrics.simple_piv'])
        
        # At this point we have all the metrics ready
        # We're temporarily using simple_piv.py instead of the full piv.py
        # learn_weights.py will be added in future iterations
        print("Data pipeline initialized")
        return True
    except Exception as e:
        print(f"Error in data pipeline: {e}")
        return False

def main():
    """Main function that runs the data pipeline and starts the Flask API"""
    # Run data pipeline
    success = run_data_pipeline()
    if not success:
        print("Failed to initialize data pipeline. Starting API with limited functionality.")
    
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 5001))
    
    # Start Flask API
    print(f"Starting Flask API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)

if __name__ == "__main__":
    main()
