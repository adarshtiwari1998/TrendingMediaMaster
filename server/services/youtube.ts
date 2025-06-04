import { google } from "googleapis";

export class YouTubeService {
  private youtube: any;
  private oauth2Client: any;

  constructor() {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET,
        process.env.YOUTUBE_REDIRECT_URI
      );

      // Set credentials if refresh token is available
      if (process.env.YOUTUBE_REFRESH_TOKEN) {
        this.oauth2Client.setCredentials({
          refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
          access_token: process.env.YOUTUBE_ACCESS_TOKEN,
        });
      }

      this.youtube = google.youtube({
        version: "v3",
        auth: this.oauth2Client,
      });
    } catch (error) {
      console.error("Failed to initialize YouTube service:", error);
    }
  }

  async uploadVideo(videoPath: string, metadata: {
    title: string;
    description: string;
    tags?: string[];
    categoryId?: string;
    privacyStatus?: "private" | "public" | "unlisted";
  }): Promise<string> {
    try {
      const fs = await import("fs");
      
      const response = await this.youtube.videos.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags || [],
            categoryId: metadata.categoryId || "25", // News & Politics
            defaultLanguage: "en",
            defaultAudioLanguage: "en",
          },
          status: {
            privacyStatus: metadata.privacyStatus || "public",
            selfDeclaredMadeForKids: false,
          },
        },
        media: {
          body: fs.createReadStream(videoPath),
        },
      });

      return response.data.id;
    } catch (error) {
      console.error("Error uploading video to YouTube:", error);
      throw new Error(`YouTube upload failed: ${error.message}`);
    }
  }

  async updateThumbnail(videoId: string, thumbnailPath: string): Promise<void> {
    try {
      const fs = await import("fs");
      
      await this.youtube.thumbnails.set({
        videoId: videoId,
        media: {
          body: fs.createReadStream(thumbnailPath),
        },
      });
    } catch (error) {
      console.error("Error updating thumbnail:", error);
      throw new Error(`Thumbnail update failed: ${error.message}`);
    }
  }

  async getVideoStats(videoId: string): Promise<{
    viewCount: number;
    likeCount: number;
    commentCount: number;
  }> {
    try {
      const response = await this.youtube.videos.list({
        part: ["statistics"],
        id: [videoId],
      });

      const stats = response.data.items[0]?.statistics;
      return {
        viewCount: parseInt(stats?.viewCount || "0"),
        likeCount: parseInt(stats?.likeCount || "0"),
        commentCount: parseInt(stats?.commentCount || "0"),
      };
    } catch (error) {
      console.error("Error fetching video stats:", error);
      return { viewCount: 0, likeCount: 0, commentCount: 0 };
    }
  }

  async createPlaylist(title: string, description: string): Promise<string> {
    try {
      const response = await this.youtube.playlists.insert({
        part: ["snippet", "status"],
        requestBody: {
          snippet: {
            title: title,
            description: description,
            defaultLanguage: "en",
          },
          status: {
            privacyStatus: "public",
          },
        },
      });

      return response.data.id;
    } catch (error) {
      console.error("Error creating playlist:", error);
      throw new Error(`Playlist creation failed: ${error.message}`);
    }
  }

  async addVideoToPlaylist(playlistId: string, videoId: string): Promise<void> {
    try {
      await this.youtube.playlistItems.insert({
        part: ["snippet"],
        requestBody: {
          snippet: {
            playlistId: playlistId,
            resourceId: {
              kind: "youtube#video",
              videoId: videoId,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error adding video to playlist:", error);
      throw new Error(`Adding to playlist failed: ${error.message}`);
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Try to get channel information as a health check
      const response = await this.youtube.channels.list({
        part: ["snippet"],
        mine: true,
      });
      return response.data.items.length > 0;
    } catch {
      return false;
    }
  }

  getAuthUrl(): string {
    const scopes = [
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube",
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
    });
  }

  async getAccessToken(code: string): Promise<any> {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error("Error getting access token:", error);
      throw error;
    }
  }
}
