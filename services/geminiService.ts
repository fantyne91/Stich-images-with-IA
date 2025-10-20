import { UploadedImage } from './types';

// Helper function to convert a File object to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // remove the "data:image/jpeg;base64," part
        resolve(result.split(',')[1]); 
      };
      reader.onerror = (error) => reject(error);
    });
};

// The main export function now ONLY calls the secure Netlify function.
export const stitchImages = async (
  image1File: File,
  image2File: File,
  prompt: string,
): Promise<string> => {
  try {
    const image1Base64 = await fileToBase64(image1File);
    const image2Base64 = await fileToBase64(image2File);

    const response = await fetch('/.netlify/functions/stitch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image1: { base64: image1Base64, mimeType: image1File.type },
        image2: { base64: image2Base64, mimeType: image2File.type },
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    const result = await response.json();
    return result.imageUrl;
  } catch (error) {
      console.error("Netlify function call failed:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      // Provide a user-friendly error
      throw new Error(`The AI could not process the images. Please check the Netlify function logs. Details: ${errorMessage}`);
  }
};
