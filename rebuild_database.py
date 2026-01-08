import mysql.connector
import src.config as config

def drop_and_create_database():
    try:
        # Connect without specific database
        conn = mysql.connector.connect(
            host=config.DB_HOST,
            user=config.DB_USER,
            password=config.DB_PASSWORD
        )
        cursor = conn.cursor()
        
        # Drop and recreate database
        print(f"Dropping database '{config.DB_NAME}'...")
        cursor.execute(f"DROP DATABASE IF EXISTS {config.DB_NAME}")
        
        print(f"Creating database '{config.DB_NAME}'...")
        cursor.execute(f"CREATE DATABASE {config.DB_NAME}")
        
        cursor.close()
        conn.close()
        
        # Now connect to the new database and create tables
        conn = mysql.connector.connect(
            host=config.DB_HOST,
            user=config.DB_USER,
            password=config.DB_PASSWORD,
            database=config.DB_NAME
        )
        cursor = conn.cursor()
        
        # Fact tables
        print("Creating table 'fact_klines'...")
        cursor.execute("""
        CREATE TABLE fact_klines (
            symbol VARCHAR(20),
            interval_code VARCHAR(10),
            open_time DATETIME,
            open_price DECIMAL(20, 8),
            high_price DECIMAL(20, 8),
            low_price DECIMAL(20, 8),
            close_price DECIMAL(20, 8),
            volume DECIMAL(20, 8),
            close_time DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (symbol, interval_code, open_time),
            INDEX idx_symbol_time (symbol, open_time),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        print("Creating table 'fact_orderbook'...")
        cursor.execute("""
        CREATE TABLE fact_orderbook (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            symbol VARCHAR(20),
            side VARCHAR(4),
            price DECIMAL(20, 8),
            quantity DECIMAL(20, 8),
            captured_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_symbol_time (symbol, captured_at),
            INDEX idx_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        # Aggregation tables
        print("Creating table 'hourly_klines'...")
        cursor.execute("""
        CREATE TABLE hourly_klines (
            symbol VARCHAR(20),
            hour_start DATETIME,
            open_price DECIMAL(20, 8),
            high_price DECIMAL(20, 8),
            low_price DECIMAL(20, 8),
            close_price DECIMAL(20, 8),
            volume DECIMAL(20, 8),
            trade_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (symbol, hour_start),
            INDEX idx_hour (hour_start)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        print("Creating table 'daily_klines'...")
        cursor.execute("""
        CREATE TABLE daily_klines (
            symbol VARCHAR(20),
            date DATE,
            open_price DECIMAL(20, 8),
            high_price DECIMAL(20, 8),
            low_price DECIMAL(20, 8),
            close_price DECIMAL(20, 8),
            volume DECIMAL(20, 8),
            trade_count INT DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (symbol, date),
            INDEX idx_date (date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        # Metadata tables
        print("Creating table 'extraction_metadata'...")
        cursor.execute("""
        CREATE TABLE extraction_metadata (
            symbol VARCHAR(20),
            data_type VARCHAR(20),
            last_fetch_time DATETIME,
            last_open_time DATETIME,
            record_count INT DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (symbol, data_type)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        print("Creating table 'processed_files'...")
        cursor.execute("""
        CREATE TABLE processed_files (
            file_path VARCHAR(500) PRIMARY KEY,
            file_name VARCHAR(255),
            symbol VARCHAR(20),
            data_type VARCHAR(20),
            record_count INT DEFAULT 0,
            processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            archived BOOLEAN DEFAULT FALSE,
            INDEX idx_symbol (symbol),
            INDEX idx_processed (processed_at),
            INDEX idx_archived (archived)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)
        
        conn.commit()
        print("✅ Database rebuilt successfully with smart tables!")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as err:
        print(f"❌ Error: {err}")
        return False
    
    return True

if __name__ == "__main__":
    drop_and_create_database()
