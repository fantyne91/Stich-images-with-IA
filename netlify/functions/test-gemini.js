export const handler = async (event) => {
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

  const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    console.error("❌ API_KEY not found in environment variables");
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "API_KEY is missing" }),
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say hello Gemini" }] }],
        }),
      }
    );

    // 💡 En vez de parsear directamente a JSON, obtenemos texto crudo
    const rawText = await response.text();

    console.log("🔍 Raw Gemini response:", rawText.slice(0, 500));

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      data = { rawText }; // si no es JSON, lo devolvemos como texto
    }

    return {
      statusCode: response.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ok: response.ok,
        status: response.status,
        data,
      }),
    };
  } catch (err) {
    console.error("❌ Network or fetch error:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
