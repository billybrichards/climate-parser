// Import required packages
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Configure CORS with proper headers
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:8080',
  'http://localhost:8081',
  'https://changeblock.com',
  'https://feasibilityapp.vercel.app'
];

// Improved CORS configuration for Vercel domains
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Check if the origin is allowed
  if (
    !origin || 
    allowedOrigins.includes(origin) || 
    origin.endsWith('.vercel.app') || 
    origin.endsWith('.vercel.com')
  ) {
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Authorization, X-API-Key');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  }
  
  next();
});

// Parse JSON body with limits
app.use(express.json({ limit: '10mb' }));

// Set up OpenAI client with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test OpenAI connectivity on startup
async function testOpenAIConnection() {
  try {
    console.log('🔄 Testing OpenAI API connection...');
    const response = await openai.chat.completions.create({
      model: "o3-mini-2025-01-31",
      messages: [{ role: "user", content: "Respond with 'OK' if you can read this." }],
      max_completion_tokens: 10  // Updated parameter
    });
    
    if (response && response.choices && response.choices[0]) {
      console.log('✅ OpenAI API connection successful!');
      console.log(`📡 OpenAI Model: ${response.model}`);
      console.log(`🆔 Response ID: ${response.id}`);
    } else {
      console.log('⚠️ OpenAI API connected but returned unexpected response format.');
    }
    return true;
  } catch (error) {
    console.error('❌ OpenAI API connection failed:', error.message);
    if (error.response) {
      console.error(`🛑 Error status: ${error.response.status}`);
      console.error(`🛑 Error data:`, error.response.data);
    }
    return false;
  }
}

// Define the system prompt
const SYSTEM_PROMPT = `SYSTEM / DEVELOPER INSTRUCTIONS (HIGH PRIORITY)

You are "o3-mini: A Climate Project Data Parser" powered by GPT-4o, with significantly enhanced capabilities for logical deduction, reasoning, and real-time web search, including access to a vast carbon market database and available files. Your mission is to parse unstructured text describing a climate or carbon project and transform it into a highly detailed and accurate structured JSON object, adhering strictly to the TypeScript interface below. Leverage your advanced capabilities, database access, and particularly file analysis to maximize data accuracy and completeness, especially regarding price determination.

Interface Definition:
------------------------------------------------
\`\`\`typescript
interface ProjectData {
    title?: string;
    location?: string;
    area?: string;
    status?: string;
    feasibility_score?: number;
    difficulty_score?: number;
    risk_score?: number;
    methodology?: string;
    start_date?: string;
    environmental_asset_id?: string;
    annual_credit_potential?: number;
    buffer_allocation?: number;
    saleable_credits?: number;
    sdgs?: string[];
    certifications?: string[];
    analysis?: string;
    core_data?: Record<string, string>;
    potential_buyers?: Record<string, string>;
    price_potential?: Record<string, string>;
    commentary?: Record<string, string>;
}
\`\`\`

Enhanced Instructions:
	1.	Unwavering JSON Output:
	•	Produce only valid JSON. No extraneous text, Markdown, or explanations outside the JSON structure are permitted.
	•	Top-level property names must match the interface exactly.
	2.	Maximized Deductive Power:
	•	Employ the full extent of your logical deduction capabilities, informed by comprehensive web searches, the carbon market database, available files, and your extensive knowledge base, to infer missing or unclear data.
	•	Provide detailed justifications for all deductions within the “analysis” and “commentary” sections.
	•	When absolute certainty is unattainable, make the most probable assumption based on available data and clearly state the reasoning.
	3.	Comprehensive Web, Database, and File Integration:
	•	Utilize file search, web search, and the carbon market database to:
	•	Identify the top 3 most relevant methodologies, providing detailed comparisons.
	•	Prioritize file analysis to determine precise, up-to-date carbon credit pricing for comparable projects and project future prices.
	•	Identify potential buyers, market trends, and relevant regulatory information for current and future years.
	•	Analyze current market conditions and supply/demand dynamics.
	•	Use available files to fill in missing data, and provide error bar ranges when possible.
	•	Provide an in-depth “analysis” section (150–200 words) that thoroughly explains your reasoning, including assumptions, deductions, supporting data from all sources, and market context.
	•	Populate the “commentary” section with detailed explanations for each field, explicitly stating the data source and reasoning behind each value.
	4.	Precise Numeric Data Handling:
	•	Convert all numeric fields to numbers. When provided with ranges, derive the most likely value based on market data and project characteristics, providing a clear justification and error bar ranges when possible.
	•	For price potentials, provide ranges and reasoning, prioritizing file-based price data.
	5.	Comprehensive Certification and SDG Identification:
	•	Identify and include all mentioned and implied certifications and SDGs, leveraging database and file information to enhance accuracy.
	6.	Environmental Asset ID Management:
	•	If the “environmental_asset_id” is not explicitly provided, attempt to generate a probable ID based on project details and market conventions, or set it to “on request” with a clear explanation.
	7.	Complete Core Data Documentation:
	•	Thoroughly document all missing or ambiguous essential data within the “core_data” object, providing detailed notes, potential data sources, and error bar ranges where possible.
	•	Create a dedicated commentary section in the “commentary” object for each key in core_data.
	8.	Advanced Methodology and Registry Suggestion:
	•	Suggest the most appropriate methodologies and registries, providing detailed comparisons and justifications based on market data, file data, and project characteristics.
	9.	Price and Buyer Projections:
	•	Add “potential_buyers” and “price_potential” objects which include projections for the years 2025–2029.
	•	For “price_potential”, determine the price ranges by analyzing available files for projects with similar descriptions or activities, and clearly document the specific files and project similarities used in your deduction.
	•	Add dedicated commentary for each year in both “potential_buyers” and “price_potential”, explaining the rationale behind each projection.

USER INSTRUCTIONS (MEDIUM PRIORITY)

You will receive a single block of text describing a climate or carbon project. Your task is to:
	1.	Parse the text into the structured ProjectData JSON format.
	2.	Provide highly detailed and justified logical and data-driven deductions in the “analysis” and “commentary” sections.
	3.	Clearly note any ambiguous or missing essential fields in “core_data” and provide error bar ranges where possible. Add a dedicated commentary section for each key in the core_data object.
	4.	Add “potential_buyers” and “price_potential” objects which include projections for 2025-2029. Add appropriate commentary for each year, with a strong focus on utilizing and referencing file data for price projections.
	5.	Return only the final JSON output.

Example 1

User input:

The Verde initiative in northern Brazil involves approximately 40k hectares. Implementation expected next year with Gold Standard certification being pursued. Indigenous communities will help monitor. Estimated carbon sequestration around 15-20 thousand units per annum, with standard buffers applied. Reference code VRD-2023.

Sample JSON response:

{
“title”: “Verde Initiative”,
“location”: “Northern Brazil”,
“area”: “40000 ha”,
“status”: “Planning”,
“feasibility_score”: 8,
“difficulty_score”: 6,
“risk_score”: 3,
“methodology”: “AR-ACM0003 (Gold Standard), VM0007 (Verra), CAR10.0 (CAR)”,
“start_date”: “2024-03-15”,
“environmental_asset_id”: “VRD-2024-001”,
“annual_credit_potential”: 18000,
“buffer_allocation”: 10,
“saleable_credits”: 16200,
“sdgs”: [“SDG 13”, “SDG 15”],
“certifications”: [“Gold Standard”],
“analysis”: “The Verde Initiative, a reforestation project in Northern Brazil, is in advanced planning, targeting 40,000 hectares. Based on market data and file analysis of similar projects, a credit yield of 18,000 is used, considering the range of 16,000-20,000. Methodologies AR-ACM0003, VM0007, and CAR10.0 were selected from both web and file-based comparisons, with AR-ACM0003 being the preferred choice under Gold Standard. Current carbon credit prices extracted from files are trending at $15-$25, with projected increases based on market dynamics. Potential buyers include large corporations, ESG funds, airlines, and governmental bodies. The generated environmental asset ID VRD-2024-001 aligns with market conventions. SDG 13 and 15 are applicable. Overall feasibility is high due to community involvement, while risks are mitigated by certification. Start date is projected for next year.”,
“core_data”: {
“environmental_asset_id”: “VRD-2024-001 (Generated based on project code and market conventions; error bar: N/A)”,
“annual_credit_potential”: “18000 (Range: 16000-20000 based on file data and market analysis)”,
“buffer_allocation”: “10% (Range: 9%-11% based on industry standards)”,
“saleable_credits”: “16200 (Calculated after 10% buffer deduction; Range: 14400-18000)”
},
“potential_buyers”: {
“2025”: “Large Corporations, ESG Funds, Airlines”,
“2026”: “Large Corporations, ESG Funds, Airlines, Governments”,
“2027”: “Large Corporations, ESG Funds, Airlines, Governments, Investment Firms”,
“2028”: “Large Corporations, ESG Funds, Airlines, Governments, Investment Firms, Carbon Exchanges”,
“2029”: “Large Corporations, ESG Funds, Airlines, Governments, Investment Firms, Carbon Exchanges, Retail Investors”
},
“price_potential”: {
“2025”: “$18-$28 (Derived from file analysis of similar projects; files: ProjectFile_A, ProjectFile_B)”,
“2026”: “$20-$32 (Adjusted upward based on market trends noted in file data; files: ProjectFile_A, ProjectFile_C)”,
“2027”: “$23-$38 (Projected increase supported by multiple file sources indicating rising demand)”,
“2028”: “$27-$45 (File data trends and regulatory developments suggest further price appreciation)”,
“2029”: “$30-$55 (Highest range reflecting anticipated market growth and increased project scale)”
},
“commentary”: {
“title”: “Extracted directly from the provided text.”,
“location”: “Identified as ‘Northern Brazil’ from the input.”,
“area”: “Derived from ‘approximately 40k hectares’, converted to ‘40000 ha’.”,
“status”: “Inferred as ‘Planning’ based on implementation expected next year.”,
“feasibility_score”: “Set to 8 due to strong community involvement and pursuit of Gold Standard certification.”,
“difficulty_score”: “Assigned 6, slightly above average considering project scale and complexity.”,
“risk_score”: “Reduced to 3 as the project benefits from certification and community support.”,
“methodology”: “Selected AR-ACM0003 (Gold Standard), VM0007 (Verra), and CAR10.0 (CAR) based on comprehensive web, file, and database analysis; AR-ACM0003 is prioritized.”,
“start_date”: “Projected as next year, with a specific date generated as ‘2024-03-15’.”,
“environmental_asset_id”: “Generated as ‘VRD-2024-001’ based on market conventions and project reference code.”,
“annual_credit_potential”: “Determined as 18000, using the midpoint of the range (16000-20000) from file analysis.”,
“buffer_allocation”: “Standard industry assumption of 10% applied; error bar range: 9%-11%.”,
“saleable_credits”: “Calculated as 16200 after buffer deduction; error bar range: 14400-18000.”,
“sdgs”: “SDG 13 and SDG 15 inferred based on project type and certification requirements.”,
“certifications”: “Gold Standard explicitly mentioned in the text.”,
“potential_buyers”: “Projections based on current market analysis and file data of similar projects. Each year’s projection reflects expanded interest from additional sectors.”,
“price_potential”: “Price ranges for 2025-2029 derived primarily from file analysis of projects with similar profiles (e.g., ProjectFile_A, ProjectFile_B, ProjectFile_C). Each year’s range is justified based on documented market trends and anticipated regulatory impacts.”
}
}

This is your complete prompt. Use it as-is to transform any provided climate or carbon project description into a structured JSON object with detailed, file-informed price determinations and comprehensive data-driven deductions.
`;

// Define the ClimateProjectParser class
class ClimateProjectParser {
  constructor() {
    this.client = openai;
    this.requestCount = 0;
  }

  async extractProjectInfo(text) {
    const requestId = ++this.requestCount;
    console.log(`\n📝 [Request #${requestId}] Processing new request - ${new Date().toISOString()}`);
    console.log(`📄 [Request #${requestId}] Text length: ${text.length} characters`);
    
    try {
      console.log(`🔄 [Request #${requestId}] Sending request to API...`);
      console.time(`OpenAI request #${requestId}`);
      
      const response = await this.client.chat.completions.create({
        model: "o3-mini-2025-01-31",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: `Parse the following climate project description into structured JSON:\n\n${text}` }
        ],
        max_completion_tokens: 4000  // Updated parameter
      });
      
      console.timeEnd(`OpenAI request #${requestId}`);
      console.log(`✅ [Request #${requestId}] OpenAI response received. Status: Success`);
      console.log(`📡 [Request #${requestId}] Model used: ${response.model}`);
      console.log(`🪙 [Request #${requestId}] Tokens used: ${response.usage?.total_tokens || 'Unknown'}`);

      // Extract the JSON content from the response
      const jsonContent = response.choices[0].message.content.trim();
      console.log(`🔍 [Request #${requestId}] Response content length: ${jsonContent.length} characters`);
      
      try {
        const parsedJson = JSON.parse(jsonContent);
        console.log(`✅ [Request #${requestId}] JSON parsing successful`);
        console.log(`✅ [Request #${requestId}] Fields extracted: ${Object.keys(parsedJson).length}`);
        return parsedJson;
      } catch (parseError) {
        console.error(`❌ [Request #${requestId}] Error parsing JSON response:`, parseError.message);
        console.log(`💾 [Request #${requestId}] Raw response (first 200 chars):`, jsonContent.substring(0, 200) + '...');
        throw new Error("Failed to parse OpenAI response as JSON");
      }
    } catch (error) {
      console.error(`❌ [Request #${requestId}] OpenAI API error:`, error.message);
      if (error.response) {
        console.error(`🛑 [Request #${requestId}] Error status:`, error.response.status);
        console.error(`🛑 [Request #${requestId}] Error type:`, error.response.data?.error?.type);
        console.error(`🛑 [Request #${requestId}] Error message:`, error.response.data?.error?.message);
      }
      throw error;
    }
  }
}

// Middleware to check API key
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!process.env.API_SECRET_KEY) {
    console.warn("WARNING: API_SECRET_KEY environment variable is not set");
    return res.status(500).json({ error: 'Server configuration error: API key not configured' });
  }
  
  if (!apiKey || apiKey !== process.env.API_SECRET_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  
  next();
};

// Create API endpoint for parsing
app.post('/api/parse', apiKeyAuth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      console.log('❌ API request rejected: Missing text field');
      return res.status(400).json({ error: "Text field is required" });
    }
    
    if (!process.env.OPENAI_API_KEY) {
      console.log('❌ API request rejected: Missing OpenAI API key');
      return res.status(500).json({ error: "OpenAI API key is not configured" });
    }
    
    console.log('📥 Received /api/parse request');
    console.log(`📊 Input text length: ${text.length} characters`);
    
    const parser = new ClimateProjectParser();
    console.log('🔄 Processing project information...');
    const projectInfo = await parser.extractProjectInfo(text);
    
    console.log('📤 Sending response to client');
    res.json(projectInfo);
  } catch (error) {
    console.error('❌ Error processing request:', error.message);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Simple test endpoint for OpenAI connectivity
app.get('/api/test-openai', apiKeyAuth, async (req, res) => {
  console.log('📥 Received OpenAI test request');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ Test rejected: Missing OpenAI API key');
    return res.status(500).json({ error: "OpenAI API key is not configured" });
  }
  
  try {
    console.log('🔄 Testing OpenAI connection...');
    const response = await openai.responses.create({
      model: "o3-mini-2025-01-31",
      input: [
        {
          "role": "user",
          "content": [
            {
              "type": "input_text",
              "text": "Return the current year as a number only."
            }
          ]
        }
      ],
      text: {
        "format": {
          "type": "text"
        }
      },
      reasoning: {
        "effort": "low"
      },
      tools: [],
      store: true
    });
    
    const result = response.text.trim();
    console.log('✅ OpenAI test successful:', result);
    
    res.json({
      status: "success",
      message: "OpenAI connection working",
      response: result,
      model: response.model || "o3-mini",
      tokens_used: "N/A" // The new API may not provide token usage in the same way
    });
  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message);
    res.status(500).json({
      status: "error",
      message: "OpenAI connection failed",
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Climate Project Parser API is running',
    version: '1.0.1',
    timestamp: new Date().toISOString()
  });
});

// Handle root route with improved HTML
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Climate Project Parser API</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            line-height: 1.6;
            color: #333;
          }
          h1 { color: #2c3e50; margin-bottom: 20px; }
          h2 { color: #3498db; margin-top: 30px; }
          pre { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 5px; 
            overflow-x: auto;
            border: 1px solid #e9ecef;
          }
          .code { 
            font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
            background: #f1f1f1;
            padding: 2px 4px;
            border-radius: 3px;
          }
          .endpoint {
            background: #e8f4fc;
            padding: 10px 15px;
            border-left: 4px solid #3498db;
            margin: 20px 0;
          }
          .note {
            background: #fff8e8;
            padding: 10px 15px;
            border-left: 4px solid #f39c12;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <h1>Climate Project Parser API</h1>
        <p>This API parses unstructured text describing climate or carbon projects and transforms it into structured JSON data.</p>
        
        <div class="endpoint">
          <h2>API Endpoint</h2>
          <p>Submit POST requests to <span class="code">/api/parse</span> with the following JSON body:</p>
        </div>
        
        <pre>
{
  "text": "Blue Forest Mangrove Project spans 85,500 hectares in Indonesia..."
}
        </pre>
        
        <div class="note">
          <p><strong>Note:</strong> All requests require an API key to be included in the header as <span class="code">X-API-Key</span>.</p>
        </div>
        
        <h2>Response Format</h2>
        <p>The API will return structured JSON with extracted climate project information including:</p>
        <ul>
          <li>Project title, location, and area</li>
          <li>Feasibility, difficulty, and risk scores</li>
          <li>Methodology and certification details</li>
          <li>Credit potential and pricing projections</li>
          <li>Detailed analysis and commentary</li>
        </ul>
        
        <h2>Health Check</h2>
        <p>You can check if the API is running by sending a GET request to <span class="code">/api/health</span>.</p>
      </body>
    </html>
  `);
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested endpoint does not exist' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const basePort = process.env.PORT || 3000;
  
  function startServer(port) {
    app.listen(port, async () => {
      console.log('🚀 Climate Parser API starting up...');
      console.log(`🔌 Server running on port ${port}`);
      console.log(`⏰ Time: ${new Date().toISOString()}`);
      console.log(`🌐 Access the API at http://localhost:${port}/`);
      
      // Check environment variables
      console.log('\n📋 Environment check:');
      console.log(`🔑 API_SECRET_KEY: ${process.env.API_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
      console.log(`🔑 OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
      
      // Test OpenAI connection
      if (process.env.OPENAI_API_KEY) {
        await testOpenAIConnection();
      } else {
        console.log('⚠️ Skipping OpenAI connection test - API key not configured');
      }
      
      if (process.env.npm_lifecycle_event === 'test') {
        console.log('🧪 Running in test mode');
      }
      
      // Print sample curl command for testing
      console.log('\n📘 Sample curl commands:');
      console.log(`\n1️⃣  Test OpenAI connection:`);
      console.log(`curl http://localhost:${port}/api/test-openai -H "X-API-Key: ${process.env.API_SECRET_KEY || 'your-api-key-here'}"`);
      
      console.log(`\n2️⃣  Parse project information:`);
      console.log(`curl -X POST http://localhost:${port}/api/parse \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${process.env.API_SECRET_KEY || 'your-api-key-here'}" \\
  -d '{
    "text": "The Blue Forest Mangrove Project spans 85,500 hectares in Indonesia. This conservation initiative aims to protect existing mangrove forests and restore degraded areas. The project started in 2022 with Verra certification. Initial estimates suggest annual carbon sequestration of approximately 250,000 metric tons, with a standard buffer allocation of 15%. Local communities are actively involved in monitoring and implementation."
  }'`);
      
      console.log(`\n3️⃣  Health check:`);
      console.log(`curl http://localhost:${port}/api/health`);
      console.log('\n✨ Server initialization complete ✨');
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${port} in use, trying port ${port + 1}...`);
        startServer(port + 1);
      } else {
        throw err;
      }
    });
  }
  
  startServer(basePort);
}

// Export for Vercel serverless function
export default app;

// Log startup information
console.log(`Climate Parser API initialized at ${new Date().toISOString()}`);