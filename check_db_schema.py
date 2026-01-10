#!/usr/bin/env python3
"""
Check database schema and data for debugging
"""

import sys
import os

# Add src to pythonpath
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'src')))

import src.config as config
import mysql.connector

def check_database():
    """Check database schema and data."""
    try:
        conn = mysql.connector.connect(
            host=config.DB_HOST,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            database=config.DB_NAME
        )
        cursor = conn.cursor()
        
        print("=" * 60)
        print("DATABASE SCHEMA CHECK")
        print("=" * 60)
        
        # Check fact_orderbook table structure
        print("\n📋 fact_orderbook table structure:")
        cursor.execute('DESCRIBE fact_orderbook')
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col[0]} - {col[1]}")
        
        # Check fact_orderbook data
        cursor.execute('SELECT COUNT(*) FROM fact_orderbook')
        count = cursor.fetchone()[0]
        print(f"\n📊 Total records in fact_orderbook: {count}")
        
        if count > 0:
            cursor.execute('SELECT * FROM fact_orderbook LIMIT 3')
            rows = cursor.fetchall()
            print("\n📄 Sample fact_orderbook data:")
            for row in rows:
                print(f"  {row}")
        
        # Check fact_klines table structure
        print("\n📋 fact_klines table structure:")
        cursor.execute('DESCRIBE fact_klines')
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col[0]} - {col[1]}")
        
        # Check fact_klines data
        cursor.execute('SELECT COUNT(*) FROM fact_klines')
        count = cursor.fetchone()[0]
        print(f"\n📊 Total records in fact_klines: {count}")
        
        if count > 0:
            cursor.execute('SELECT symbol, interval_code, COUNT(*) FROM fact_klines GROUP BY symbol, interval_code')
            rows = cursor.fetchall()
            print("\n📄 fact_klines data by symbol and interval:")
            for row in rows:
                print(f"  {row[0]} - {row[1]}: {row[2]} records")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Database check completed")
        
    except Exception as e:
        print(f"❌ Error checking database: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    check_database()
