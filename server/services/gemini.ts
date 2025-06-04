import { GoogleGenerativeAI } from "@google/generative-ai";
import type { InsertTrendingTopic } from "@shared/schema";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || "";
    if (!apiKey) {
      console.warn("Gemini API key not found. Some features may not work.");
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async analyzeTrendingNews(): Promise<Omit<InsertTrendingTopic, "analyzedAt">[]> {
    try {
      const prompt = `
        Analyze the current trending news topics globally and provide a JSON array of the top 10 most trending topics.
        For each topic, include:
        - title: A catchy, YouTube-friendly title
        - description: A brief description suitable for video content
        - source: The type of source (e.g., "Tech News", "World News", "Politics")
        - score: A trending score from 1-100
        - category: Category like "Technology", "Politics", "Science", "Entertainment"
        - keywords: Array of relevant keywords for SEO

        Focus on topics that would make engaging YouTube videos with high view potential.
        Ensure the titles are clickable and the content is suitable for automated video creation.

        Return only valid JSON, no other text.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      try {
        const topics = JSON.parse(text);
        return Array.isArray(topics) ? topics : [];
      } catch (parseError) {
        console.error("Failed to parse Gemini response:", parseError);
        // Return fallback trending topics
        return this.getFallbackTopics();
      }
    } catch (error) {
      console.error("Error analyzing trending news:", error);
      return this.getFallbackTopics();
    }
  }

  async generateVideoScript(topic: string, duration: number = 300): Promise<string> {
    try {
      const prompt = `
        Create a engaging YouTube video script about "${topic}" that is approximately ${duration} seconds long.
        
        The script should:
        - Start with a compelling hook
        - Be informative and engaging
        - Include natural pauses for visuals
        - Be suitable for Indian English text-to-speech
        - Have a clear structure with introduction, main content, and conclusion
        - Include call-to-action for likes and subscriptions
        - Be factual and well-researched
        
        Format the script with clear paragraphs and natural speaking rhythm.
        Avoid complex words that might be difficult for TTS to pronounce correctly.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating video script:", error);
      return `Welcome to today's news update about ${topic}. In this video, we'll explore the latest developments and what they mean for you. Stay tuned for all the important details.`;
    }
  }

  async generateVideoDescription(title: string, script: string): Promise<string> {
    try {
      const prompt = `
        Create a YouTube video description for a video titled "${title}".
        
        The description should:
        - Be engaging and SEO-optimized
        - Include relevant hashtags
        - Be under 5000 characters
        - Include a brief summary of the content
        - Have a call-to-action
        - Include typical YouTube description elements like timestamps if relevant
        
        Script excerpt: ${script.substring(0, 500)}...
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating video description:", error);
      return `Watch our latest update on ${title}. Don't forget to like, subscribe, and hit the notification bell for more daily updates!`;
    }
  }

  async generateThumbnailPrompt(title: string): Promise<string> {
    try {
      const prompt = `
        Create a detailed prompt for generating a YouTube thumbnail image for a video titled "${title}".
        
        The prompt should describe:
        - Visual elements that would attract clicks
        - Colors and composition
        - Text overlay suggestions
        - Background elements
        - Overall style (modern, professional, eye-catching)
        
        Keep it concise but descriptive for an AI image generator.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating thumbnail prompt:", error);
      return `Professional news thumbnail with bold text "${title}", modern gradient background, breaking news style graphics`;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const result = await this.model.generateContent("Health check: respond with 'OK'");
      const response = await result.response;
      return response.text().trim().toLowerCase() === "ok";
    } catch {
      return false;
    }
  }

  private getFallbackTopics(): Omit<InsertTrendingTopic, "analyzedAt">[] {
    return [
      {
        title: "AI Technology Breakthrough in Healthcare",
        description: "Latest developments in artificial intelligence revolutionizing medical diagnosis and treatment",
        source: "Tech News",
        score: 92,
        category: "Technology",
        keywords: ["AI", "healthcare", "technology", "innovation"]
      },
      {
        title: "Global Climate Summit Announces New Initiatives",
        description: "World leaders unite on ambitious climate goals and renewable energy commitments",
        source: "World News",
        score: 87,
        category: "Environment",
        keywords: ["climate", "environment", "summit", "renewable energy"]
      },
      {
        title: "Space Exploration: Mars Mission Reveals New Discoveries",
        description: "NASA's latest Mars rover uncovers fascinating evidence about the planet's history",
        source: "Science News",
        score: 84,
        category: "Science",
        keywords: ["space", "Mars", "NASA", "discovery"]
      }
    ];
  }
}
