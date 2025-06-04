import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertVideoSchema, insertTrendingTopicSchema, insertAutomationJobSchema } from "@shared/schema";
import { GeminiService } from "./services/gemini";
import { YouTubeService } from "./services/youtube";
import { DriveService } from "./services/drive";
import { TTSService } from "./services/tts";
import { VideoCreatorService } from "./services/video-creator";
import { SchedulerService } from "./services/scheduler";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const geminiService = new GeminiService();
  const youtubeService = new YouTubeService();
  const driveService = new DriveService();
  const ttsService = new TTSService();
  const videoCreatorService = new VideoCreatorService();
  const schedulerService = new SchedulerService();

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Videos API
  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getVideos();
      res.json(videos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      console.error("Error fetching video:", error);
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });

  app.post("/api/videos", async (req, res) => {
    try {
      const validation = insertVideoSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
      }
      
      const video = await storage.createVideo(validation.data);
      res.status(201).json(video);
    } catch (error) {
      console.error("Error creating video:", error);
      res.status(500).json({ error: "Failed to create video" });
    }
  });

  // Trending topics API
  app.get("/api/trending-topics", async (req, res) => {
    try {
      const topics = await storage.getTrendingTopics();
      res.json(topics);
    } catch (error) {
      console.error("Error fetching trending topics:", error);
      res.status(500).json({ error: "Failed to fetch trending topics" });
    }
  });

  app.post("/api/trending-topics/analyze", async (req, res) => {
    try {
      const topics = await geminiService.analyzeTrendingNews();
      
      // Save topics to database
      for (const topic of topics) {
        await storage.createTrendingTopic(topic);
      }
      
      res.json({ message: "Trending topics analyzed successfully", count: topics.length });
    } catch (error) {
      console.error("Error analyzing trending topics:", error);
      res.status(500).json({ error: "Failed to analyze trending topics" });
    }
  });

  // Automation jobs API
  app.get("/api/automation-jobs", async (req, res) => {
    try {
      const jobs = await storage.getAutomationJobs();
      res.json(jobs);
    } catch (error) {
      console.error("Error fetching automation jobs:", error);
      res.status(500).json({ error: "Failed to fetch automation jobs" });
    }
  });

  app.post("/api/automation-jobs", async (req, res) => {
    try {
      const validation = insertAutomationJobSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: validation.error.issues });
      }
      
      const job = await storage.createAutomationJob(validation.data);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating automation job:", error);
      res.status(500).json({ error: "Failed to create automation job" });
    }
  });

  // Manual triggers
  app.post("/api/manual/news-analysis", async (req, res) => {
    try {
      const job = await storage.createAutomationJob({
        type: "news_analysis",
        payload: { manual: true }
      });
      
      // Run analysis in background
      geminiService.analyzeTrendingNews().then(async (topics) => {
        for (const topic of topics) {
          await storage.createTrendingTopic(topic);
        }
        await storage.updateAutomationJob(job.id, { 
          status: "completed",
          result: { topicsCount: topics.length },
          completedAt: new Date()
        });
      }).catch(async (error) => {
        await storage.updateAutomationJob(job.id, { 
          status: "failed",
          error: error.message,
          completedAt: new Date()
        });
      });
      
      res.json({ message: "News analysis started", jobId: job.id });
    } catch (error) {
      console.error("Error starting news analysis:", error);
      res.status(500).json({ error: "Failed to start news analysis" });
    }
  });

  app.post("/api/manual/create-video", async (req, res) => {
    try {
      const { topicId } = req.body;
      
      if (!topicId) {
        return res.status(400).json({ error: "Topic ID is required" });
      }
      
      const topic = await storage.getTrendingTopic(topicId);
      if (!topic) {
        return res.status(404).json({ error: "Topic not found" });
      }
      
      // Create video record
      const video = await storage.createVideo({
        title: `Breaking: ${topic.title}`,
        trendingTopic: topic.title,
        trendingScore: topic.score,
        scheduledAt: new Date()
      });
      
      // Create automation job for video creation
      const job = await storage.createAutomationJob({
        type: "video_creation",
        videoId: video.id,
        payload: { topicId: topic.id, manual: true }
      });
      
      // Start video creation process
      videoCreatorService.createVideo(video, topic).then(async (result) => {
        await storage.updateVideo(video.id, {
          script: result.script,
          description: result.description,
          duration: result.duration,
          status: "completed"
        });
        await storage.updateAutomationJob(job.id, {
          status: "completed",
          result: result,
          completedAt: new Date()
        });
      }).catch(async (error) => {
        await storage.updateVideo(video.id, { status: "failed" });
        await storage.updateAutomationJob(job.id, {
          status: "failed",
          error: error.message,
          completedAt: new Date()
        });
      });
      
      res.json({ message: "Video creation started", videoId: video.id, jobId: job.id });
    } catch (error) {
      console.error("Error starting video creation:", error);
      res.status(500).json({ error: "Failed to start video creation" });
    }
  });

  app.post("/api/manual/test-tts", async (req, res) => {
    try {
      const { text = "Hello, this is a test of the Indian English text-to-speech voice." } = req.body;
      
      const audioUrl = await ttsService.generateSpeech(text, {
        voice: "en-IN-Standard-A",
        languageCode: "en-IN"
      });
      
      res.json({ message: "TTS test completed", audioUrl });
    } catch (error) {
      console.error("Error testing TTS:", error);
      res.status(500).json({ error: "Failed to test TTS" });
    }
  });

  app.get("/api/system/health", async (req, res) => {
    try {
      const health = {
        database: await storage.checkHealth(),
        gemini: await geminiService.checkHealth(),
        youtube: await youtubeService.checkHealth(),
        drive: await driveService.checkHealth(),
        tts: await ttsService.checkHealth(),
        scheduler: schedulerService.isRunning()
      };
      
      res.json(health);
    } catch (error) {
      console.error("Error checking system health:", error);
      res.status(500).json({ error: "Failed to check system health" });
    }
  });

  // Pipeline status
  app.get("/api/pipeline/status", async (req, res) => {
    try {
      const currentJobs = await storage.getCurrentPipelineJobs();
      const nextScheduled = await storage.getNextScheduledVideo();
      
      res.json({
        currentJobs,
        nextScheduled,
        isActive: schedulerService.isRunning()
      });
    } catch (error) {
      console.error("Error fetching pipeline status:", error);
      res.status(500).json({ error: "Failed to fetch pipeline status" });
    }
  });

  // Start scheduler on server startup
  schedulerService.start();

  const httpServer = createServer(app);
  return httpServer;
}
