import cron from "node-cron";
import { storage } from "../storage";
import { GeminiService } from "./gemini";
import { VideoCreatorService } from "./video-creator";
import { YouTubeService } from "./youtube";
import { DriveService } from "./drive";

export class SchedulerService {
  private geminiService: GeminiService;
  private videoCreatorService: VideoCreatorService;
  private youtubeService: YouTubeService;
  private driveService: DriveService;
  private jobs: Map<string, cron.ScheduledTask> = new Map();
  private isRunning = false;

  constructor() {
    this.geminiService = new GeminiService();
    this.videoCreatorService = new VideoCreatorService();
    this.youtubeService = new YouTubeService();
    this.driveService = new DriveService();
  }

  async start(): Promise<void> {
    try {
      console.log("Starting scheduler service...");
      
      // Daily video creation and publishing (6:00 PM IST = 12:30 PM UTC)
      const dailyVideoJob = cron.schedule("30 12 * * *", async () => {
        await this.runDailyVideoCreation();
      }, {
        scheduled: false,
        timezone: "Asia/Kolkata"
      });

      // News analysis every 4 hours
      const newsAnalysisJob = cron.schedule("0 */4 * * *", async () => {
        await this.runNewsAnalysis();
      }, {
        scheduled: false,
        timezone: "Asia/Kolkata"
      });

      // Cleanup old files daily at 2 AM
      const cleanupJob = cron.schedule("0 2 * * *", async () => {
        await this.runCleanup();
      }, {
        scheduled: false,
        timezone: "Asia/Kolkata"
      });

      // Start all jobs
      dailyVideoJob.start();
      newsAnalysisJob.start();
      cleanupJob.start();

      this.jobs.set("dailyVideo", dailyVideoJob);
      this.jobs.set("newsAnalysis", newsAnalysisJob);
      this.jobs.set("cleanup", cleanupJob);

      this.isRunning = true;
      console.log("Scheduler service started successfully");

      // Run initial news analysis if no recent topics exist
      await this.checkAndRunInitialAnalysis();

    } catch (error) {
      console.error("Error starting scheduler:", error);
    }
  }

  async stop(): Promise<void> {
    console.log("Stopping scheduler service...");
    
    for (const [name, job] of this.jobs.entries()) {
      job.destroy();
      console.log(`Stopped ${name} job`);
    }
    
    this.jobs.clear();
    this.isRunning = false;
    console.log("Scheduler service stopped");
  }

  async runDailyVideoCreation(): Promise<void> {
    try {
      console.log("Starting daily video creation...");

      // Create automation job record
      const job = await storage.createAutomationJob({
        type: "video_creation",
        payload: { scheduled: true, timestamp: new Date().toISOString() }
      });

      await storage.updateAutomationJob(job.id, { 
        status: "running",
        startedAt: new Date()
      });

      // Get best trending topic
      const topics = await storage.getUnusedTrendingTopics();
      if (topics.length === 0) {
        throw new Error("No trending topics available");
      }

      const bestTopic = topics[0]; // Assuming they're sorted by score

      // Create video record
      const video = await storage.createVideo({
        title: `Breaking: ${bestTopic.title}`,
        trendingTopic: bestTopic.title,
        trendingScore: bestTopic.score,
        scheduledAt: new Date()
      });

      // Generate video content
      const result = await this.videoCreatorService.createVideo(video, bestTopic);

      // Update video record
      await storage.updateVideo(video.id, {
        script: result.script,
        description: result.description,
        duration: result.duration,
        status: "completed"
      });

      // Upload to YouTube
      const youtubeId = await this.youtubeService.uploadVideo(result.videoPath, {
        title: video.title,
        description: result.description,
        tags: bestTopic.keywords || [],
        privacyStatus: "public"
      });

      // Update thumbnail
      await this.youtubeService.updateThumbnail(youtubeId, result.thumbnailPath);

      // Update video with YouTube info
      await storage.updateVideo(video.id, {
        youtubeId,
        status: "published",
        publishedAt: new Date()
      });

      // Mark topic as used
      await storage.updateTrendingTopic(bestTopic.id, { used: true });

      // Complete automation job
      await storage.updateAutomationJob(job.id, {
        status: "completed",
        result: { videoId: video.id, youtubeId },
        completedAt: new Date()
      });

      // Cleanup temporary files
      await this.videoCreatorService.cleanup([result.videoPath, result.thumbnailPath]);

      console.log(`Daily video creation completed: ${youtubeId}`);

    } catch (error) {
      console.error("Error in daily video creation:", error);
      
      // Update job status
      const runningJobs = await storage.getRunningAutomationJobs("video_creation");
      for (const job of runningJobs) {
        await storage.updateAutomationJob(job.id, {
          status: "failed",
          error: error.message,
          completedAt: new Date()
        });
      }
    }
  }

  async runNewsAnalysis(): Promise<void> {
    try {
      console.log("Starting news analysis...");

      const job = await storage.createAutomationJob({
        type: "news_analysis",
        payload: { scheduled: true, timestamp: new Date().toISOString() }
      });

      await storage.updateAutomationJob(job.id, { 
        status: "running",
        startedAt: new Date()
      });

      // Analyze trending news
      const topics = await this.geminiService.analyzeTrendingNews();

      // Save new topics
      let savedCount = 0;
      for (const topic of topics) {
        try {
          await storage.createTrendingTopic(topic);
          savedCount++;
        } catch (error) {
          console.warn("Failed to save topic:", error);
        }
      }

      await storage.updateAutomationJob(job.id, {
        status: "completed",
        result: { topicsAnalyzed: topics.length, topicsSaved: savedCount },
        completedAt: new Date()
      });

      console.log(`News analysis completed: ${savedCount} topics saved`);

    } catch (error) {
      console.error("Error in news analysis:", error);
      
      const runningJobs = await storage.getRunningAutomationJobs("news_analysis");
      for (const job of runningJobs) {
        await storage.updateAutomationJob(job.id, {
          status: "failed",
          error: error.message,
          completedAt: new Date()
        });
      }
    }
  }

  async runCleanup(): Promise<void> {
    try {
      console.log("Starting cleanup...");

      // Delete old trending topics (older than 7 days)
      const deletedTopics = await storage.deleteOldTrendingTopics(7);

      // Delete old completed automation jobs (older than 30 days)
      const deletedJobs = await storage.deleteOldAutomationJobs(30);

      console.log(`Cleanup completed: ${deletedTopics} topics, ${deletedJobs} jobs deleted`);

    } catch (error) {
      console.error("Error in cleanup:", error);
    }
  }

  private async checkAndRunInitialAnalysis(): Promise<void> {
    try {
      const recentTopics = await storage.getRecentTrendingTopics(24); // Last 24 hours
      if (recentTopics.length === 0) {
        console.log("No recent topics found, running initial analysis...");
        await this.runNewsAnalysis();
      }
    } catch (error) {
      console.error("Error checking for initial analysis:", error);
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }

  isSystemRunning(): boolean {
    return this.isRunning;
  }

  getJobStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    for (const [name, job] of this.jobs.entries()) {
      status[name] = job.running;
    }
    return status;
  }

  async addCustomSchedule(
    name: string,
    cronExpression: string,
    jobType: string,
    config: any = {}
  ): Promise<void> {
    try {
      // Save to database
      await storage.createSchedule({
        name,
        cronExpression,
        jobType,
        config
      });

      // Create and start cron job
      const job = cron.schedule(cronExpression, async () => {
        switch (jobType) {
          case "news_analysis":
            await this.runNewsAnalysis();
            break;
          case "video_creation":
            await this.runDailyVideoCreation();
            break;
          case "cleanup":
            await this.runCleanup();
            break;
          default:
            console.warn(`Unknown job type: ${jobType}`);
        }
      }, { scheduled: true });

      this.jobs.set(name, job);
      console.log(`Custom schedule added: ${name}`);

    } catch (error) {
      console.error("Error adding custom schedule:", error);
      throw error;
    }
  }

  async removeCustomSchedule(name: string): Promise<void> {
    try {
      const job = this.jobs.get(name);
      if (job) {
        job.destroy();
        this.jobs.delete(name);
      }

      await storage.deleteSchedule(name);
      console.log(`Custom schedule removed: ${name}`);

    } catch (error) {
      console.error("Error removing custom schedule:", error);
      throw error;
    }
  }
}
