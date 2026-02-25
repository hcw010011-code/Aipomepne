exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method Not Allowed" };
  try {
    const { gender, image } = JSON.parse(event.body);
    // 이 이름이 Netlify 대시보드의 Key와 완벽히 같아야 함
    const apiKey = process.env.GEMINI_API_KEY; 

    const payload = {
      contents: [{
        parts: [
          { text: `당신은 관상가입니다. ${gender === 'female' ? '여성' : '남성'} 사용자의 사진을 분석하여 JSON으로 답변하세요. 필드: overallScore(숫자), facialFeatures(문자열), impression(문자열), advice(문자열).` },
          { inlineData: { mimeType: "image/png", data: image } }
        ]
      }],
      generationConfig: { responseMimeType: "application/json" }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      { method: 'POST', body: JSON.stringify(payload) }
    );

    const data = await response.json();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: data.candidates[0].content.parts[0].text
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
