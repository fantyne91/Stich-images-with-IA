

export const handler = async (event) => {
  console.log("Raw event body:", event.body);
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

    // Ajusta este endpoint a la versión correcta de la API de Google GenAI que utilices
    const MODEL = "gemini-2.5-flash-image";
    const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta2/models/${MODEL}:generate`;

    const fetchBody = {
      // Estructura de ejemplo; adapta campos si tu endpoint requiere nombres distintos
      contents: {
        parts: [
          { inlineData: { data: image1.base64, mimeType: image1.mimeType } },
          { inlineData: { data: image2.base64, mimeType: image2.mimeType } },
          {
            text: `Stitch these two images together. Image 1 is the primary context. Instruction: ${prompt}`,
          },
        ],
      },
      // pide respuesta en modalidad imagen
      config: { responseModalities: ["IMAGE"] },
    };

    console.log("Calling Gemini REST endpoint...");
    const apiResp = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fetchBody),
    });

    if (!apiResp.ok) {
      const errText = await apiResp.text();
      console.error("API error response:", apiResp.status, errText);
      return {
        statusCode: apiResp.status,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: `Remote API error: ${errText}` }),
      };
    }

    const json = await apiResp.json();
    console.log("Gemini REST response:", JSON.stringify(json));

    // Buscar la parte con inlineData (ejemplo basado en la estructura que entrega la librería)
    for (const part of json.candidates?.[0]?.content?.parts || []) {
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
