import { db } from "../server/db";
import { 
  users, 
  videos, 
  trendingTopics, 
  automationJobs, 
  apiConfigurations, 
  schedules 
} from "../shared/schema";
import { sql } from "drizzle-orm";

async function seed() {
  try {
    console.log("🌱 Starting database seeding...");

    // Create tables if they don't exist
    console.log("📋 Ensuring all tables exist...");
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      )
    `);

    // Create videos table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        script TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        youtube_id TEXT,
        thumbnail_url TEXT,
        drive_file_id TEXT,
        views INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        duration TEXT,
        trending_topic TEXT,
        trending_score INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        published_at TIMESTAMP,
        scheduled_at TIMESTAMP
      )
    `);

    // Create trending_topics table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS trending_topics (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        search_volume INTEGER NOT NULL DEFAULT 0,
        priority TEXT DEFAULT 'medium',
        category TEXT,
        source TEXT,
        trending_data JSONB,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW(),
        url TEXT,
        score INTEGER DEFAULT 0,
        keywords TEXT[],
        analyzed_at TIMESTAMP DEFAULT NOW(),
        used BOOLEAN DEFAULT false
      )
    `);

    // Create automation_jobs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS automation_jobs (
        id SERIAL PRIMARY KEY,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        video_id INTEGER,
        payload JSONB,
        result JSONB,
        error TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create api_configurations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS api_configurations (
        id SERIAL PRIMARY KEY,
        service TEXT NOT NULL UNIQUE,
        api_key TEXT,
        config JSONB,
        is_active BOOLEAN DEFAULT true,
        last_used TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Create schedules table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS schedules (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        cron_expression TEXT NOT NULL,
        job_type TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        config JSONB,
        last_run TIMESTAMP,
        next_run TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("✅ All tables created or verified successfully!");

    // Create some sample trending topics
    console.log("📰 Creating sample trending topics...");
    
    // Clear existing sample data and insert fresh data
    await db.execute(sql`DELETE FROM trending_topics WHERE source IN ('Tech News', 'World News', 'Science News', 'Business News')`);
    
    // Use raw SQL to insert data with all required fields
    await db.execute(sql`
      INSERT INTO trending_topics (title, description, search_volume, priority, category, source, url, score, keywords, used)
      VALUES 
      ('AI Revolution in Healthcare: New Breakthroughs in Medical Diagnosis', 
       'Latest developments in artificial intelligence are transforming how doctors diagnose diseases, with new AI models showing 95% accuracy in early cancer detection.', 
       85000, 'high', 'Technology', 'Tech News', 'https://technews.com/ai-healthcare', 95, 
       ARRAY['AI', 'healthcare', 'medical', 'diagnosis', 'cancer'], false),
      ('Climate Summit 2024: World Leaders Announce Ambitious Green Energy Goals', 
       'Global leaders unite at the Climate Summit to announce unprecedented investments in renewable energy and carbon reduction targets for the next decade.', 
       62000, 'high', 'Environment', 'World News', 'https://worldnews.com/climate-summit', 88, 
       ARRAY['climate', 'summit', 'renewable energy', 'carbon', 'environment'], false),
      ('Space Exploration Milestone: Mars Mission Discovers Signs of Ancient Water', 
       'NASA''s latest Mars rover has uncovered compelling evidence of ancient water systems on Mars, bringing us closer to understanding the planet''s potential for past life.', 
       74000, 'high', 'Science', 'Science News', 'https://spacenews.com/mars-water', 92, 
       ARRAY['space', 'Mars', 'NASA', 'water', 'exploration'], false),
      ('Global Economy Update: Markets React to New Trade Agreements', 
       'International markets show positive response to newly signed trade agreements between major economies, signaling potential economic growth.', 
       45000, 'medium', 'Business', 'Business News', 'https://businessnews.com/trade-agreements', 78, 
       ARRAY['economy', 'trade', 'markets', 'business', 'growth'], false),
      ('Breakthrough in Quantum Computing: New Processor Achieves Record Performance', 
       'Scientists unveil a revolutionary quantum processor that could accelerate computing capabilities and solve complex problems in minutes instead of years.', 
       67000, 'high', 'Technology', 'Tech News', 'https://technews.com/quantum-computing', 90, 
       ARRAY['quantum', 'computing', 'processor', 'technology', 'breakthrough'], false)
    `);

    // Create API configurations
    console.log("🔧 Creating API configurations...");
    await db.execute(sql`DELETE FROM api_configurations WHERE service IN ('gemini', 'youtube', 'drive', 'tts')`);
    await db.execute(sql`
      INSERT INTO api_configurations (service, is_active, config)
      VALUES 
      ('gemini', true, '{"model": "gemini-pro", "temperature": 0.7, "maxTokens": 2048}'::jsonb),
      ('youtube', true, '{"defaultCategory": "25", "defaultPrivacy": "public", "uploadQuality": "hd1080"}'::jsonb),
      ('drive', true, '{"folderPrefix": "AutoTube_Videos", "shareByDefault": false}'::jsonb),
      ('tts', true, '{"voice": "en-IN-Standard-D", "languageCode": "en-IN", "speakingRate": 0.9, "pitch": -2.0}'::jsonb)
    `);

    // Create default schedules
    console.log("⏰ Creating default schedules...");
    await db.execute(sql`DELETE FROM schedules WHERE name IN ('Daily Video Creation', 'News Analysis', 'Cleanup')`);
    await db.execute(sql`
      INSERT INTO schedules (name, cron_expression, job_type, is_active, config)
      VALUES 
      ('Daily Video Creation', '30 12 * * *', 'daily_video', true, 
       '{"timezone": "Asia/Kolkata", "description": "Create and publish daily trending news video at 6:00 PM IST"}'::jsonb),
      ('News Analysis', '0 */4 * * *', 'news_analysis', true, 
       '{"timezone": "Asia/Kolkata", "description": "Analyze trending news every 4 hours"}'::jsonb),
      ('Cleanup', '0 2 * * *', 'cleanup', true, 
       '{"timezone": "Asia/Kolkata", "description": "Clean up old files and data daily at 2 AM"}'::jsonb)
    `);

    // Create a sample video (optional)
    console.log("🎬 Creating sample video entry...");
    await db.execute(sql`DELETE FROM videos WHERE title = 'Welcome to AutoTube - Your AI-Powered Video Creation System'`);
    await db.execute(sql`
      INSERT INTO videos (title, description, status, trending_topic, trending_score, duration)
      VALUES 
      ('Welcome to AutoTube - Your AI-Powered Video Creation System', 
       'This is a sample video created by the AutoTube system to demonstrate the automated video creation pipeline.', 
       'completed', 'AI Video Automation', 85, '2:30')
    `);

    console.log("✅ Database seeding completed successfully!");
    console.log(`
📊 Seeded data summary:
- 5 trending topics ready for video creation
- 4 API configurations for external services
- 3 scheduled automation jobs
- 1 sample video entry

Your YouTube automation system is now ready to start creating content!
    `);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("🎉 Seeding process completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding process failed:", error);
    process.exit(1);
  });