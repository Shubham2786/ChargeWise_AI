-- ============================================================
-- ChargeWise AI — Supabase Database Initialisation Script
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. charging_sessions
CREATE TABLE IF NOT EXISTS charging_sessions (
    id               SERIAL PRIMARY KEY,
    station_id       VARCHAR NOT NULL,
    start_time       TIMESTAMP NOT NULL,
    end_time         TIMESTAMP NOT NULL,
    energy_kwh       FLOAT NOT NULL,
    max_power_kw     FLOAT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_charging_sessions_id         ON charging_sessions (id);
CREATE INDEX IF NOT EXISTS ix_charging_sessions_station_id ON charging_sessions (station_id);
CREATE INDEX IF NOT EXISTS ix_charging_sessions_start_time ON charging_sessions (start_time);
CREATE INDEX IF NOT EXISTS ix_station_start               ON charging_sessions (station_id, start_time);

ALTER TABLE charging_sessions
    DROP CONSTRAINT IF EXISTS uix_station_start;
ALTER TABLE charging_sessions
    ADD CONSTRAINT uix_station_start UNIQUE (station_id, start_time);

-- 2. feeder_load
CREATE TABLE IF NOT EXISTS feeder_load (
    id        SERIAL PRIMARY KEY,
    feeder_id VARCHAR NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    load_kw   FLOAT NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_feeder_load_id        ON feeder_load (id);
CREATE INDEX IF NOT EXISTS ix_feeder_load_feeder_id ON feeder_load (feeder_id);
CREATE INDEX IF NOT EXISTS ix_feeder_load_timestamp ON feeder_load (timestamp);
CREATE INDEX IF NOT EXISTS ix_feeder_timestamp      ON feeder_load (feeder_id, timestamp);

-- 3. Alembic version tracking (so alembic upgrade head is a no-op after this)
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Mark both migrations as already applied
DELETE FROM alembic_version;
INSERT INTO alembic_version (version_num) VALUES ('b027d99c3d0a');
