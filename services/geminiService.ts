
import { GoogleGenAI } from "@google/genai";
import { RecommendationResponse, UserProfile, MonthlyPlan, WardrobeItem, TripDetails, TripPlan } from "../types";

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
    Analyze this clothing item. User: ${user.styleVibe} style, ${user.bodyType} body.
    ${preferenceContext}
    Provide high-fashion styling advice using Gen Z terminology.
    Return JSON structure matching: { complementaryColors: [], outfitSuggestion: { top, bottom, outerwear, shoes, accessories: [] }, stylingTips: [], vibeDescription: "" }
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

export const identifyClothingItem = async (imageBase64: string): Promise<Partial<WardrobeItem>> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `
    Identify the main clothing item in this image.
    Categorize it strictly as one of: 'Top', 'Bottom', 'Outerwear', 'Shoes', 'Accessory', 'One-Piece'.
    Generate 3-4 short, trendy tags describing it (e.g., "Y2K", "Oversized", "Leather").
    Return JSON: { "category": "string", "tags": ["string"] }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{
      parts: [
        { text: prompt },
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } }
      ]
    }],
    config: { responseMimeType: 'application/json' }
  });

  return JSON.parse(response.text || '{}');
};

export const generateTripPlan = async (trip: TripDetails, user: UserProfile): Promise<TripPlan> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `
    Generate a Travel Packing Guide.
    Destination: ${trip.destination}
    Dates: ${trip.startDate} to ${trip.endDate}
    Purpose: ${trip.purpose}
    Vehicle: ${trip.vehicle}
    User Style: ${user.styleVibe}

    1. Estimate weather for this location/time.
    2. Suggest specific packing items based on vehicle constraints (e.g., Bike = minimal, Car = bulky ok).
    3. Include 2-3 essential shopping items to buy before.

    Return JSON:
    {
      "weatherSummary": "Short forecast summary",
      "outfitStrategy": "1-sentence styling strategy",
      "packingList": [
        { "item": "item name", "category": "Clothes" | "Toiletries" | "Tech" | "Documents", "isPacked": false, "reason": "why needed" }
      ],
      "shoppingList": ["item 1", "item 2"]
    }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{ parts: [{ text: prompt }] }],
    config: { responseMimeType: 'application/json' }
  });

  return JSON.parse(response.text || '{}') as TripPlan;
};

export const getMonthlyStylePlan = async (user: UserProfile, closet: WardrobeItem[], occasions?: { day: number, type: string }[]): Promise<MonthlyPlan> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const nextMonthDate = new Date();
  nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
  const monthName = nextMonthDate.toLocaleString('default', { month: 'long' });
  const year = nextMonthDate.getFullYear();

  const closetContext = closet.length > 0 
    ? `User wardrobe IDs: ${closet.map(i => i.id).join(', ')}. Assign these IDs to days where they fit.` 
    : "";

  const occasionContext = occasions && occasions.length > 0
    ? `Events: ${occasions.map(o => `Day ${o.day}: ${o.type}`).join(', ')}.`
    : "";

  const prompt = `
    Generate a 30-day "Drip Calendar" for ${monthName} ${year}.
    User: ${user.styleVibe}.
    ${closetContext}
    ${occasionContext}
    
    Rules:
    - Varied outfits.
    - Green/Red flags for style.
    
    Return JSON:
    {
      "month": "${monthName}",
      "year": ${year},
      "plans": [
        { 
          "day": 1, 
          "vibe": "short vibe", 
          "outfit": "desc", 
          "wardrobeItemId": "id_or_null",
          "doWear": "tip",
          "dontWear": "warning",
          "colorPalette": ["#hex", "#hex", "#hex"],
          "isOccasion": boolean,
          "occasionType": "string"
        }
        ... 30 days
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
        { text: `Modify image: ${editInstruction}. Aesthetic: ${styleVibe}. High fashion.` }
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
