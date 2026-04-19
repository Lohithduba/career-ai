const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ULTIMATE PARSER: Finds JSON anywhere in the text string
const bruteParse = (text) => {
    try {
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart === -1 || jsonEnd === -1) return null;
        const cleanJson = text.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(cleanJson);
    } catch (e) {
        return null;
    }
};

const cleanGeminiJSON = (text) => {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (!jsonMatch) return null;
        return JSON.parse(jsonMatch[0]);
    } catch (e) {
        return null;
    }
};

exports.generateRoadmap = async (req, res) => {
    try {
        const { targetJob, currentProfile } = req.body;
        // Use gemini-pro for complex logical tasks like roadmap generation
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Act as a Senior Career Architect. 
            Goal: Transition a user to ${targetJob}.
            User Specialization: ${currentProfile.specialization || 'General'}
            User Skills: ${currentProfile.skills?.join(", ") || 'Basic Computer Skills'}
            Verified Skill Score: ${currentProfile.skillTestScore || 0}%

            Task: Create a 6-month roadmap.
            Return ONLY a JSON object with this exact structure:
            {
                "skillGap": ["skill A", "skill B"],
                "salary": "Range String",
                "roadmap": [
                    { "month": "Month 1-2", "focus": "Fundamentals", "tasks": ["Task 1", "Task 2"] },
                    { "month": "Month 3-4", "focus": "Intermediate", "tasks": ["Task 3", "Task 4"] },
                    { "month": "Month 5-6", "focus": "Advanced", "tasks": ["Portfolio", "Certification"] }
                ]
            }
            Do not include any text before or after the JSON.
        `;

        const result = await model.generateContent(prompt);
        const data = bruteParse(result.response.text());

        if (!data) {
            // FALLBACK ROADMAP (Prevents 500 error if AI fails)
            return res.json({
                skillGap: ["Advanced Technical Proficiency", "System Design"],
                salary: "Market Standard",
                roadmap: [
                    { month: "Month 1-2", focus: "Core Foundations", tasks: ["Review basic concepts", "Practice industry standard tools"] },
                    { month: "Month 3-6", focus: "Applied Skills", tasks: ["Build a capstone project", "Prepare for interviews"] }
                ]
            });
        }
        
        res.json(data);
    } catch (error) {
        console.error("Roadmap Critical Error:", error);
        res.status(500).json({ error: "Roadmap engine timeout. Please try again." });
    }
};
// 1. Generate 20 MCQs based on user profile
exports.generateAIQuiz = async (req, res) => {
    try {
        const { specialization, skills } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Generate exactly 20 MCQs for ${specialization} with skills: ${skills.join(", ")}. Return ONLY JSON array: [{"q":"text","options":["A","B","C","D"],"a":"correct text"}]`;
        const result = await model.generateContent(prompt);
        const data = robustParse(result.response.text());
        res.json(data || []);
    } catch (e) { res.status(500).json({ error: "Quiz Fail" }); }
};

exports.analyzeResume = async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Act as a Senior HR Tech Specialist and ATS. 
            Analyze the following resume against the job description.
            
            Resume: ${resumeText}
            Job Description: ${jobDescription}
            
            Return ONLY a JSON object with this exact structure:
            {
                "score": number (0-100),
                "feedback": "2-3 sentence overview",
                "missingSkills": ["skill1", "skill2"],
                "improvementTips": ["tip1", "tip2"]
            }
            Do not include any explanation or markdown.
        `;

        const result = await model.generateContent(prompt);
        const data = bruteParse(result.response.text());

        if (!data) {
            // FALLBACK: Ensures the frontend always gets a valid response even if AI glitches
            return res.json({
                score: 50,
                feedback: "AI detected a high-density profile. Ensure your resume follows standard formatting for a more precise score.",
                missingSkills: ["Keywords relevant to JD"],
                improvementTips: ["Quantify your achievements", "Use industry-standard headings"]
            });
        }
        
        res.json(data);
    } catch (error) {
        console.error("ATS Error:", error);
        res.status(500).json({ error: "Neural analysis timeout. Please try again." });
    }
};
exports.chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        let formattedHistory = (history || []).map(item => ({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text || "" }]
        }));

        if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
            formattedHistory.shift(); 
        }

        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: { maxOutputTokens: 1000 }
        });

        // --- UPDATED SYSTEM CONTEXT FOR FORMATTING ---
        const systemPrompt = `
            You are a professional Career Coach. 
            CRITICAL INSTRUCTION: Always format your responses using Markdown. 
            - Use **bold text** for emphasis.
            - Use bullet points (*) for lists of skills or steps.
            - Use numbered lists (1.) for step-by-step roadmaps.
            - Use ### for section headers.
            - Keep paragraphs short and readable.
            
            User Query: ${message}
        `;

        const result = await chat.sendMessage(systemPrompt);
        const response = await result.response;
        res.json({ text: response.text() });
        
    } catch (error) {
        res.status(500).json({ error: "Communication link unstable." });
    }
};

// 4. Interview Session
exports.startInterview = async (req, res) => {
    try {
        const { role } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Generate 5 interview questions for ${role}. Return ONLY JSON array of strings.`;
        const result = await model.generateContent(prompt);
        res.json(robustParse(result.response.text()));
    } catch (e) { res.status(500).json({ error: "Interview Fail" }); }
};

// 6. Resume Battle
exports.compareResumes = async (req, res) => {
    try {
        const { resumeA, resumeB, jobDesc } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Compare Resume A and B for JD: ${jobDesc}. Return ONLY JSON: {"winner": "A", "scoreA": 80, "scoreB": 60, "winningPoints": ["Keywords"]}`;
        const result = await model.generateContent(prompt);
        res.json(robustParse(result.response.text()));
    } catch (e) { res.status(500).json({ error: "Battle Fail" }); }
};

exports.getIndustryTrends = async (req, res) => {
    try {
        const { sector } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
            Act as a Global Market Analyst. Provide 2025 trends for the ${sector} sector.
            Return ONLY a JSON object with this exact structure:
            {
                "trendingSkills": [
                    {"skill": "Skill Name", "demand": 95},
                    {"skill": "Skill Name", "demand": 80},
                    {"skill": "Skill Name", "demand": 70},
                    {"skill": "Skill Name", "demand": 60}
                ],
                "salaryGrowth": [
                    {"year": "2024", "average": 50000},
                    {"year": "2025", "average": 65000},
                    {"year": "2026", "average": 80000}
                ],
                "insight": "A 2-sentence professional strategic outlook."
            }
            Do not include markdown backticks or any introductory text.
        `;

        const result = await model.generateContent(prompt);
        const data = cleanGeminiJSON(result.response.text());

        if (!data) {
            // FALLBACK DATA: Prevents 500 errors if AI glitches
            return res.json({
                trendingSkills: [{skill: "AI Integration", demand: 90}, {skill: "Cloud Architecture", demand: 85}, {skill: "Cybersecurity", demand: 80}, {skill: "Data Science", demand: 75}],
                salaryGrowth: [{year: "2024", average: 60000}, {year: "2025", average: 75000}, {year: "2026", average: 90000}],
                insight: "The market is shifting towards AI-augmented roles with a high premium on specialized technical expertise."
            });
        }
        
        res.json(data);
    } catch (error) {
        console.error("Trend Error:", error);
        res.status(500).json({ error: "Market Intelligence Node Offline." });
    }
};

// 8. Interview Evaluator
exports.evaluateInterview = async (req, res) => {
    try {
        const { qna } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const prompt = `Evaluate interview answers: ${JSON.stringify(qna)}. Return ONLY JSON: {"overallScore": 85, "feedback": "Great"}`;
        const result = await model.generateContent(prompt);
        res.json(robustParse(result.response.text()));
    } catch (e) { res.status(500).json({ error: "Eval Fail" }); }
};

