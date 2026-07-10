const ai = require("../services/gemini");

exports.generateProjects = async (req, res) => {
    try {
        const { skills, goal } = req.body;

       const prompt = `
You are a Project Architect AI.

The user has these skills:
${skills}

The career goal is:
${goal}

Suggest exactly 5 projects.

Return ONLY valid JSON in this format:

[
  {
    "title": "",
    "difficulty": "",
    "techStack": [],
    "learningOutcome": ""
  }
]

Do not include markdown.
Do not include explanations.
Return only JSON.
`;

        const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
});

const text = response.text;

// Convert Gemini's JSON string into a JavaScript object
const projects = JSON.parse(text);

res.status(200).json({
    success: true,
    projects: projects
});
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: error.message
        });
    }
};