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
  locationType: "inside_dhaka" | "outside_dhaka"; // 🆕
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
- 'locationType': Determine if the delivery address falls inside our "Greater Dhaka" delivery zone (which we treat as inside_dhaka, matching Pathao's ISD + Suburbs zones combined) or fully outside it (OSD).
  - Set to "inside_dhaka" if the address contains "Dhaka", "ঢাকা", any area within Dhaka city (like Gulshan, Mirpur, Dhanmondi, Uttara, etc.), OR falls within any of these 4 official Pathao "Suburb" districts and their upazilas/thanas/localities (treat all of these as inside_dhaka too):
    - Gazipur district: Gazipur, গাজীপুর, Joydebpur, জয়দেবপুর, Tongi, টঙ্গী, Mawna, মাওনা, Sreepur, শ্রীপুর, Kaliakair, কালিয়াকৈর, Kaliganj, কালীগঞ্জ, Kapasia, কাপাসিয়া, Board Bazar, বোর্ড বাজার
    - Narayanganj district: Narayanganj, নারায়ণগঞ্জ, Fatullah, ফতুল্লা, Siddhirganj, সিদ্ধিরগঞ্জ, Bandar, বন্দর, Sonargaon, সোনারগাঁও, Araihazar, আড়াইহাজার, Rupganj, রূপগঞ্জ, Tarabo, তারাবো
    - Savar area: Savar, সাভার, Ashulia, আশুলিয়া
    - Keraniganj: Keraniganj, কেরানীগঞ্জ (North and South)
  - For ANY other district/area (e.g. Manikganj, Tangail, Chittagong, Sirajganj, Rangpur, Barisal, etc.), set to "outside_dhaka".
  - If address is not clear, default to "outside_dhaka".

Return ONLY a valid JSON object with these exact keys: accountName, recipientName, recipientPhone, recipientPhone2, recipientAddress, gender, hasBaby, preferredToy, locationType.
Do not include any extra text.

Examples:
1. Single name: "Alomgir 01323874187 ব্যাংকার্স কমপ্লেক্স ২, ঢাকা"
   → {"accountName":"Alomgir","recipientName":"Alomgir", ..., "locationType":"inside_dhaka"}
2. Two names: "Mrs. Ananna Alomgir 01323874187 ... outside Dhaka"
   → {"accountName":"Mrs. Ananna","recipientName":"Alomgir", ..., "locationType":"outside_dhaka"}
3. Bengali address: "শিব্বির আহমেদ রিজুয়ান 01634857120 ... সিরাজগঞ্জ"
   → {"accountName":"শিব্বির আহমেদ","recipientName":"রিজুয়ান", ..., "locationType":"outside_dhaka"}
4. Greater Dhaka district: "Chakpara, Sreepur, Mawna, Gazipur"
   → {"accountName":"","recipientName":"", ..., "recipientAddress":"Chakpara, Sreepur, Mawna, Gazipur", "locationType":"inside_dhaka"}

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
      locationType: parsed.locationType || "outside_dhaka",
    };
  } catch (error: any) {
    console.error("Groq API error:", error.response?.data || error.message);
    throw new Error("Failed to parse customer text with Groq");
  }
};
