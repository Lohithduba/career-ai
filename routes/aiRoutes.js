const express = require('express');
const router = express.Router();
const { 
    analyzeResume, 
    startInterview, 
    evaluateInterview, 
    chatWithAI,  
    compareResumes, 
    getIndustryTrends,
    generateAIQuiz, 
    generateRoadmap
} = require('../controllers/aiController');

router.post('/analyze-resume', analyzeResume);
router.post('/start-interview', startInterview);
router.post('/evaluate-interview', evaluateInterview);
router.post('/chat', chatWithAI);
router.post('/compare-resumes', compareResumes);
router.post('/industry-trends', getIndustryTrends);
router.post('/generate-quiz', generateAIQuiz);
router.post('/generate-roadmap', generateRoadmap);

module.exports = router;