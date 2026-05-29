-- ParkPal schema. Safe to run repeatedly (idempotent, non-destructive).
-- Apply with: npm run migrate

-- Required extensions (GEOGRAPHY type + uuid_generate_v4()).
-- On Supabase these usually exist already; IF NOT EXISTS keeps this safe.
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Comprehensive parking spots table
CREATE TABLE IF NOT EXISTS parking_spots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    global_id VARCHAR(255) UNIQUE NOT NULL,
    spot_type VARCHAR(20) NOT NULL CHECK (spot_type IN ('on_street', 'off_street', 'residential', 'school')),

    -- Common fields
    address_desc VARCHAR(500),
    status VARCHAR(20) DEFAULT 'Active',
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    geometry GEOGRAPHY(GEOMETRY, 4326),

    -- On-street specific
    permit_zone VARCHAR(50),
    price_zone VARCHAR(10),
    html_zone_rate TEXT, -- Full pricing HTML
    block_side VARCHAR(10),
    enforceable_time VARCHAR(100),
    zone_cap INTEGER,
    zone_length DECIMAL(10,2),
    seg_cap INTEGER,
    seg_length DECIMAL(10,2),
    max_time DECIMAL(10,1),
    zone_type VARCHAR(50),
    parking_restrict_type VARCHAR(100),
    parking_restrict_time VARCHAR(100),

    -- Off-street specific
    lot_name VARCHAR(200),
    parking_type VARCHAR(100),
    lot_num VARCHAR(50),
    home_page VARCHAR(500),

    -- Residential/School specific
    description VARCHAR(200),
    parking_zone VARCHAR(50),
    ctp_class VARCHAR(100),
    dot VARCHAR(10),
    parking_restriction VARCHAR(200),
    time_restriction VARCHAR(100),
    no_stopping VARCHAR(100),
    octant VARCHAR(10),

    -- Common metadata
    stall_type VARCHAR(50),
    camera VARCHAR(10),

    -- Timestamps
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_spots_location ON parking_spots USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_spots_type ON parking_spots(spot_type);
CREATE INDEX IF NOT EXISTS idx_spots_price_zone ON parking_spots(price_zone);
CREATE INDEX IF NOT EXISTS idx_spots_status ON parking_spots(status);
