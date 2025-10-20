
import { GoogleGenAI, Modality } from "@google/genai";

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // result is a data URL: "data:image/jpeg;base64,..."
        // We only want the base64 part
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });
};

export const stitchImages = async (image1: File, image2: File, prompt: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const image1Base64 = await fileToBase64(image1);
  const image2Base64 = await fileToBase64(image2);

  const image1Part = {
    inlineData: {
      data: image1Base64,
      mimeType: image1.type,
    },
  };
  
  const image2Part = {
    inlineData: {
      data: image2Base64,
      mimeType: image2.type,
    },
  };

  const textPart = {
    text: `Stitch these two images together. Image 1 is the primary context unless specified otherwise. Instruction: ${prompt}`,
  };

  try {
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
      if (part.inlineData) {
        const mimeType = part.inlineData.mimeType;
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${mimeType};base64,${base64ImageBytes}`;
      }
    }
    
    throw new Error("No image was generated. The model may have refused the request.");

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    throw new Error(`Failed to stitch images: ${errorMessage}`);
  }
};
