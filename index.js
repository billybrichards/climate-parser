// Import required packages
const express = require('express');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
app.use(express.json());

// Set up OpenAI client with API key
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Define the ClimateProjectParser class
class ClimateProjectParser {
  constructor() {
    this.client = client;
  }

  async extractProjectInfo(text) {
    const prompt = `
You are an expert parser specialized in extracting structured climate project information from natural language text. Extract and format the details into structured JSON with the following keys:

- title
- location
- area (include units, e.g., hectares)
- status
- methodology
- certifications (list)
- sdgs (list)
- start_date (year)
- annual_credit_potential (integer)
- buffer_allocation (percentage integer)
- saleable_credits (integer)
- environmental_asset_id

Example Output Format:
{
  "title": "",
  "location": "",
  "area": "",
  "status": "",
  "methodology": "",
  "certifications": [],
  "sdgs": [],
  "start_date": "",
  "annual_credit_potential": 0,
  "buffer_allocation": 0,
  "saleable_credits": 0,
  "environmental_asset_id": ""
}

Here is the text to extract from:
${text}

Provide JSON only.
`;

    const response = await this.client.chat.completions.create({
      model: "o3-mini-2025-01-31",
      messages: [{ role: "user", content: prompt }]
    });

    const jsonContent = response.choices[0].message.content.trim();
    return JSON.parse(jsonContent);
  }
}

// Create API endpoint for parsing
app.post('/api/parse', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: "Text field is required" });
    }
    
    const parser = new ClimateProjectParser();
    const projectInfo = await parser.extractProjectInfo(text);
    
    res.json(projectInfo);
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ error: error.message });
  }
});

// Example endpoint for testing
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Climate Project Parser API is running' });
});

// Handle root route
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Climate Project Parser</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          pre { background: #f4f4f4; padding: 15px; border-radius: 5px; }
          .code { font-family: monospace; }
        </style>
      </head>
      <body>
        <h1>Climate Project Parser API</h1>
        <p>Submit POST requests to <span class="code">/api/parse</span> with JSON body:</p>
        <pre>
{
  "text": "Blue Forest Mangrove Project spans 85,500 hectares in Indonesia..."
}
        </pre>
        <p>The API will return structured JSON with extracted climate project information.</p>
      </body>
    </html>
  `);
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless function
module.exports = app;