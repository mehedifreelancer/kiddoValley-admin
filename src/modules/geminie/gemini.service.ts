// src/services/gemini.service.ts
import axios from "axios";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

export interface GeminiParsedData {
  customerName: string;
  customerPhone: string;
  customerPhone2: string;
  customerAddress: string;
  gender: "male" | "female" | "other" | "";
  hasBaby: boolean;
  preferredToy: string;
}

export const parseWithGemini = async (
  text: string,
): Promise<GeminiParsedData> => {
  const prompt = `
You are a data extraction assistant. Extract the following fields from the customer message:
- customerName (string)
- customerPhone (string, only digits, 11 digits starting with 01)
- customerPhone2 (string, optional, 11 digits)
- customerAddress (string)
- gender (string, either "male", "female", or "other")
- hasBaby (boolean)
- preferredToy (string, optional)

Return ONLY a valid JSON object with these exact keys. Do not include any extra text, markdown, or explanation.

Input:
${text}
`;

  try {
    const response = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: prompt }] }],
    });

    const result = response.data.candidates[0]?.content?.parts[0]?.text || "";
    // Extract JSON from the response (remove markdown fences if present)
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Gemini response");
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      customerName: parsed.customerName || "",
      customerPhone: parsed.customerPhone || "",
      customerPhone2: parsed.customerPhone2 || "",
      customerAddress: parsed.customerAddress || "",
      gender: parsed.gender || "",
      hasBaby: parsed.hasBaby || false,
      preferredToy: parsed.preferredToy || "",
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to parse customer text with Gemini");
  }
};
