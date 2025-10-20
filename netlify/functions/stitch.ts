import { GoogleGenAI, Modality } from "@google/genai";
import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API_KEY environment variable is not set on the server.' }),
    };
  }

  try {
    const { image1, image2, prompt } = JSON.parse(event.body || '{}');

    if (!image1 || !image2 || !prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameters: image1, image2, prompt.' }),
      };
    }
    
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const image1Part = {
      inlineData: {
        data: image1.base64,
        mimeType: image1.mimeType,
      },
    };
    
    const image2Part = {
      inlineData: {
        data: image2.base64,
        mimeType: image2.mimeType,
      },
    };

    const textPart = {
      text: `Stitch these two images together. Image 1 is the primary context unless specified otherwise. Instruction: ${prompt}`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [image1Part, image2Part, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType;
        const base64ImageBytes: string = part.inlineData.data;
        const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;
        
        return {
          statusCode: 200,
          body: JSON.stringify({ imageUrl }),
        };
      }
    }

    return {
        statusCode: 500,
        body: JSON.stringify({ error: "No image was generated. The model may have refused the request." }),
    };

  } catch (error) {
    console.error("Error in Netlify function:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Failed to stitch images: ${errorMessage}` }),
    };
  }
};
