import { GoogleGenAI } from "@google/genai";

// Helper to get environment variables across different environments (Vite/Node)
const getEnv = (key: string) => {
  // 1. Try process.env (Node/AI Studio)
  if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
  
  // 2. Try Vite specific environment variables
  const viteKey = `VITE_${key}`;
  // @ts-ignore
  if (import.meta.env && import.meta.env[viteKey]) return import.meta.env[viteKey];
  
  return "";
};

const GEMINI_API_KEY = getEnv('GEMINI_API_KEY');
const IMAGE_KEY = getEnv('METROSEEK_IMAGE_KEY') || GEMINI_API_KEY;

// Primary client for general AI tasks
const genAI = new GoogleGenAI({ 
  apiKey: GEMINI_API_KEY
});

// Dedicated client for image generation (uses specialized key if provided)
const imageGenAI = new GoogleGenAI({
  apiKey: IMAGE_KEY
});

export const geminiModels = {
  general: "gemini-3-flash-preview",
  imageGen: "gemini-3.1-flash-image-preview",
  pro: "gemini-3.1-pro-preview",
  chat: "gemini-3-flash-preview"
};

export async function generateImage(prompt: string) {
  const activeKey = IMAGE_KEY || GEMINI_API_KEY;
  if (!activeKey) {
    throw new Error("Missing API Key. Please provide GEMINI_API_KEY or VITE_METROSEEK_IMAGE_KEY.");
  }

  const client = new GoogleGenAI({ apiKey: activeKey });

  try {
    const response = await client.models.generateContent({
      model: geminiModels.imageGen,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data generated");
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
}

export async function analyzeImage(imageBase64: string, mimeType: string, task: 'ocr' | 'face' | 'math') {
  const prompts = {
    ocr: "Extract all text from this image or document. Provide a clear transcription.",
    face: `Perform a highly detailed professional facial analysis on this photo. Provide the following metrics and insights:
1. Harmonious Rate (Overall facial harmony percentage)
2. Archetype (e.g., Warrior, Ruler, Sage, etc.)
3. Attractiveness Score (on a scale of 1-10)
4. Dominance Level (High/Medium/Low with explanation)
5. Masculinity/Femininity Index (Percentage and key traits)
6. PSL Rate (Potential, Sex appeal, Looks rating)
7. Detailed analysis of facial geometry, emotions, and overall attributes.
Structure the response clearly with headers.`,
    math: "Identify any math equations or geometry problems in this image. Solve them step-by-step and provide the final answer."
  };

  try {
    const response = await genAI.models.generateContent({
      model: geminiModels.general,
      contents: [
        {
          parts: [
            { inlineData: { data: imageBase64, mimeType } },
            { text: prompts[task] }
          ]
        }
      ]
    });

    return response.text;
  } catch (error) {
    console.error(`Gemini ${task} error:`, error);
    throw error;
  }
}

export async function getChatResponse(message: string, history: { role: 'user' | 'model', parts: { text: string }[] }[]) {
  try {
    const response = await genAI.models.generateContent({
      model: geminiModels.chat,
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: "You are MetroSeek AI, a helpful and knowledgeable digital assistant. You are friendly, concise, and professional. You are optimized for Sri Lankan users but can help anyone. Help with general questions, provide information, and maintain a pleasant conversational tone."
      }
    });

    return response.text;
  } catch (error) {
    console.error("Chat error:", error);
    throw error;
  }
}
