import { google } from "googleapis";
import path from "path";

export class DriveService {
  private drive: any;
  private oauth2Client: any;

  constructor() {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || process.env.YOUTUBE_REDIRECT_URI
      );

      // Set credentials if refresh token is available
      if (process.env.GOOGLE_REFRESH_TOKEN || process.env.YOUTUBE_REFRESH_TOKEN) {
        this.oauth2Client.setCredentials({
          refresh_token: process.env.GOOGLE_REFRESH_TOKEN || process.env.YOUTUBE_REFRESH_TOKEN,
          access_token: process.env.GOOGLE_ACCESS_TOKEN || process.env.YOUTUBE_ACCESS_TOKEN,
        });
      }

      this.drive = google.drive({
        version: "v3",
        auth: this.oauth2Client,
      });
    } catch (error) {
      console.error("Failed to initialize Drive service:", error);
    }
  }

  async createFolder(name: string, parentFolderId?: string): Promise<string> {
    try {
      const fileMetadata = {
        name: name,
        mimeType: "application/vnd.google-apps.folder",
        parents: parentFolderId ? [parentFolderId] : undefined,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: "id",
      });

      return response.data.id;
    } catch (error) {
      console.error("Error creating folder:", error);
      throw new Error(`Folder creation failed: ${error.message}`);
    }
  }

  async uploadFile(filePath: string, fileName: string, parentFolderId?: string): Promise<string> {
    try {
      const fs = await import("fs");
      
      const fileMetadata = {
        name: fileName,
        parents: parentFolderId ? [parentFolderId] : undefined,
      };

      const media = {
        mimeType: this.getMimeType(filePath),
        body: fs.createReadStream(filePath),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: "id",
      });

      return response.data.id;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  async downloadFile(fileId: string, destinationPath: string): Promise<void> {
    try {
      const fs = await import("fs");
      
      const response = await this.drive.files.get({
        fileId: fileId,
        alt: "media",
      });

      const dest = fs.createWriteStream(destinationPath);
      response.data.pipe(dest);

      return new Promise((resolve, reject) => {
        dest.on("finish", resolve);
        dest.on("error", reject);
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      throw new Error(`File download failed: ${error.message}`);
    }
  }

  async organizeVideoFiles(videoId: number, videoTitle: string): Promise<{
    folderId: string;
    videoFileId?: string;
    thumbnailFileId?: string;
  }> {
    try {
      // Create a folder for this video with today's date
      const today = new Date().toISOString().split("T")[0];
      const folderName = `${today} - ${videoTitle.substring(0, 50)}`;
      
      const folderId = await this.createFolder(folderName);
      
      return {
        folderId,
      };
    } catch (error) {
      console.error("Error organizing video files:", error);
      throw error;
    }
  }

  async uploadVideoAssets(
    folderId: string,
    videoPath?: string,
    thumbnailPath?: string
  ): Promise<{
    videoFileId?: string;
    thumbnailFileId?: string;
  }> {
    try {
      const result: { videoFileId?: string; thumbnailFileId?: string } = {};

      if (videoPath) {
        const videoFileName = `video_${Date.now()}.mp4`;
        result.videoFileId = await this.uploadFile(videoPath, videoFileName, folderId);
      }

      if (thumbnailPath) {
        const thumbnailFileName = `thumbnail_${Date.now()}.jpg`;
        result.thumbnailFileId = await this.uploadFile(thumbnailPath, thumbnailFileName, folderId);
      }

      return result;
    } catch (error) {
      console.error("Error uploading video assets:", error);
      throw error;
    }
  }

  async shareFolder(folderId: string, email?: string): Promise<void> {
    try {
      const permission = {
        role: "reader",
        type: email ? "user" : "anyone",
        emailAddress: email,
      };

      await this.drive.permissions.create({
        fileId: folderId,
        requestBody: permission,
      });
    } catch (error) {
      console.error("Error sharing folder:", error);
      // Don't throw error for sharing failures
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.drive.about.get({ fields: "user" });
      return !!response.data.user;
    } catch {
      return false;
    }
  }

  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".mp4": "video/mp4",
      ".avi": "video/x-msvideo",
      ".mov": "video/quicktime",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".mp3": "audio/mpeg",
      ".wav": "audio/wav",
      ".txt": "text/plain",
      ".json": "application/json",
    };
    return mimeTypes[ext] || "application/octet-stream";
  }
}
