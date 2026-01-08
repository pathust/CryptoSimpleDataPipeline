from flask import Flask, jsonify, request
from flask_cors import CORS
from apscheduler.schedulers.background import BackgroundScheduler
import sys
import os

# Add src to pythonpath
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from src.modules.extract.manager import ExtractionManager
from src.modules.transform.manager import TransformManager
from src.modules.visualize.service import VisualizeService
from src.scheduler_config import SchedulerConfig
import src.config as config

app = Flask(__name__)
CORS(app)

scheduler = BackgroundScheduler()
scheduler_config = SchedulerConfig()

extract_mgr = ExtractionManager()
transform_mgr = TransformManager()
visualize_svc = VisualizeService()

def pipeline_job():
    """Background job to run extraction and transformation."""
    if not scheduler_config.is_enabled():
        print("⏸️  Pipeline disabled via config")
        return
    
    print("🚀 Running pipeline job...")
    try:
        # Extract
        generated_files = extract_mgr.run_cycle()
        print(f"✅ Extraction: {len(generated_files)} files")
        
        # Transform (includes auto-aggregation)
        records = transform_mgr.process_recent_files()
        print(f"✅ Transform: {records} records processed")
        
    except Exception as e:
        print(f"❌ Pipeline job failed: {e}")

def maintenance_job():
    """Weekly maintenance: archive, cleanup, aggregate."""
    print("🧹 Running weekly maintenance...")
    try:
        transform_mgr.run_maintenance()
    except Exception as e:
        print(f"❌ Maintenance failed: {e}")

# Start scheduler with initial interval
initial_interval = scheduler_config.get_interval()
scheduler.add_job(func=pipeline_job, trigger="interval", seconds=initial_interval, id='pipeline_job')

# Add weekly maintenance (runs every Sunday at 2 AM)
scheduler.add_job(func=maintenance_job, trigger="cron", day_of_week='sun', hour=2, id='maintenance_job')

scheduler.start()

print(f"⏰ Scheduler started:")
print(f"   - Pipeline: {initial_interval}s interval")
print(f"   - Maintenance: Weekly (Sunday 2AM)")

@app.route('/api/config/symbols', methods=['GET', 'POST'])
def config_symbols():
    if request.method == 'POST':
        new_symbols = request.json.get('symbols', [])
        if new_symbols:
            config.SYMBOLS = new_symbols
            return jsonify({"status": "success", "symbols": config.SYMBOLS})
    return jsonify({"symbols": config.SYMBOLS})

@app.route('/api/data/<symbol>')
def get_data(symbol):
    data = visualize_svc.get_kline_data(symbol)
    return jsonify(data)

@app.route('/api/stats/<symbol>')
def get_stats(symbol):
    """Get statistics for a symbol."""
    stats = visualize_svc.get_statistics(symbol)
    return jsonify(stats)

@app.route('/api/indicators/<symbol>')
def get_indicators(symbol):
    """Get technical indicators for a symbol."""
    indicators = visualize_svc.get_indicators(symbol)
    return jsonify(indicators)

@app.route('/api/pipeline/status')
def pipeline_status():
    """Get pipeline status."""
    status = visualize_svc.get_pipeline_status()
    return jsonify(status)

@app.route('/api/scheduler', methods=['GET', 'POST'])
def scheduler_endpoint():
    """Get or update scheduler configuration."""
    if request.method == 'POST':
        updates = request.json
        
        # Update configuration
        new_config = scheduler_config.update_config(updates)
        
        # If interval changed, reschedule the job
        if 'interval_seconds' in updates:
            new_interval = updates['interval_seconds']
            scheduler.reschedule_job(
                'pipeline_job',
                trigger='interval',
                seconds=new_interval
            )
            print(f"⏰ Scheduler interval updated to {new_interval}s")
        
        return jsonify({
            "status": "success",
            "config": new_config
        })
    
    return jsonify(scheduler_config.get_config())

@app.route('/api/trigger', methods=['POST'])
def trigger_pipeline():
    """Manual trigger for the pipeline."""
    pipeline_job()
    return jsonify({"status": "Pipeline triggered"})

@app.route('/api/maintenance/trigger', methods=['POST'])
def trigger_maintenance():
    """Manual trigger for maintenance tasks."""
    maintenance_job()
    return jsonify({"status": "Maintenance triggered"})

@app.route('/api/maintenance/stats')
def maintenance_stats():
    """Get data lake and warehouse statistics."""
    try:
        from src.modules.datalake.manager import DataLakeManager
        from src.modules.warehouse.aggregator import WarehouseAggregator
        
        dl_mgr = DataLakeManager()
        wh_agg = WarehouseAggregator()
        
        dl_stats = dl_mgr.get_statistics()
        wh_stats = wh_agg.get_statistics()
        
        return jsonify({
            "data_lake": dl_stats,
            "warehouse": wh_stats
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=config.FLASK_DEBUG, use_reloader=False, port=config.FLASK_PORT)
