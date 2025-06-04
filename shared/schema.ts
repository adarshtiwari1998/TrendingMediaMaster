import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  script: text("script"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, published, failed
  youtubeId: text("youtube_id"),
  thumbnailUrl: text("thumbnail_url"),
  driveFileId: text("drive_file_id"),
  views: integer("views").default(0),
  likes: integer("likes").default(0),
  duration: text("duration"),
  trendingTopic: text("trending_topic"),
  trendingScore: integer("trending_score"),
  createdAt: timestamp("created_at").defaultNow(),
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),
});

export const automationJobs = pgTable("automation_jobs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // news_analysis, video_creation, thumbnail_generation, publishing
  status: text("status").notNull().default("pending"), // pending, running, completed, failed
  videoId: integer("video_id"),
  payload: jsonb("payload"),
  result: jsonb("result"),
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const trendingTopics = pgTable("trending_topics", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  source: text("source"),
  url: text("url"),
  score: integer("score").notNull(),
  category: text("category"),
  keywords: text("keywords").array(),
  analyzedAt: timestamp("analyzed_at").defaultNow(),
  used: boolean("used").default(false),
});

export const apiConfigurations = pgTable("api_configurations", {
  id: serial("id").primaryKey(),
  service: text("service").notNull().unique(), // gemini, youtube, drive, tts
  apiKey: text("api_key"),
  config: jsonb("config"),
  isActive: boolean("is_active").default(true),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cronExpression: text("cron_expression").notNull(),
  jobType: text("job_type").notNull(), // daily_video, news_analysis, cleanup
  isActive: boolean("is_active").default(true),
  config: jsonb("config"),
  lastRun: timestamp("last_run"),
  nextRun: timestamp("next_run"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const videosRelations = relations(videos, ({ many }) => ({
  jobs: many(automationJobs),
}));

export const automationJobsRelations = relations(automationJobs, ({ one }) => ({
  video: one(videos, {
    fields: [automationJobs.videoId],
    references: [videos.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  title: true,
  description: true,
  script: true,
  trendingTopic: true,
  trendingScore: true,
  scheduledAt: true,
});

export const insertAutomationJobSchema = createInsertSchema(automationJobs).pick({
  type: true,
  videoId: true,
  payload: true,
});

export const insertTrendingTopicSchema = createInsertSchema(trendingTopics).pick({
  title: true,
  description: true,
  source: true,
  url: true,
  score: true,
  category: true,
  keywords: true,
});

export const insertApiConfigurationSchema = createInsertSchema(apiConfigurations).pick({
  service: true,
  apiKey: true,
  config: true,
});

export const insertScheduleSchema = createInsertSchema(schedules).pick({
  name: true,
  cronExpression: true,
  jobType: true,
  config: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

export type InsertAutomationJob = z.infer<typeof insertAutomationJobSchema>;
export type AutomationJob = typeof automationJobs.$inferSelect;

export type InsertTrendingTopic = z.infer<typeof insertTrendingTopicSchema>;
export type TrendingTopic = typeof trendingTopics.$inferSelect;

export type InsertApiConfiguration = z.infer<typeof insertApiConfigurationSchema>;
export type ApiConfiguration = typeof apiConfigurations.$inferSelect;

export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedules.$inferSelect;
