import subprocess
import src.config as config

def run():
    port = config.FLASK_PORT
    print(f"Starting Backend on Port {port}...")
    try:
        subprocess.run(["conda", "run", "-n", "crypto_data_pipeline_env", "python", "src/web/app.py"])
    except KeyboardInterrupt:
        print("\nStopping Backend...")

if __name__ == "__main__":
    run()
