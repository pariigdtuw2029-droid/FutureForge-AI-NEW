const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

exports.generateRoadmap = async (req, res) => {
  try {
    const { skills, goal } = req.body;

    const prompt = `
You are an AI Career Mentor.

Current Skills:
${skills}

Career Goal:
${goal}

Create a 3-month learning roadmap.

For each month include:
- Topics to learn
- Mini projects to build
- Skills to practice

Return ONLY valid JSON.

Do not write any explanation.
Do not write any introduction.
Do not use markdown.
Do not wrap the JSON in markdown.

Return only a valid JSON object in this format:

{
  "Month 1": {
    "topics": [],
    "projects": [],
    "practice": []
  },
  "Month 2": {
    "topics": [],
    "projects": [],
    "practice": []
  },
  "Month 3": {
    "topics": [],
    "projects": [],
    "practice": []
  }
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    console.log(response.text);

    let text = response.text ||"";

// Remove ```json and ``` if Gemini returns them
text = text.replace(/```json/g, "").replace(/```/g, "").trim();

let roadmap;

try {
    roadmap = JSON.parse(text);
} catch {
    roadmap = {
        roadmap: text
    };
}

    res.status(200).json({
      success: true,
      roadmap,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};