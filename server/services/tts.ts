import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { promises as fs } from "fs";
import path from "path";

export class TTSService {
  private client: TextToSpeechClient;

  constructor() {
    try {
      // Initialize with credentials from environment
      const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_KEY 
        ? JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY)
        : undefined;

      this.client = new TextToSpeechClient({
        credentials,
        projectId: process.env.GOOGLE_PROJECT_ID,
      });
    } catch (error) {
      console.error("Failed to initialize TTS service:", error);
    }
  }

  async generateSpeech(
    text: string,
    options: {
      voice?: string;
      languageCode?: string;
      gender?: "MALE" | "FEMALE" | "NEUTRAL";
      speakingRate?: number;
      pitch?: number;
    } = {}
  ): Promise<string> {
    try {
      const {
        voice = "en-IN-Standard-A",
        languageCode = "en-IN",
        gender = "NEUTRAL",
        speakingRate = 1.0,
        pitch = 0.0,
      } = options;

      const request = {
        input: { text },
        voice: {
          languageCode,
          name: voice,
          ssmlGender: gender,
        },
        audioConfig: {
          audioEncoding: "MP3" as const,
          speakingRate,
          pitch,
          volumeGainDb: 0.0,
          sampleRateHertz: 24000,
        },
      };

      const [response] = await this.client.synthesizeSpeech(request);

      // Save audio file
      const outputPath = path.join(process.cwd(), "temp", `tts_${Date.now()}.mp3`);
      
      // Ensure temp directory exists
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      if (response.audioContent) {
        await fs.writeFile(outputPath, response.audioContent);
        return outputPath;
      } else {
        throw new Error("No audio content received from TTS service");
      }
    } catch (error) {
      console.error("Error generating speech:", error);
      throw new Error(`TTS generation failed: ${error.message}`);
    }
  }

  async generateSpeechForScript(script: string): Promise<string> {
    // Clean script for better TTS
    const cleanedScript = this.cleanScriptForTTS(script);
    
    return this.generateSpeech(cleanedScript, {
      voice: "en-IN-Standard-D", // Male Indian voice
      languageCode: "en-IN",
      speakingRate: 0.9, // Slightly slower for clarity
      pitch: -2.0, // Slightly lower pitch for news reading
    });
  }

  async generateMultipleVoices(scripts: string[]): Promise<string[]> {
    const voices = [
      "en-IN-Standard-A",
      "en-IN-Standard-B",
      "en-IN-Standard-C",
      "en-IN-Standard-D",
    ];

    const results: string[] = [];

    for (let i = 0; i < scripts.length; i++) {
      const voice = voices[i % voices.length];
      const audioPath = await this.generateSpeech(scripts[i], {
        voice,
        languageCode: "en-IN",
      });
      results.push(audioPath);
    }

    return results;
  }

  async checkHealth(): Promise<boolean> {
    try {
      // Test with a simple phrase
      const testText = "Health check test";
      const audioPath = await this.generateSpeech(testText);
      
      // Check if file was created and has content
      const stats = await fs.stat(audioPath);
      
      // Clean up test file
      await fs.unlink(audioPath).catch(() => {});
      
      return stats.size > 0;
    } catch {
      return false;
    }
  }

  getAvailableVoices(): Array<{
    name: string;
    languageCode: string;
    gender: string;
    description: string;
  }> {
    return [
      {
        name: "en-IN-Standard-A",
        languageCode: "en-IN",
        gender: "FEMALE",
        description: "Indian English Female Voice",
      },
      {
        name: "en-IN-Standard-B",
        languageCode: "en-IN",
        gender: "MALE",
        description: "Indian English Male Voice",
      },
      {
        name: "en-IN-Standard-C",
        languageCode: "en-IN",
        gender: "MALE",
        description: "Indian English Male Voice (Alternative)",
      },
      {
        name: "en-IN-Standard-D",
        languageCode: "en-IN",
        gender: "FEMALE",
        description: "Indian English Female Voice (Alternative)",
      },
      {
        name: "en-IN-Wavenet-A",
        languageCode: "en-IN",
        gender: "FEMALE",
        description: "Indian English Female Voice (High Quality)",
      },
      {
        name: "en-IN-Wavenet-B",
        languageCode: "en-IN",
        gender: "MALE",
        description: "Indian English Male Voice (High Quality)",
      },
    ];
  }

  private cleanScriptForTTS(script: string): string {
    return script
      // Remove markdown formatting
      .replace(/[*_`]/g, "")
      // Replace multiple spaces with single space
      .replace(/\s+/g, " ")
      // Add pauses for better speech flow
      .replace(/\. /g, ". <break time=\"500ms\"/> ")
      .replace(/! /g, "! <break time=\"500ms\"/> ")
      .replace(/\? /g, "? <break time=\"500ms\"/> ")
      // Replace common abbreviations for better pronunciation
      .replace(/\bAI\b/g, "Artificial Intelligence")
      .replace(/\bAPI\b/g, "Application Programming Interface")
      .replace(/\bCEO\b/g, "Chief Executive Officer")
      .replace(/\bCTO\b/g, "Chief Technology Officer")
      .replace(/\bVR\b/g, "Virtual Reality")
      .replace(/\bAR\b/g, "Augmented Reality")
      .replace(/\bIOT\b/g, "Internet of Things")
      .replace(/\bNASA\b/g, "National Aeronautics and Space Administration")
      .trim();
  }
}
