import sys
import os

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def run():
    port = os.getenv("FLASK_PORT", "5001")
    print(f"Starting Backend on Port {port}...")
    print("⚠️  Scheduler disabled (manual trigger via /api/trigger)")
    
    try:
        # Import and run Flask app directly to inherit current environment
        from web.app import app
        app.run(host='0.0.0.0', port=int(port), debug=True, use_reloader=False)
    except KeyboardInterrupt:
        print("\n\nStopping Backend...")

if __name__ == "__main__":
    run()
