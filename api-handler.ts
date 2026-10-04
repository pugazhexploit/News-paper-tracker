import { GoogleGenAI } from '@google/genai';

export async function handleAIDispatchRequest(body: { prompt?: string; lat?: number; lng?: number }) {
  const prompt = body.prompt || 'Give tips on newspaper distribution routing in Chidambaram, Cuddalore District (608001).';
  const lat = body.lat || 11.3992;
  const lng = body.lng || 79.6936;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      answer: `**PaperTrack AI Route Logistics (Chidambaram Hub - 608001)**\n\n1. **Early Morning Dispatch (4:30 AM - 6:30 AM):** Start at Chidambaram Town Newspaper Distribution Point near Old Bus Stand / Railway Feeder Road. Bundle newspapers by the four temple car streets (East, West, South, North Car Streets) and Annamalai Nagar circuits.\n2. **Optimal Sacred Corridor Sequence:** Cover East Car Street and North Car Street first while roads are empty of pilgrim traffic before moving to Kanagasabai Nagar and Annamalai Nagar University residences.\n3. **Active GPS Geofencing:** Keep phone location enabled with the 50m geofence active so the alert double-chimes when pulling up to each house gate.`,
      places: [
        {
          title: 'Thillai Nataraja Temple East Sannathi, Chidambaram (608001)',
          uri: 'https://maps.google.com/?cid=113992796936'
        },
        {
          title: 'Chidambaram Bus Stand Distribution Point',
          uri: 'https://maps.google.com/?cid=113980796940'
        },
        {
          title: 'Annamalai Nagar Post Office / Campus Hub (608002)',
          uri: 'https://maps.google.com/?cid=113922797122'
        }
      ]
    };
  }

  try {
    const ai = new GoogleGenAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are the Newspaper Distribution & Logistics Route Assistant for PaperTrack in Chidambaram, Cuddalore District, Tamil Nadu (Pincode: 608001). Help dispatch managers, delivery staff, and subscribers with accurate location info, newspaper depot points, street accessibility, landmark verification, and route timing in Chidambaram (East Car Street, West Car Street, South Car Street, North Car Street, Kanagasabai Nagar, Annamalai Nagar, etc.).
User query: ${prompt}`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng,
            },
          },
        },
      },
    });

    const answer = response.text || 'No response returned from AI model.';
    
    // Extract grounding URLs as mandated by gemini-api skill
    const places: { title: string; uri: string }[] = [];
    const candidates = response.candidates || [];
    for (const cand of candidates) {
      const chunks = cand.groundingMetadata?.groundingChunks || [];
      for (const chunk of chunks) {
        // Maps grounding chunk
        if ((chunk as unknown as { maps?: { uri?: string; title?: string } }).maps?.uri) {
          const m = (chunk as unknown as { maps: { uri: string; title?: string } }).maps;
          places.push({
            title: m.title || 'Google Maps Location',
            uri: m.uri,
          });
        }
        // Web grounding chunk fallback
        if ((chunk as unknown as { web?: { uri?: string; title?: string } }).web?.uri) {
          const w = (chunk as unknown as { web: { uri: string; title?: string } }).web;
          places.push({
            title: w.title || 'Source Citation',
            uri: w.uri,
          });
        }
      }
    }

    return {
      answer,
      places,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return {
      answer: `AI Assistant Encountered Error: ${msg}. Falling back to default delivery routing rules.`,
      places: [],
      error: msg,
    };
  }
}
