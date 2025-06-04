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
    await db.insert(trendingTopics).values([
      {
        title: "AI Revolution in Healthcare: New Breakthroughs in Medical Diagnosis",
        description: "Latest developments in artificial intelligence are transforming how doctors diagnose diseases, with new AI models showing 95% accuracy in early cancer detection.",
        source: "Tech News",
        score: 95,
        category: "Technology",
        keywords: ["AI", "healthcare", "medical", "diagnosis", "cancer"],
        used: false
      },
      {
        title: "Climate Summit 2024: World Leaders Announce Ambitious Green Energy Goals",
        description: "Global leaders unite at the Climate Summit to announce unprecedented investments in renewable energy and carbon reduction targets for the next decade.",
        source: "World News",
        score: 88,
        category: "Environment",
        keywords: ["climate", "summit", "renewable energy", "carbon", "environment"],
        used: false
      },
      {
        title: "Space Exploration Milestone: Mars Mission Discovers Signs of Ancient Water",
        description: "NASA's latest Mars rover has uncovered compelling evidence of ancient water systems on Mars, bringing us closer to understanding the planet's potential for past life.",
        source: "Science News",
        score: 92,
        category: "Science",
        keywords: ["space", "Mars", "NASA", "water", "exploration"],
        used: false
      },
      {
        title: "Global Economy Update: Markets React to New Trade Agreements",
        description: "International markets show positive response to newly signed trade agreements between major economies, signaling potential economic growth.",
        source: "Business News",
        score: 78,
        category: "Business",
        keywords: ["economy", "trade", "markets", "business", "growth"],
        used: false
      },
      {
        title: "Breakthrough in Quantum Computing: New Processor Achieves Record Performance",
        description: "Scientists unveil a revolutionary quantum processor that could accelerate computing capabilities and solve complex problems in minutes instead of years.",
        source: "Tech News",
        score: 90,
        category: "Technology",
        keywords: ["quantum", "computing", "processor", "technology", "breakthrough"],
        used: false
      }
    ]);

    // Create API configurations
    console.log("🔧 Creating API configurations...");
    await db.insert(apiConfigurations).values([
      {
        service: "gemini",
        isActive: true,
        config: {
          model: "gemini-pro",
          temperature: 0.7,
          maxTokens: 2048
        }
      },
      {
        service: "youtube",
        isActive: true,
        config: {
          defaultCategory: "25",
          defaultPrivacy: "public",
          uploadQuality: "hd1080"
        }
      },
      {
        service: "drive",
        isActive: true,
        config: {
          folderPrefix: "AutoTube_Videos",
          shareByDefault: false
        }
      },
      {
        service: "tts",
        isActive: true,
        config: {
          voice: "en-IN-Standard-D",
          languageCode: "en-IN",
          speakingRate: 0.9,
          pitch: -2.0
        }
      }
    ]);

    // Create default schedules
    console.log("⏰ Creating default schedules...");
    await db.insert(schedules).values([
      {
        name: "Daily Video Creation",
        cronExpression: "30 12 * * *",
        jobType: "daily_video",
        isActive: true,
        config: {
          timezone: "Asia/Kolkata",
          description: "Create and publish daily trending news video at 6:00 PM IST"
        }
      },
      {
        name: "News Analysis",
        cronExpression: "0 */4 * * *",
        jobType: "news_analysis",
        isActive: true,
        config: {
          timezone: "Asia/Kolkata",
          description: "Analyze trending news every 4 hours"
        }
      },
      {
        name: "Cleanup",
        cronExpression: "0 2 * * *",
        jobType: "cleanup",
        isActive: true,
        config: {
          timezone: "Asia/Kolkata",
          description: "Clean up old files and data daily at 2 AM"
        }
      }
    ]);

    // Create a sample video (optional)
    console.log("🎬 Creating sample video entry...");
    await db.insert(videos).values([
      {
        title: "Welcome to AutoTube - Your AI-Powered Video Creation System",
        description: "This is a sample video created by the AutoTube system to demonstrate the automated video creation pipeline.",
        status: "completed",
        trendingTopic: "AI Video Automation",
        trendingScore: 85,
        duration: "2:30"
      }
    ]);

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