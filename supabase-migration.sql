-- ============================================================
-- AI Competency Test Portal — Supabase Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Results table
CREATE TABLE IF NOT EXISTS results (
    id BIGSERIAL PRIMARY KEY,
    test_id TEXT NOT NULL DEFAULT '',
    test_name TEXT DEFAULT '',
    participant TEXT NOT NULL DEFAULT '',
    dept TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    score TEXT DEFAULT '',
    answers TEXT DEFAULT '',
    date TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. API keys table
CREATE TABLE IF NOT EXISTS api_keys (
    provider TEXT PRIMARY KEY,
    key_value TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for results
-- Anyone can insert (uses anon key)
CREATE POLICY "results_insert_public" ON results
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Only service_role can read/delete
CREATE POLICY "results_select_admin" ON results
    FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY "results_delete_admin" ON results
    FOR DELETE
    TO service_role
    USING (true);

-- 5. RLS Policies for api_keys
-- Only service_role can read/update
CREATE POLICY "api_keys_select_admin" ON api_keys
    FOR SELECT
    TO service_role
    USING (true);

CREATE POLICY "api_keys_upsert_admin" ON api_keys
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
