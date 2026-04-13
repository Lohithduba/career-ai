const axios = require('axios');

exports.getLiveJobs = async (req, res) => {
    try {
        const { query } = req.query;
        
        // Adzuna API Credentials (Get these from developer.adzuna.com)
        const ADZUNA_APP_ID = process.env.ADZUNA_APP_ID;
        const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY;

        if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
            return res.status(500).json({ error: "Job API credentials missing in .env" });
        }

        // We search in 'in' (India). Change to 'us' or 'gb' for other regions.
        const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_APP_KEY}&results_per_page=15&what=${query}&content-type=application/json`;

        const response = await axios.get(url);
        
        // Mapping Adzuna data to our Premium UI format
        const jobs = response.data.results.map(job => ({
            id: job.id,
            title: job.title.replace(/<\/?[^>]+(>|$)/g, ""), // Remove HTML tags from title
            company: job.company.display_name,
            location: job.location.display_name,
            description: job.description.replace(/<\/?[^>]+(>|$)/g, ""), // Remove HTML tags
            url: job.redirect_url, // The link to the official site
            date: job.created,
            salary: job.salary_min ? `₹${job.salary_min.toLocaleString()}` : "Market Standard"
        }));

        res.json(jobs);
    } catch (error) {
        console.error("Aggregation Error:", error.message);
        res.status(500).json({ error: "Marketplace currently unreachable." });
    }
};