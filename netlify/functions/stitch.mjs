import { GoogleGenAI, Modality } from "@google/genai";

export const handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }

  const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    console.error("API_KEY not found in environment variables");
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: "API_KEY environment variable is not set on the server.",
      }),
    };
  }

  try {
    const { image1, image2, prompt } = JSON.parse(event.body || "{}");

    if (!image1 || !image2 || !prompt) {
      return {
        statusCode: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          error: "Missing required parameters: image1, image2, prompt.",
        }),
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

    console.log("Calling Gemini API...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [image1Part, image2Part, textPart],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    console.log("Gemini API response received");
    console.log("Raw Gemini response:", JSON.stringify(response));


    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType;
        const base64ImageBytes = part.inlineData.data;
        const imageUrl = `data:${mimeType};base64,${base64ImageBytes}`;

        return {
          statusCode: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ imageUrl }),
        };
      }
    }

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error:
          "No image was generated. The model may have refused the request.",
      }),
    };
  } catch (error) {
    console.error("Error in Netlify function:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: `Failed to stitch images: ${errorMessage}`,
      }),
    };
  }
};
