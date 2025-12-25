
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
    Analyze this clothing item from the image for an app called "DESI DRIP". 
    Target Audience: Gen Z South Asians.
    
    User Profile: 
    - Body Structure: ${user.bodyType}
    - Style Aesthetic: ${user.styleVibe}
    
    REALISM & SEASONAL LOGIC:
    1. Detect the probable weather/environment in the photo. 
    2. If it's a summer vibe, DO NOT suggest heavy layers. Suggest single-layer fits (e.g., breathable oversized tees, linen shirts).
    3. Avoid "t-shirt over t-shirt" or nonsensical stacking unless it's a very specific intentional trend (like a long-sleeve base layer).
    4. Ensure garment lengths are proportional (no weirdly long hems that look like glitches).

    ${preferenceContext}

    Suggest:
    1. A list of 3-5 complementary colors that pop in a Desi context.
    2. A full outfit recommendation that respects the season and the user's ${user.bodyType} build.
    3. Include specific Desi elements (e.g., modern jewelry, traditional footwear patterns).
    4. Three specific styling tips focused on "the perfect fit" and silhouette.
    5. A short, punchy "vibe" description.
    
    Return the response strictly as a JSON object:
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
  editInstruction: string,
  styleVibe: string = 'Streetwear'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] } },
        { text: `Modify this image based on this fashion request: ${editInstruction}. 
          
          CRITICAL QUALITY RULES:
          1. REALISTIC LAYERING: Do not add redundant layers. If it is a summer look, provide a single clean T-shirt or shirt. 
          2. COLOR REFINEMENT: If a color change is requested (e.g., "Change jacket to Electric Blue"), ensure the color looks natural, reflecting actual fabric shadows and highlights.
          3. FIT ALIGNMENT: Ensure the outfit is perfectly aligned with the user's frame. No weird sagging or glitchy edges.
          4. ESTABLISHED VIBE: Maintain the ${styleVibe} aesthetic throughout the edit.
          5. NO NONSENSICAL STACKING: Do not put a t-shirt over another t-shirt unless requested. 
          6. PROPER PROPORTIONS: Ensure t-shirt hems are at a natural length. Do not make garments weirdly long or "mid-made."
          
          The final output must look like a professional, high-end fashion campaign photo.` }
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
