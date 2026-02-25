// Netlify 환경에서 가장 안정적인 서버리스 함수 구조입니다.
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { gender, image } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "환경변수(API Key)를 찾을 수 없습니다." }) 
      };
    }

    const payload = {
      contents: [{
        parts: [
          { text: `당신은 AI 관상가입니다. ${gender === 'female' ? '여성' : '남성'} 사용자의 사진을 분석하여 JSON으로 답변하세요. 필드: overallScore(숫자), facialFeatures(문자열), impression(문자열), advice(문자열). 반드시 한국어로 답변하세요.` },
          { inlineData: { mimeType: "image/png", data: image } }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return { 
        statusCode: response.status, 
        body: JSON.stringify({ error: "Gemini API Error", details: data }) 
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: data.candidates[0].content.parts[0].text
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server Error", message: error.message })
    };
  }
};
