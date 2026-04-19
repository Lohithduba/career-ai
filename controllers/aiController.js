const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * MASTER PARSER: Extracts JSON from Llama's response.
 * Even with JSON mode, Llama might occasionally add text.
 */
const robustParse = (text) => {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
        console.error("AI Parse Error:", text);
        return null;
    }
};

// THE MASTER CLEANER: Ensures we always return valid data to frontend
const extractJSON = (text) => {
    try {
        const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (!jsonMatch) return null;
        return JSON.parse(jsonMatch[0]);
    } catch (e) {
        console.error("JSON Extraction Error:", e);
        return null;
    }
};

// 1. Generate 20 technical questions (Llama 3.3 70B for high logic)
exports.generateAIQuiz = async (req, res) => {
    try {
        const { specialization, skills } = req.body;
        
        const prompt = `Act as a Senior Technical Interviewer. 
        Generate exactly 20 technical multiple-choice questions for ${specialization} focusing on ${skills.join(", ")}.
        
        Requirement: You MUST return a JSON object with a key "quiz".
        Format: {"quiz": [{"q": "Question text", "options": ["A", "B", "C", "D"], "a": "Correct answer text"}]}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile", // Use 70B for complex logic like 20 questions
            response_format: { type: "json_object" }
        });

        const rawData = extractJSON(completion.choices[0].message.content);
        
        // Convert Object {"quiz": [...]} to Array [...] for your frontend
        const questions = rawData?.quiz || rawData; 
        
        if (!questions || !Array.isArray(questions)) throw new Error("Format Mismatch");
        res.json(questions);
    } catch (error) {
        console.error("Quiz Error:", error);
        res.status(500).json({ error: "AI failed to generate quiz." });
    }
};

// 2. ATS Resume Matcher
exports.analyzeResume = async (req, res) => {
    try {
        const { resumeText, jobDescription } = req.body;
        const prompt = `Act as an ATS. Analyze Resume: ${resumeText} against JD: ${jobDescription}. 
        Return ONLY a JSON object: {"score": 85, "feedback": "Detailed msg", "missingSkills": ["skill1"], "improvementTips": ["tip1"]}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
        });

        res.json(robustParse(completion.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: "ATS Engine Error" });
    }
};

// 3. AI Chat Coach (Using a more logical Llama model for conversation)
exports.chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;
        
        // Map history to Groq format (assistant instead of model)
        const messages = (history || []).map(h => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: h.text
        }));

        messages.push({ role: "user", content: message });

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a professional Career Coach. Use Markdown (bold, bullet points, headers) for structured responses." },
                ...messages
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
        });

        res.json({ text: completion.choices[0].message.content });
    } catch (error) {
        res.status(500).json({ error: "Chat node offline." });
    }
};

// 4. Personalized Career Roadmap
exports.generateRoadmap = async (req, res) => {
    try {
        const { targetJob, currentProfile } = req.body;
        const prompt = `Act as a Career Architect. Transition user to ${targetJob}. 
        Current Profile: ${currentProfile.specialization}, Skills: ${currentProfile.skills.join(", ")}, Test Score: ${currentProfile.skillTestScore}%.
        Generate a 6-month roadmap. Return ONLY JSON: {"skillGap": [], "salary": "Range", "roadmap": [{"month": "Month 1", "focus": "Title", "tasks": ["Task A"]}]}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
        });

        res.json(robustParse(completion.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: "Roadmap failed." });
    }
};

exports.startInterview = async (req, res) => {
    try {
        const { role } = req.body;
        
        const prompt = `Generate 5 challenging interview questions for the role: ${role}.
        Requirement: You MUST return a JSON object with a key "questions".
        Format: {"questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" }
        });

        const rawData = extractJSON(completion.choices[0].message.content);
        
        // Convert Object {"questions": [...]} to Array [...] for your frontend
        const questionsArray = rawData?.questions || rawData;

        if (!questionsArray || !Array.isArray(questionsArray)) throw new Error("Format Mismatch");
        res.json(questionsArray);
    } catch (error) {
        console.error("Interview Error:", error);
        res.status(500).json({ error: "AI failed to start interview." });
    }
};

// 3. Interview Evaluator
exports.evaluateInterview = async (req, res) => {
    try {
        const { qna, role } = req.body;
        const prompt = `Evaluate these interview answers for a ${role} position: ${JSON.stringify(qna)}.
        Return a JSON object: {"overallScore": number, "feedback": "string"}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" }
        });

        res.json(extractJSON(completion.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: "Evaluation failed." });
    }
};

// 6. Resume Battle Mode
exports.compareResumes = async (req, res) => {
    try {
        const { resumeA, resumeB, jobDesc } = req.body;
        const prompt = `Compare Resume A and B for JD: ${jobDesc}. Return ONLY JSON: {"winner": "A", "scoreA": 80, "scoreB": 60, "winningPoints": ["Point 1"], "reasoning": "text"}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
        });

        res.json(robustParse(completion.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: "Battle mode failed." });
    }
};

// 7. Industry Trends
exports.getIndustryTrends = async (req, res) => {
    try {
        const { sector } = req.body;
        const prompt = `Provide 2025 market trends for ${sector}. Return ONLY JSON: {"trendingSkills": [{"skill": "Skill", "demand": 90}], "salaryGrowth": [{"year": "2025", "average": 70000}], "insight": "text"}`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama-3.1-8b-instant",
            response_format: { type: "json_object" },
        });

        res.json(robustParse(completion.choices[0].message.content));
    } catch (error) {
        res.status(500).json({ error: "Trends failed." });
    }
};
