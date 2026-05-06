"""ACN data ingestion pipeline."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.chargewise.database import SessionLocal
from app.chargewise.services.acn_client import ACNClient
from app.chargewise.services.transform import SessionTransformer
from app.chargewise.services.load_builder import LoadBuilder
from app.chargewise.services.repository import Repository

def main():
    """Run the complete ingestion pipeline."""
    print("🚀 Starting ACN data ingestion...")
    
    # 1. Fetch sessions
    print("📡 Fetching sessions from ACN API...")
    client = ACNClient()
    raw_sessions = client.fetch_sessions(min_kwh=1.0)
    print(f"✅ Fetched {len(raw_sessions)} sessions")
    
    # 2. Transform data
    print("🔄 Transforming data...")
    transformer = SessionTransformer()
    sessions_df = transformer.transform(raw_sessions)
    print(f"✅ Transformed {len(sessions_df)} valid sessions")
    
    # 3. Generate load
    print("⚡ Generating feeder load time-series...")
    builder = LoadBuilder()
    load_df = builder.build_load(sessions_df, feeder_id="caltech_main")
    print(f"✅ Generated {len(load_df)} load intervals")
    
    # 4. Store in database
    print("💾 Storing data in PostgreSQL...")
    db = SessionLocal()
    try:
        repo = Repository()
        sessions_count = repo.insert_sessions(db, sessions_df)
        load_count = repo.insert_load(db, load_df)
        skipped_count = len(sessions_df) - sessions_count
        print(f"✅ Inserted {sessions_count} sessions (Skipped {skipped_count} duplicates) and {load_count} load records")
    finally:
        db.close()
    
    print("🎉 Ingestion complete!")

if __name__ == "__main__":
    main()
