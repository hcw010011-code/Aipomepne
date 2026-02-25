exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };

  try {
    const { gender, image } = JSON.parse(event.body);
    const apiKey = process.env.GEMINI_API_KEY; // 여기서 Netlify 환경 변수를 읽습니다.

    const payload = {
      contents: [{
        parts: [
          { text: `당신은 AI 관상가입니다. ${gender === 'female' ? '여성' : '남성'} 사용자의 사진을 분석해 전문적인 관상을 봐주세요. 결과는 반드시 JSON 형식으로 overallScore (숫자), facialFeatures (분석 내용), advice (짧은 조언) 필드를 포함해야 합니다. 한국어로 답변하세요.` },
          { inlineData: { mimeType: "image/png", data: image } }
        ]
      }],
      generationConfig: { responseMimeType: "application/json" }
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
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: data.candidates[0].content.parts[0].text
    };

  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
