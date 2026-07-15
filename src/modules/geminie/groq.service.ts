// src/services/gemini/groq.service.ts
import axios from "axios";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export interface GroqParsedData {
  accountName: string;
  recipientName: string;
  recipientPhone: string;
  recipientPhone2: string;
  recipientAddress: string;
  gender: "male" | "female" | "other" | "";
  hasBaby: boolean;
  preferredToy: string;
}

export const parseWithGroq = async (text: string): Promise<GroqParsedData> => {
  const prompt = `
You are a data extraction assistant. Extract the following fields from the customer message.

Rules:
- 'accountName': The name of the account holder (the person who owns the account or made the order).
  - Look for full names (with titles like Mr., Mrs., Md., মোঃ, or Bengali names).
  - If there are two distinct full names in the text, the first one (or the one with a title) is the accountName.
  - If there is only one distinct full name, use it for both accountName and recipientName.
- 'recipientName': The name of the person who will receive the parcel.
  - If two names exist, this is the second name (usually the one associated with the delivery address).
  - If only one name, set this to the same as accountName.
- 'gender': Detect from the accountName (if present), otherwise from recipientName. Use common patterns: names ending with 'a', 'bibi', 'begum' are female; 'md', 'mohammad' are male; if unsure, return 'other'.
- 'recipientPhone': Primary phone (11 digits starting with 01). Clean to digits only.
- 'recipientPhone2': Secondary phone (if present). Clean to digits.
- 'recipientAddress': Full delivery address (after name and phone numbers).
- 'hasBaby': true if text mentions baby/child/kids/toddler.
- 'preferredToy': extract phrase if mentioned, else empty.

Return ONLY a valid JSON object with these exact keys: accountName, recipientName, recipientPhone, recipientPhone2, recipientAddress, gender, hasBaby, preferredToy.
Do not include any extra text.

Examples:
1. Single name: "Alomgir 01323874187 ব্যাংকার্স কমপ্লেক্স ২..."
   → {"accountName":"Alomgir","recipientName":"Alomgir", ...}
2. Two names: "Mrs. Ananna Alomgir 01323874187 ..."
   → {"accountName":"Mrs. Ananna","recipientName":"Alomgir", ...}
3. Bengali two names: "শিব্বির আহমেদ রিজুয়ান 01634857120 ..."
   → {"accountName":"শিব্বির আহমেদ","recipientName":"রিজুয়ান", ...}

Now extract from:
${text}
`;

  try {
    const response = await axios.post(
      GROQ_URL,
      {
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    const content = response.data.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content);
    return {
      accountName: parsed.accountName || "",
      recipientName: parsed.recipientName || "",
      recipientPhone: parsed.recipientPhone || "",
      recipientPhone2: parsed.recipientPhone2 || "",
      recipientAddress: parsed.recipientAddress || "",
      gender: parsed.gender || "",
      hasBaby: parsed.hasBaby || false,
      preferredToy: parsed.preferredToy || "",
    };
  } catch (error: any) {
    console.error("Groq API error:", error.response?.data || error.message);
    throw new Error("Failed to parse customer text with Groq");
  }
};
