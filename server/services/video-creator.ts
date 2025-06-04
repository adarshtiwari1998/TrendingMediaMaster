import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import type { Video, TrendingTopic } from "@shared/schema";
import { GeminiService } from "./gemini";
import { TTSService } from "./tts";
import { DriveService } from "./drive";

const execAsync = promisify(exec);

export class VideoCreatorService {
  private geminiService: GeminiService;
  private ttsService: TTSService;
  private driveService: DriveService;

  constructor() {
    this.geminiService = new GeminiService();
    this.ttsService = new TTSService();
    this.driveService = new DriveService();
  }

  async createVideo(
    video: Video,
    topic: TrendingTopic
  ): Promise<{
    script: string;
    description: string;
    duration: string;
    videoPath: string;
    thumbnailPath: string;
  }> {
    try {
      console.log(`Starting video creation for: ${video.title}`);

      // Generate script
      const script = await this.geminiService.generateVideoScript(topic.title, 300);
      
      // Generate description
      const description = await this.geminiService.generateVideoDescription(video.title, script);

      // Generate audio from script
      const audioPath = await this.ttsService.generateSpeechForScript(script);

      // Get audio duration
      const duration = await this.getAudioDuration(audioPath);

      // Create video with visuals
      const videoPath = await this.createVideoWithVisuals(audioPath, video.title, script);

      // Generate thumbnail
      const thumbnailPath = await this.generateThumbnail(video.title);

      // Upload to Google Drive
      const driveFolder = await this.driveService.organizeVideoFiles(video.id, video.title);
      await this.driveService.uploadVideoAssets(driveFolder.folderId, videoPath, thumbnailPath);

      console.log(`Video creation completed for: ${video.title}`);

      return {
        script,
        description,
        duration,
        videoPath,
        thumbnailPath,
      };
    } catch (error) {
      console.error("Error creating video:", error);
      throw error;
    }
  }

  private async createVideoWithVisuals(
    audioPath: string,
    title: string,
    script: string
  ): Promise<string> {
    try {
      const outputPath = path.join(process.cwd(), "temp", `video_${Date.now()}.mp4`);
      
      // Ensure temp directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // Create a simple video with text overlays and background
      // This is a basic implementation - you can enhance with more sophisticated video editing
      const ffmpegCommand = `
        ffmpeg -f lavfi -i color=c=0x1a1a2e:duration=300:size=1920x1080:rate=30 \
        -i "${audioPath}" \
        -filter_complex "
          [0:v]drawtext=text='${this.escapeText(title)}':
            fontsize=60:fontcolor=white:x=(w-text_w)/2:y=h/4:
            fontfile=/System/Library/Fonts/Arial.ttf:
            box=1:boxcolor=black@0.5:boxborderw=10[title];
          [title]drawtext=text='Breaking News Update':
            fontsize=40:fontcolor=orange:x=(w-text_w)/2:y=h/8:
            fontfile=/System/Library/Fonts/Arial.ttf[output]
        " \
        -map "[output]" -map 1:a \
        -c:v libx264 -c:a aac \
        -shortest "${outputPath}"
      `;

      await execAsync(ffmpegCommand);
      return outputPath;
    } catch (error) {
      console.error("Error creating video with visuals:", error);
      
      // Fallback: create a simple video with just audio and solid background
      return this.createSimpleVideo(audioPath, title);
    }
  }

  private async createSimpleVideo(audioPath: string, title: string): Promise<string> {
    try {
      const outputPath = path.join(process.cwd(), "temp", `simple_video_${Date.now()}.mp4`);
      
      // Create a simple video with colored background and title
      const ffmpegCommand = `
        ffmpeg -f lavfi -i color=c=blue:duration=300:size=1280x720:rate=30 \
        -i "${audioPath}" \
        -filter_complex "
          [0:v]drawtext=text='${this.escapeText(title)}':fontsize=48:fontcolor=white:
          x=(w-text_w)/2:y=(h-text_h)/2[v]
        " \
        -map "[v]" -map 1:a \
        -c:v libx264 -c:a aac \
        -shortest "${outputPath}"
      `;

      await execAsync(ffmpegCommand);
      return outputPath;
    } catch (error) {
      console.error("Error creating simple video:", error);
      throw new Error(`Video creation failed: ${error.message}`);
    }
  }

  private async generateThumbnail(title: string): Promise<string> {
    try {
      const outputPath = path.join(process.cwd(), "temp", `thumbnail_${Date.now()}.jpg`);
      
      // Create a simple thumbnail using FFmpeg
      const ffmpegCommand = `
        ffmpeg -f lavfi -i color=c=0x1a1a2e:size=1280x720:duration=1 \
        -filter_complex "
          [0:v]drawtext=text='${this.escapeText(title)}':
            fontsize=48:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2:
            fontfile=/System/Library/Fonts/Arial.ttf:
            box=1:boxcolor=red@0.8:boxborderw=20[thumb]
        " \
        -map "[thumb]" -frames:v 1 "${outputPath}"
      `;

      await execAsync(ffmpegCommand);
      return outputPath;
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      throw new Error(`Thumbnail generation failed: ${error.message}`);
    }
  }

  private async getAudioDuration(audioPath: string): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`
      );
      const seconds = Math.floor(parseFloat(stdout.trim()));
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    } catch (error) {
      console.error("Error getting audio duration:", error);
      return "0:00";
    }
  }

  private escapeText(text: string): string {
    return text
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"')
      .replace(/:/g, "\\:")
      .replace(/\[/g, "\\[")
      .replace(/\]/g, "\\]")
      .replace(/\n/g, " ")
      .substring(0, 100); // Limit length for FFmpeg
  }

  async enhanceVideoWithEffects(videoPath: string, effects: string[] = []): Promise<string> {
    try {
      const outputPath = path.join(process.cwd(), "temp", `enhanced_${Date.now()}.mp4`);
      
      let filterComplex = "[0:v]";
      
      // Add various effects based on requirements
      if (effects.includes("fade")) {
        filterComplex += "fade=in:0:30,fade=out:st=270:d=30,";
      }
      
      if (effects.includes("zoom")) {
        filterComplex += "zoompan=z='if(lte(zoom,1.0),1.5,max(1.001,zoom-0.0015))':d=125:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',";
      }
      
      // Remove trailing comma
      filterComplex = filterComplex.replace(/,$/, "");
      filterComplex += "[v]";

      const ffmpegCommand = `
        ffmpeg -i "${videoPath}" \
        -filter_complex "${filterComplex}" \
        -map "[v]" -map 0:a \
        -c:v libx264 -c:a copy \
        "${outputPath}"
      `;

      await execAsync(ffmpegCommand);
      return outputPath;
    } catch (error) {
      console.error("Error enhancing video:", error);
      return videoPath; // Return original if enhancement fails
    }
  }

  async cleanup(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.warn(`Failed to cleanup file ${filePath}:`, error);
      }
    }
  }
}
