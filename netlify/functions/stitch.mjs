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

    console.log("Calling Gemini 2.5 Flash Image API...");

    // Use Gemini 2.5 Flash Image for native image generation
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`;

    const requestBody = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: image1.mimeType,
                data: image1.base64,
              },
            },
            {
              inline_data: {
                mime_type: image2.mimeType,
                data: image2.base64,
              },
            },
            {
              text: `Combine and stitch these two images together following this instruction: ${prompt}. Create a seamless composition that blends both images naturally.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        response_modalities: ["IMAGE"],
      },
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return {
        statusCode: response.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: `Gemini API error: ${errorText}` }),
      };
    }

    console.log("Gemini API response received");
    const data = await response.json();

    // Extract image from response
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const parts = data.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inline_data && part.inline_data.data) {
          const mimeType = part.inline_data.mime_type || "image/png";
          const base64ImageBytes = part.inline_data.data;
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
