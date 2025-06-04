-- Create all tables for the YouTube automation system

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL
);

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    script TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    "youtube_id" TEXT,
    "thumbnail_url" TEXT,
    "drive_file_id" TEXT,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    duration TEXT,
    "trending_topic" TEXT,
    "trending_score" INTEGER,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "published_at" TIMESTAMP,
    "scheduled_at" TIMESTAMP
);

-- Trending topics table
CREATE TABLE IF NOT EXISTS trending_topics (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    source TEXT,
    url TEXT,
    score INTEGER NOT NULL,
    category TEXT,
    keywords TEXT[],
    "analyzed_at" TIMESTAMP DEFAULT NOW(),
    used BOOLEAN DEFAULT false
);

-- Automation jobs table
CREATE TABLE IF NOT EXISTS automation_jobs (
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    "video_id" INTEGER,
    payload JSONB,
    result JSONB,
    error TEXT,
    "started_at" TIMESTAMP,
    "completed_at" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- API configurations table
CREATE TABLE IF NOT EXISTS api_configurations (
    id SERIAL PRIMARY KEY,
    service TEXT NOT NULL UNIQUE,
    "api_key" TEXT,
    config JSONB,
    "is_active" BOOLEAN DEFAULT true,
    "last_used" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    "cron_expression" TEXT NOT NULL,
    "job_type" TEXT NOT NULL,
    "is_active" BOOLEAN DEFAULT true,
    config JSONB,
    "last_run" TIMESTAMP,
    "next_run" TIMESTAMP,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos("created_at");
CREATE INDEX IF NOT EXISTS idx_trending_topics_score ON trending_topics(score);
CREATE INDEX IF NOT EXISTS idx_trending_topics_used ON trending_topics(used);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_status ON automation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_automation_jobs_type ON automation_jobs(type);