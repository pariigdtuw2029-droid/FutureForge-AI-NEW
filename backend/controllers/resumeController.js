const fs = require("fs");
const pdfParse = require("pdf-parse");
const History =require("../models/History");
const skills =require("../skills/skills.json");

exports.uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                message: "No resume uploaded"
            });
        }
// Read the uploaded PDF
        const dataBuffer = fs.readFileSync(req.file.path);
        // EXTRACT TEXT FROM THE PDF
        const pdfData = await pdfParse(dataBuffer);

        const resumeText = pdfData.text.toLowerCase();

        const foundSkills = skills.filter(skill =>
        resumeText.includes(skill.toLowerCase())
        );
        const jobDescription = (req.body.jobDescription||"").toLowerCase();
        const matchedSkills = foundSkills.filter(skill=>
            jobDescription.includes(skill.toLowerCase())
        );
        let atsScore=0;
        if(foundSkills.length>0&&
            jobDescription.length>0){
                atsScore=Math.round(
                    (matchedSkills.length/foundSkills.length)*100
            );
        }  
        
        await History.create({
    user: req.user.id,
    resumeName: req.file.originalname,
    skills: foundSkills,
    matchedSkills,
    atsScore,
    jobDescription,
});
        res.status(200).json({
    message: "Resume uploaded successfully",
    skills: foundSkills,
    matchedSkills:matchedSkills,
    ats_score:atsScore,
    text: pdfData.text
    });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};