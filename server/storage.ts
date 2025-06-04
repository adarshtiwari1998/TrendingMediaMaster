import { 
  users, 
  videos, 
  trendingTopics, 
  automationJobs, 
  apiConfigurations, 
  schedules,
  type User, 
  type InsertUser,
  type Video,
  type InsertVideo,
  type TrendingTopic,
  type InsertTrendingTopic,
  type AutomationJob,
  type InsertAutomationJob,
  type ApiConfiguration,
  type InsertApiConfiguration,
  type Schedule,
  type InsertSchedule
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  
  // Video methods
  getVideos(): Promise<Video[]>;
  getVideo(id: number): Promise<Video | undefined>;
  createVideo(insertVideo: InsertVideo): Promise<Video>;
  updateVideo(id: number, updates: Partial<Video>): Promise<Video>;
  
  // Trending topics methods
  getTrendingTopics(): Promise<TrendingTopic[]>;
  getTrendingTopic(id: number): Promise<TrendingTopic | undefined>;
  createTrendingTopic(insertTopic: InsertTrendingTopic): Promise<TrendingTopic>;
  updateTrendingTopic(id: number, updates: Partial<TrendingTopic>): Promise<TrendingTopic>;
  getUnusedTrendingTopics(): Promise<TrendingTopic[]>;
  getRecentTrendingTopics(hours: number): Promise<TrendingTopic[]>;
  deleteOldTrendingTopics(days: number): Promise<number>;
  
  // Automation jobs methods
  getAutomationJobs(): Promise<AutomationJob[]>;
  createAutomationJob(insertJob: InsertAutomationJob): Promise<AutomationJob>;
  updateAutomationJob(id: number, updates: Partial<AutomationJob>): Promise<AutomationJob>;
  getRunningAutomationJobs(type?: string): Promise<AutomationJob[]>;
  deleteOldAutomationJobs(days: number): Promise<number>;
  getCurrentPipelineJobs(): Promise<AutomationJob[]>;
  getNextScheduledVideo(): Promise<Video | undefined>;
  
  // API configurations methods
  getApiConfiguration(service: string): Promise<ApiConfiguration | undefined>;
  createApiConfiguration(insertConfig: InsertApiConfiguration): Promise<ApiConfiguration>;
  updateApiConfiguration(service: string, updates: Partial<ApiConfiguration>): Promise<ApiConfiguration>;
  
  // Schedule methods
  getSchedules(): Promise<Schedule[]>;
  createSchedule(insertSchedule: InsertSchedule): Promise<Schedule>;
  deleteSchedule(name: string): Promise<void>;
  
  // Dashboard methods
  getDashboardStats(): Promise<any>;
  checkHealth(): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Video methods
  async getVideos(): Promise<Video[]> {
    return await db.select().from(videos).orderBy(desc(videos.createdAt));
  }

  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video || undefined;
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db
      .insert(videos)
      .values(insertVideo)
      .returning();
    return video;
  }

  async updateVideo(id: number, updates: Partial<Video>): Promise<Video> {
    const [video] = await db
      .update(videos)
      .set(updates)
      .where(eq(videos.id, id))
      .returning();
    return video;
  }

  // Trending topics methods
  async getTrendingTopics(): Promise<TrendingTopic[]> {
    return await db.select().from(trendingTopics).orderBy(desc(trendingTopics.score));
  }

  async getTrendingTopic(id: number): Promise<TrendingTopic | undefined> {
    const [topic] = await db.select().from(trendingTopics).where(eq(trendingTopics.id, id));
    return topic || undefined;
  }

  async createTrendingTopic(insertTopic: InsertTrendingTopic): Promise<TrendingTopic> {
    const [topic] = await db
      .insert(trendingTopics)
      .values(insertTopic)
      .returning();
    return topic;
  }

  async updateTrendingTopic(id: number, updates: Partial<TrendingTopic>): Promise<TrendingTopic> {
    const [topic] = await db
      .update(trendingTopics)
      .set(updates)
      .where(eq(trendingTopics.id, id))
      .returning();
    return topic;
  }

  async getUnusedTrendingTopics(): Promise<TrendingTopic[]> {
    return await db
      .select()
      .from(trendingTopics)
      .where(eq(trendingTopics.used, false))
      .orderBy(desc(trendingTopics.score));
  }

  async getRecentTrendingTopics(hours: number): Promise<TrendingTopic[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return await db
      .select()
      .from(trendingTopics)
      .where(gte(trendingTopics.analyzedAt, cutoffTime));
  }

  async deleteOldTrendingTopics(days: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await db
      .delete(trendingTopics)
      .where(lte(trendingTopics.analyzedAt, cutoffTime));
    return result.rowCount || 0;
  }

  // Automation jobs methods
  async getAutomationJobs(): Promise<AutomationJob[]> {
    return await db.select().from(automationJobs).orderBy(desc(automationJobs.createdAt));
  }

  async createAutomationJob(insertJob: InsertAutomationJob): Promise<AutomationJob> {
    const [job] = await db
      .insert(automationJobs)
      .values(insertJob)
      .returning();
    return job;
  }

  async updateAutomationJob(id: number, updates: Partial<AutomationJob>): Promise<AutomationJob> {
    const [job] = await db
      .update(automationJobs)
      .set(updates)
      .where(eq(automationJobs.id, id))
      .returning();
    return job;
  }

  async getRunningAutomationJobs(type?: string): Promise<AutomationJob[]> {
    let query = db
      .select()
      .from(automationJobs)
      .where(eq(automationJobs.status, "running"));
    
    if (type) {
      query = query.where(and(eq(automationJobs.status, "running"), eq(automationJobs.type, type)));
    }
    
    return await query;
  }

  async deleteOldAutomationJobs(days: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await db
      .delete(automationJobs)
      .where(and(
        eq(automationJobs.status, "completed"),
        lte(automationJobs.createdAt, cutoffTime)
      ));
    return result.rowCount || 0;
  }

  async getCurrentPipelineJobs(): Promise<AutomationJob[]> {
    return await db
      .select()
      .from(automationJobs)
      .where(eq(automationJobs.status, "running"))
      .orderBy(desc(automationJobs.createdAt));
  }

  async getNextScheduledVideo(): Promise<Video | undefined> {
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.status, "scheduled"))
      .orderBy(videos.scheduledAt);
    return video || undefined;
  }

  // API configurations methods
  async getApiConfiguration(service: string): Promise<ApiConfiguration | undefined> {
    const [config] = await db
      .select()
      .from(apiConfigurations)
      .where(eq(apiConfigurations.service, service));
    return config || undefined;
  }

  async createApiConfiguration(insertConfig: InsertApiConfiguration): Promise<ApiConfiguration> {
    const [config] = await db
      .insert(apiConfigurations)
      .values(insertConfig)
      .returning();
    return config;
  }

  async updateApiConfiguration(service: string, updates: Partial<ApiConfiguration>): Promise<ApiConfiguration> {
    const [config] = await db
      .update(apiConfigurations)
      .set(updates)
      .where(eq(apiConfigurations.service, service))
      .returning();
    return config;
  }

  // Schedule methods
  async getSchedules(): Promise<Schedule[]> {
    return await db.select().from(schedules).orderBy(schedules.name);
  }

  async createSchedule(insertSchedule: InsertSchedule): Promise<Schedule> {
    const [schedule] = await db
      .insert(schedules)
      .values(insertSchedule)
      .returning();
    return schedule;
  }

  async deleteSchedule(name: string): Promise<void> {
    await db.delete(schedules).where(eq(schedules.name, name));
  }

  // Dashboard methods
  async getDashboardStats(): Promise<any> {
    const videosCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(videos);
    
    const publishedVideos = await db
      .select({ count: sql<number>`count(*)` })
      .from(videos)
      .where(eq(videos.status, "published"));
    
    const totalViews = await db
      .select({ total: sql<number>`sum(${videos.views})` })
      .from(videos)
      .where(eq(videos.status, "published"));
    
    const queueCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(videos)
      .where(eq(videos.status, "pending"));

    const successRate = videosCount[0]?.count > 0 
      ? Math.round((publishedVideos[0]?.count / videosCount[0]?.count) * 100)
      : 0;

    return {
      videosCreated: videosCount[0]?.count || 0,
      totalViews: (totalViews[0]?.total || 0).toLocaleString(),
      successRate: `${successRate}%`,
      queueCount: queueCount[0]?.count || 0,
      viewsGrowth: "+12%",
      successGrowth: "+5%",
      createdGrowth: "+8%"
    };
  }

  async checkHealth(): Promise<boolean> {
    try {
      await db.select().from(users).limit(1);
      return true;
    } catch {
      return false;
    }
  }
}

export const storage = new DatabaseStorage();