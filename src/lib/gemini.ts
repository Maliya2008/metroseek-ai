import { GoogleGenAI } from "@google/genai";

// Initialize Gemini with the environment variable
// Support both process.env (AI Studio/Node) and import.meta.env (Static Vite)
const GEMINI_API_KEY = (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : null) || 
                      (import.meta.env?.VITE_GEMINI_API_KEY) || 
                      "";

const genAI = new GoogleGenAI({ 
  apiKey: GEMINI_API_KEY
});

export const geminiModels = {
  general: "gemini-3-flash-preview",
  imageGen: "gemini-2.5-flash-image",
  pro: "gemini-3.1-pro-preview",
  chat: "gemini-3-flash-preview"
};

export async function generateImage(prompt: string) {
  try {
    const response = await genAI.models.generateContent({
      model: geminiModels.imageGen,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        imageConfig: {
          aspectRatio: "1:1"
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
