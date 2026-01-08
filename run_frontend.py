import subprocess
import os

def run():
    frontend_dir = os.path.join(os.path.dirname(__file__), 'frontend')
    if not os.path.exists(frontend_dir):
        print("❌ Frontend directory not found!")
        return
    
    print("🚀 Starting Vite dev server...")
    print("📡 Frontend: http://localhost:5173")
    print("📡 Backend API: http://localhost:5001")
    print()
    print("Press Ctrl+C to stop")
    print()
    
    try:
        subprocess.run(['npm', 'run', 'dev'], cwd=frontend_dir)
    except KeyboardInterrupt:
        print("\n\n👋 Frontend server stopped")

if __name__ == '__main__':
    run()
