
import { GoogleGenAI, Type } from "@google/genai";

// Always use the mandatory initialization with the API key from process.env.API_KEY
// DO NOT use || '' or any other fallback.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function analyzePanoramaOrder(images: string[]): Promise<number[]> {
  try {
    const parts = images.map((base64) => ({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64.split(',')[1] || base64
      }
    }));

    const response = await ai.models.generateContent({
      // Use gemini-3-pro-preview for advanced reasoning tasks like image ordering
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          ...parts,
          { text: "These images are tiles of a single panoramic scene. Analyze their visual content and determine the correct chronological order from LEFT to RIGHT. Return ONLY a JSON array of indices (0-indexed) corresponding to the input order. For example, [2, 0, 1] if the 3rd image is first, 1st image is second, etc." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.INTEGER }
        }
      }
    });

    // Use the .text property directly (not a method) as per guidelines.
    // Ensure the response is trimmed and available.
    const text = response.text || "[]";
    const result = JSON.parse(text.trim());
    return result;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Return default order if AI fails
    return images.map((_, i) => i);
  }
}
