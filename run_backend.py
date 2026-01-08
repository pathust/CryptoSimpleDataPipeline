import subprocess
import sys
import os

def run():
    # Run directly with current Python instead of conda run to avoid segfault
    port = os.getenv("FLASK_PORT", "5001")
    print(f"Starting Backend on Port {port}...")
    print("⚠️  Scheduler disabled (manual trigger via /api/trigger)")
    try:
        # Use current Python interpreter
        subprocess.run([sys.executable, "src/web/app.py"])
    except KeyboardInterrupt:
        print("\n\nStopping Backend...")

if __name__ == "__main__":
    run()
