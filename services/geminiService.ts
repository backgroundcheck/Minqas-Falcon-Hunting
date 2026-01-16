
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Language, PredictionPoint, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeBirdMigration = async (speciesName: string, currentData: any, lang: Language, userPrompt?: string) => {
  const prompt = `Analyze migration patterns for ${speciesName} in Pakistan (Sindh/Balochistan). 
  Data: ${JSON.stringify(currentData)}. 
  ${userPrompt ? `The user has a specific request/question: "${userPrompt}"` : ""}
  Please conduct a detailed environmental risk assessment for the bird's current location and migration path. 
  Analyze regional environmental data including pollution levels (air and water), habitat changes, industrial encroachment, and local climate anomalies.
  Provide an overall environmentalRiskScore from 0 to 100 and a list of specific riskFactors with severity ratings (1-10).
  Respond in ${lang === 'ar' ? 'Arabic' : 'English'}.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          behaviorSummary: { type: Type.STRING },
          climateImpact: { type: Type.STRING },
          environmentalRisk: { 
            type: Type.STRING,
            description: "Descriptive assessment of regional environmental risks."
          },
          environmentalRiskScore: {
            type: Type.NUMBER,
            description: "Overall risk percentage (0-100)."
          },
          riskFactors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                factor: { type: Type.STRING },
                severity: { type: Type.NUMBER }
              },
              required: ["factor", "severity"]
            }
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["behaviorSummary", "climateImpact", "environmentalRisk", "environmentalRiskScore", "riskFactors", "recommendations"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const predictFuturePath = async (speciesName: string, currentPath: any[], lang: Language): Promise<PredictionPoint[]> => {
  const prompt = `Predict 1-hour flight path for ${speciesName} in Pakistan. Data: ${JSON.stringify(currentPath)}. Output JSON array.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER },
            altitude: { type: Type.NUMBER },
            timestamp: { type: Type.STRING }
          },
          required: ["lat", "lng", "altitude", "timestamp"]
        }
      }
    }
  });

  return JSON.parse(response.text);
};

/**
 * Tactical Chat with Search and Maps Grounding
 * Refined to prevent "rude" refusals and align with the Miqnas persona.
 */
export const chatWithAssistant = async (message: string, lang: Language, history: ChatMessage[]) => {
  const isMapQuery = /location|map|where|near|place|coordinates|nesting/i.test(message);
  const model = isMapQuery ? "gemini-2.5-flash" : "gemini-3-pro-preview";
  
  const systemInstruction = `You are the Miqnas AI Tactical Interface, a specialized assistant for the Siberia-Indus Migratory Bird Tracking Database.
  Your tone is highly professional, technical, and helpful. You are an expert in avian biometrics, Siberian-Indus flyways, and regional geography of Pakistan (Sindh/Balochistan).
  
  Persona Guidelines:
  1. Acknowledge the traditional and cultural context of "Miqnas" (falconry) with respect. 
  2. If a user asks for hunting locations, provide information about migratory corridors, historical spotting zones, and ecological habitats. 
  3. Avoid generic moralizing refusals. If you cannot provide a specific piece of information for conservation or technical reasons, explain it as a system limitation or a conservation priority (e.g., "Our real-time tracking focuses on migratory path safety and ecological data rather than specific capture points").
  4. Use technical terminology (telemetry, flyway, thermal efficiency, FL/Flight Level).
  5. Respond in ${lang === 'ar' ? 'Arabic' : 'English'}.
  
  Context: You are currently assisting an operator tracking high-altitude birds like the Siberian Crane and Saker Falcon.`;

  const config: any = {
    systemInstruction,
    tools: isMapQuery ? [{ googleMaps: {} }] : [{ googleSearch: {} }]
  };

  if (isMapQuery && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          }
        }
      };
    } catch (e) {
      console.warn("Geolocation denied", e);
    }
  }

  const response = await ai.models.generateContent({
    model: model,
    contents: [
      { role: 'user', parts: [{ text: message }] }
    ],
    config
  });

  const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => {
    if (chunk.web) return { title: chunk.web.title, uri: chunk.web.uri };
    if (chunk.maps) return { title: chunk.maps.title, uri: chunk.maps.uri };
    return null;
  }).filter(Boolean) || [];

  return {
    text: response.text || "I'm processing that information...",
    sources
  };
};

export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export function encodeBase64(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
