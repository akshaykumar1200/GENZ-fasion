
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { RecommendationResponse, UserProfile, MonthlyPlan, WardrobeItem } from "../types";

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
    Analyze this clothing item from the image for an app called "DESI DRIP". 
    Target Audience: Gen Z South Asians.
    
    User Profile: 
    - Body Structure: ${user.bodyType}
    - Style Aesthetic: ${user.styleVibe}
    
    REALISM & SEASONAL LOGIC:
    1. Detect the probable weather/environment in the photo. 
    2. If it's a summer vibe, DO NOT suggest heavy layers.
    3. Ensure garment lengths are proportional.

    ${preferenceContext}

    Suggest:
    1. A list of 3-5 complementary colors.
    2. A full outfit recommendation for a ${user.bodyType} build.
    3. Include specific Desi elements.
    4. Three styling tips.
    5. A short, punchy "vibe" description.
    
    Return JSON:
    {
      "complementaryColors": ["string"],
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
    config: { responseMimeType: 'application/json' }
  });

  return JSON.parse(response.text || '{}') as RecommendationResponse;
};

export const getMonthlyStylePlan = async (user: UserProfile, closet: WardrobeItem[], occasions?: { day: number, type: string }[]): Promise<MonthlyPlan> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const monthName = nextMonthDate.toLocaleString('default', { month: 'long' });
  const year = nextMonthDate.getFullYear();

  const closetContext = closet.length > 0 
    ? `The user has ${closet.length} items in their vault. Their item IDs are: ${closet.map(i => i.id).join(', ')}. 
       PLEASE ASSIGN ONE OF THESE IDs TO EACH DAY in the "wardrobeItemId" field where possible.` 
    : "The user has no items in their vault yet, suggest ideal items.";

  const occasionContext = occasions && occasions.length > 0
    ? `Special events: ${occasions.map(o => `Day ${o.day}: ${o.type}`).join(', ')}.`
    : "";

  const prompt = `
    Generate a 30-day "Personalized Drip Calendar" for ${monthName} ${year}.
    User: Gen Z South Asian, ${user.styleVibe} vibe, ${user.bodyType} body.
    
    ${closetContext}
    ${occasionContext}

    REPETITION RULES:
    - Only repeat a specific item ID maximum 3 times in the month.
    - Spread out repetitions at least 4 days apart.
    
    STYLE LOGIC:
    - Provide a "doWear" tip (Green Flag).
    - Provide a "dontWear" tip (Red Flag - what to avoid for this specific fit).
    - Provide a "colorPalette" (3 hex codes that work together for this fit).

    Return JSON:
    {
      "month": "${monthName}",
      "year": ${year},
      "plans": [
        { 
          "day": 1, 
          "vibe": "Cyber-Kurta", 
          "outfit": "Style description here", 
          "wardrobeItemId": "matching_id_from_provided_list_or_null",
          "doWear": "Style this with silver jewelry",
          "dontWear": "Avoid chunky sneakers with this look",
          "colorPalette": ["#hex", "#hex", "#hex"],
          "isOccasion": boolean,
          "occasionType": "string"
        },
        ... total 30 days
      ]
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: 'application/json' }
  });

  return JSON.parse(response.text || '{}') as MonthlyPlan;
};

export const applyStyleToImage = async (
  imageBase64: string,
  editInstruction: string,
  styleVibe: string = 'Streetwear'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } },
        { text: `Modify this image based on: ${editInstruction}. Maintain the ${styleVibe} aesthetic. The output must be a high-end fashion campaign photo.` }
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
