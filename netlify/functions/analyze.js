// Netlify Functions: 브라우저 대신 서버에서 API를 호출하여 키 노출을 방지합니다.
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event, context) => {
  // POST 요청이 아니면 거절
  if (event.httpMethod !== "POST") {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: "Method Not Allowed" }) 
    };
  }

  try {
    const { gender, image } = JSON.parse(event.body);
    
    // Netlify 환경변수에 저장한 GEMINI_API_KEY를 가져옵니다.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return { 
        statusCode: 500, 
        body: JSON.stringify({ error: "환경변수에 API 키가 설정되지 않았습니다." }) 
      };
    }

    const genderText = gender === 'female' ? '여성' : '남성';
    const systemPrompt = `당신은 전문적인 AI 관상가입니다. 사용자는 ${genderText}입니다. 
    다음 항목을 포함하여 JSON 형식으로만 답변하세요:
    - overallScore: 숫자 (0-100)
    - facialFeatures: 문자열 (얼굴 특징 분석)
    - impression: 문자열 (인상 비평)
    - advice: 문자열 (스타일링 조언)
    모든 답변은 한국어로 작성하세요.`;

    const payload = {
      contents: [{
        parts: [
          { text: `${genderText} 사용자의 얼굴을 분석해줘.` },
          { inlineData: { mimeType: "image/png", data: image } }
        ]
      }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { 
        responseMimeType: "application/json" 
      }
    };

    // Gemini API 호출
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { statusCode: response.status, body: JSON.stringify(errorData) };
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: resultText
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "서버 오류: " + error.message })
    };
  }
};
