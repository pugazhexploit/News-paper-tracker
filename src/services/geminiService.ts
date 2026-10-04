export interface GroundingPlaceLink {
  title: string;
  uri: string;
}

export interface DispatchAssistantResponse {
  answer: string;
  places: GroundingPlaceLink[];
  error?: string;
}

export async function askDispatchAssistant(
  prompt: string,
  userLat = 11.3992,
  userLng = 79.6936
): Promise<DispatchAssistantResponse> {
  try {
    const res = await fetch('/api/ai-dispatch-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        lat: userLat,
        lng: userLng,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with ${res.status}`);
    }

    return await res.json();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    return {
      answer: `Unable to consult AI Route Dispatch Assistant (${errorMsg}). Please verify network connection or server setup.`,
      places: [],
      error: errorMsg,
    };
  }
}
