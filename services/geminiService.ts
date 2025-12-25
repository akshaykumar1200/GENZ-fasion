
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { RecommendationResponse, UserProfile } from "../types";

const API_KEY = process.env.API_KEY || '';

export const getFashionAdvice = async (
  imageBase64: string, 
  user: UserProfile,
  userPreference?: string
): Promise<RecommendationResponse> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const preferenceContext = userPreference 
    ? `The user has a specific request: "${userPreference}". Prioritize this request while styling.`
    : "The user wants a general styling recommendation for this piece.";

  const prompt = `
    Analyze this clothing item from the image. 
    User Profile: Body Type: ${user.bodyType}, Style Vibe: ${user.styleVibe}.
    
    ${preferenceContext}

    Following current Gen Z fashion trends, suggest:
    1. A list of 3-5 complementary colors (if the user asked for a specific item, suggest colors for THAT item).
    2. A full outfit recommendation. If the user asked for a specific item (like a jacket), provide specific details on that item (e.g., "Baggy distressed denim jacket in vintage blue").
    3. Three specific Gen Z styling tips for this look.
    4. A short "vibe" description.
    
    Return the response strictly as a JSON object matching this structure:
    {
      "complementaryColors": ["hex or color name"],
      "outfitSuggestion": {
        "top": "string",
        "bottom": "string",
        "outerwear": "string",
        "shoes": "string",
        "accessories": ["string"]
      },
      "stylingTips": ["string"],
      "vibeDescription": "string"
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [
      {
        parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } }
        ]
      }
    ],
    config: {
      responseMimeType: 'application/json'
    }
  });

  return JSON.parse(response.text || '{}') as RecommendationResponse;
};

export const applyStyleToImage = async (
  imageBase64: string,
  editInstruction: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } },
        { text: `Modify this image based on this fashion request: ${editInstruction}. If the user asks for a jacket, add the jacket over the existing clothes. If they ask for a change in fit (like baggy), modify the existing item to look baggy. Maintain high quality, realistic textures, and the same person/environment.` }
      ]
    }
  });

  let resultImageUrl = '';
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      resultImageUrl = `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  return resultImageUrl;
};
