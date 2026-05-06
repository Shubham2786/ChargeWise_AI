"""Initial schema for ChargeWise AI

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Create charging_sessions table
    op.create_table(
        'charging_sessions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('station_id', sa.String(), nullable=False),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('energy_kwh', sa.Float(), nullable=False),
        sa.Column('max_power_kw', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_charging_sessions_id', 'charging_sessions', ['id'])
    op.create_index('ix_charging_sessions_station_id', 'charging_sessions', ['station_id'])
    op.create_index('ix_charging_sessions_start_time', 'charging_sessions', ['start_time'])
    op.create_index('ix_station_start', 'charging_sessions', ['station_id', 'start_time'])
    
    # Create feeder_load table
    op.create_table(
        'feeder_load',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('feeder_id', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(), nullable=False),
        sa.Column('load_kw', sa.Float(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_feeder_load_id', 'feeder_load', ['id'])
    op.create_index('ix_feeder_load_feeder_id', 'feeder_load', ['feeder_id'])
    op.create_index('ix_feeder_load_timestamp', 'feeder_load', ['timestamp'])
    op.create_index('ix_feeder_timestamp', 'feeder_load', ['feeder_id', 'timestamp'])

def downgrade() -> None:
    op.drop_table('feeder_load')
    op.drop_table('charging_sessions')
