const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

exports.getRecommendation = async (req, res) => {
  try {
    const { skills, interests } = req.body;

    const prompt = `
You are an AI Career Advisor.

Student Skills:
${skills}

Student Interests:
${interests}

Recommend:
1. Best career roles
2. Best internship roles
3. 3 project ideas
4. Technologies to learn next

Keep the answer simple and beginner-friendly.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.status(200).json({
      recommendation: response.text,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};