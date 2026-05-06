"""Create the chargewise database."""
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    """Create the chargewise database if it doesn't exist."""
    try:
        # Connect to PostgreSQL server (default postgres database)
        conn = psycopg2.connect(
            host="localhost",
            port=5433,
            user="postgres",
            password="Postgre7482",
            database="postgres"  # Connect to default database first
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname='chargewise'")
        exists = cursor.fetchone()
        
        if exists:
            print("✅ Database 'chargewise' already exists")
        else:
            # Create database
            cursor.execute("CREATE DATABASE chargewise")
            print("✅ Database 'chargewise' created successfully!")
        
        cursor.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"❌ Error: {e}")
        print("\nPlease check:")
        print("  - PostgreSQL is running on localhost:5433")
        print("  - Username: postgres")
        print("  - Password: Postgre7482")
        return False
    
    return True

if __name__ == "__main__":
    print("=" * 50)
    print("ChargeWise AI - Database Creation")
    print("=" * 50)
    print()
    
    if create_database():
        print()
        print("=" * 50)
        print("✅ Ready to run migrations!")
        print("=" * 50)
        print()
        print("Next step: run-migrations.bat")
    else:
        print()
        print("=" * 50)
        print("❌ Database creation failed")
        print("=" * 50)
