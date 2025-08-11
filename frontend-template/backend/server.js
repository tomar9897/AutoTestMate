
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import axios from "axios";
import Groq from "groq-sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CohereClient } from "cohere-ai";  // ADD: Cohere import
import { buildStructuredPrompt } from "./prompttemplate.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  // deployed frontend URL will be added here via an environment variable
  process.env.CORS_ORIGIN
].filter(Boolean);

// CORS for Vite dev server
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(morgan("dev"));

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiFlashModel = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });
const geminiProModel = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

// Initialize Groq client
let groq;
if (process.env.GROQ_API_KEY) {
  try {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 30000,
    });
    console.log("✅ Groq client initialized");
  } catch (error) {
    console.error("❌ Failed to initialize Groq:", error.message);
  }
}

// ADD: Initialize Cohere client
let cohere;
if (process.env.COHERE_API_KEY) {
  try {
    cohere = new CohereClient({
      token: process.env.COHERE_API_KEY,
    });
    console.log("✅ Cohere client initialized");
  } catch (error) {
    console.error("❌ Failed to initialize Cohere:", error.message);
  }
}

// Helper function to call Groq API
async function callGroqAPI(prompt) {
  if (!process.env.GROQ_API_KEY || !groq) {
    throw new Error("Groq API key not configured");
  }

  try {
    console.log("⚡ Calling Groq API...");
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: 4096,
      top_p: 1,
      stream: false,
    });

    const content = chatCompletion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response from Groq");
    
    console.log("✅ Groq API success");
    return content;
  } catch (error) {
    console.error("❌ Groq API Error:", error.message);
    throw new Error(`Groq API error: ${error.message}`);
  }
}

// ADD: Helper function to call Cohere API
async function callCohereAPI(prompt) {
  if (!process.env.COHERE_API_KEY || !cohere) {
    throw new Error("Cohere API key not configured");
  }

  try {
    console.log("🌟 Calling Cohere API (Free Tier)...");
    
    const response = await cohere.generate({
      model: "command",
      prompt: prompt,
      temperature: 0.3,
      max_tokens: 3000,
      k: 0,
      p: 0.8,
      stop_sequences: [],
      truncate: "END"
    });

    const content = response.generations[0]?.text;
    if (!content) throw new Error("Empty response from Cohere");
    
    console.log("✅ Cohere API success");
    return content.trim();
  } catch (error) {
    console.error("❌ Cohere API Error:", error.message || error);
    
    if (error.status === 429) {
      throw new Error("Cohere rate limit exceeded or free credits exhausted");
    } else if (error.status === 401) {
      throw new Error("Invalid Cohere API key. Please check your COHERE_API_KEY");
    } else if (error.status === 402) {
      throw new Error("Cohere API payment required. Free tier exhausted");
    } else if (error.code === 'ENOTFOUND') {
      throw new Error("Cannot connect to Cohere API. Please check your internet connection");
    } else {
      throw new Error(`Cohere API error: ${error.message || 'Unknown error'}`);
    }
  }
}

// Helper function to call Gemini API
async function callGeminiAPI(prompt, model = "flash") {
  const selectedModel = model === "pro" ? geminiProModel : geminiFlashModel;
  const modelName = model === "pro" ? "Gemini Pro" : "Gemini Flash";
  
  try {
    console.log(`🔷 Using ${modelName} API...`);
    const result = await selectedModel.generateContent({
      contents: [{ parts: [{ text: prompt }] }]
    });
    
    const response = await result.response;
    const text = await response.text();
    
    if (!text) throw new Error(`Empty response from ${modelName}`);
    
    console.log(`✅ ${modelName} API success`);
    return text;
  } catch (error) {
    console.error(`❌ ${modelName} failed:`, error.message);
    throw error;
  }
}

// FIXED: New parsing function for the updated Markdown format
function parseMarkdownToTestCases(markdownText) {
  const testCases = [];
  
  try {
    console.log("📝 Starting to parse markdown response...");
    console.log("🔍 Raw text preview:", markdownText.substring(0, 300) + "...");
    
    // Split by the new format: **Test Case X: [Name]**
    const testCaseSections = markdownText.split(/\*\*Test Case \d+:/);
    
    console.log(`📋 Found ${testCaseSections.length - 1} test case sections`);
    
    for (let i = 1; i < testCaseSections.length; i++) {
      const section = testCaseSections[i];
      console.log(`\n🧪 Processing Test Case ${i}:`);
      console.log("Raw section:", section.substring(0, 200) + "...");
      
      // Extract test case name (everything before the first **)
      let name = `Test Case ${i}`;
      const nameMatch = section.match(/^([^*]+?)\*\*/);
      if (nameMatch) {
        name = nameMatch[1].trim();
        console.log("✅ Found name:", name);
      }
      
      // Extract objective/description (new format uses **Objective:** instead of Description)
      let description = "";
      const objectiveMatch = section.match(/\*\*Objective:\*\*\s*([^*]+?)(?=\*\*|$)/s);
      if (objectiveMatch) {
        description = objectiveMatch[1].trim();
        console.log("✅ Found objective:", description.substring(0, 50) + "...");
      }
      
      // Extract preconditions (new format uses **Preconditions:**)
      let precondition = "";
      const precondMatch = section.match(/\*\*Preconditions?:\*\*\s*([^*]+?)(?=\*\*|$)/s);
      if (precondMatch) {
        precondition = precondMatch[1].trim();
        console.log("✅ Found precondition:", precondition.substring(0, 50) + "...");
      }
      
      const steps = [];
      
      // Extract test steps from new format
      const stepsSection = section.match(/\*\*Test Steps:\*\*([\s\S]*?)(?=\*\*Test Case|$)/);
      if (stepsSection) {
        const stepsText = stepsSection[1];
        console.log("🔍 Found steps section:", stepsText.substring(0, 100) + "...");
        
        // Look for numbered steps with **Action:** and **Expected Result:**
        const stepPattern = /(\d+)\.\s*\*\*Action:\*\*(.*?)\*\*Expected Result:\*\*(.*?)(?=\d+\.\s*\*\*Action:\*\*|$)/gs;
        let stepMatch;
        let stepCount = 0;
        
        while ((stepMatch = stepPattern.exec(stepsText)) !== null) {
          stepCount++;
          const stepNum = stepMatch[1].trim();
          const stepDesc = stepMatch[2].trim();
          const expectedResult = stepMatch[3].trim();
          
          console.log(`  📌 Step ${stepNum}: ${stepDesc.substring(0, 30)}...`);
          
          steps.push(`${stepNum} | ${stepDesc} | ${expectedResult}`);
        }
        
        console.log(`✅ Extracted ${stepCount} steps`);
      }
      
      // Fallback: if no steps found, create a meaningful default step
      if (steps.length === 0) {
        console.warn(`⚠️ No steps parsed for ${name}, creating fallback`);
        const defaultStep = name.toLowerCase().includes("invalid") || name.toLowerCase().includes("error") 
          ? `1 | Attempt ${name.toLowerCase()} | Appropriate error message should be displayed`
          : `1 | Execute ${name.toLowerCase()} scenario | Expected functionality should work correctly`;
        steps.push(defaultStep);
      }
      
      console.log(`✅ Final test case: ${name} with ${steps.length} steps`);
      
      testCases.push({
        name,
        description,
        precondition,
        steps
      });
    }
    
    console.log(`\n📊 Successfully parsed ${testCases.length} test cases from markdown`);
    return testCases;
    
  } catch (error) {
    console.error("❌ Error parsing markdown:", error);
    console.log("📄 Full markdown text for debugging:", markdownText);
    
    // Return a more helpful fallback
    return [{
      name: "Parsing Error - Check Raw Response",
      description: "The AI generated a response but it couldn't be parsed. Check the raw response in the network tab.",
      precondition: "Review the raw AI response for complete test case details",
      steps: ["1 | Check raw response in network tab | Copy test cases manually"]
    }];
  }
}

// 1a. ORIGINAL Endpoint (keeping for backwards compatibility)
app.post("/api/improve", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    console.log("❌ Prompt missing in request");
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    console.log("📥 [/api/improve] Improving prompt:", prompt);

    const result = await geminiFlashModel.generateContent({
      contents: [{ parts: [{ text: `Please improve this user story or requirement:\n\n"${prompt}"` }] }],
    });

    const response = result.response;
    const improved = await response.text();

    console.log("🎯 Improved prompt:", improved);
    res.json({ improvedPrompt: improved });
  } catch (error) {
    console.error("❌ Error improving prompt:", error);
    res.status(500).json({ error: "Failed to improve prompt" });
  }
});

// 1b. NEW Endpoint (for any future calls from frontend)
app.post("/api/ai/improve-prompt", async (req, res) => {
  const { rawPrompt, engine } = req.body;

  if (!rawPrompt) {
    console.log("❌ Raw prompt missing in request");
    return res.status(400).json({ error: "Raw prompt is required" });
  }

  try {
    console.log("📥 [/api/ai/improve-prompt] Raw prompt:", rawPrompt, "Engine:", engine);

    const result = await geminiFlashModel.generateContent({
      contents: [{ parts: [{ text: `Please improve this user story or requirement:\n\n"${rawPrompt}"` }] }],
    });

    const response = result.response;
    const improved = await response.text();

    console.log("🎯 Improved prompt:", improved);
    res.json({ improvedPrompt: improved });
  } catch (error) {
    console.error("❌ Error improving prompt:", error);
    res.status(500).json({ error: "Failed to improve prompt" });
  }
});

// 2. Generate Test Cases Endpoint (ENHANCED with Cohere support)
app.post("/api/ai/generate-testcases", async (req, res) => {
  const { improvedPrompt, engine, testCaseCount } = req.body;

  if (!improvedPrompt) {
    console.log("❌ Improved prompt missing in request");
    return res.status(400).json({ error: "Improved prompt is required" });
  }

  try {
    console.log("\n🧪 [/api/ai/generate-testcases] Starting test case generation...");
    console.log("📥 Improved prompt:", improvedPrompt.substring(0, 100) + "...");
    console.log("🔢 Requested test case count:", testCaseCount);
    console.log("🤖 Using engine:", engine || "gemini");

    const structuredPrompt = buildStructuredPrompt(improvedPrompt, testCaseCount);
    console.log("📝 Structured prompt length:", structuredPrompt.length);
    console.log("📄 Structured prompt preview:", structuredPrompt.substring(0, 200) + "...");

    let text;
    let usedEngine = engine || "gemini";
    
    // Handle different AI engines (ADD: Cohere case)
    switch (engine) {
      case "groq":
        try {
          text = await callGroqAPI(structuredPrompt);
          usedEngine = "groq";
        } catch (groqError) {
          console.error("❌ Groq API failed:", groqError.message);
          console.log("🔄 Falling back to Gemini...");
          text = await callGeminiAPI(structuredPrompt, "flash");
          usedEngine = "gemini (groq fallback)";
        }
        break;

      case "cohere-free":
        try {
          text = await callCohereAPI(structuredPrompt);
          usedEngine = "cohere-free";
        } catch (cohereError) {
          console.error("❌ Cohere API failed:", cohereError.message);
          console.log("🔄 Falling back to Gemini...");
          text = await callGeminiAPI(structuredPrompt, "flash");
          usedEngine = "gemini (cohere fallback)";
        }
        break;

      case "gemini-pro":
        try {
          text = await callGeminiAPI(structuredPrompt, "pro");
          usedEngine = "gemini-pro";
        } catch (error) {
          console.log("🔄 Falling back to Gemini Flash...");
          text = await callGeminiAPI(structuredPrompt, "flash");
          usedEngine = "gemini-flash (pro fallback)";
        }
        break;
        
      case "ollama":
        console.log("⚠️ Ollama engine not yet implemented, falling back to Gemini");
        text = await callGeminiAPI(structuredPrompt, "flash");
        usedEngine = "gemini (ollama not available)";
        break;
        
      case "gemini":
      default:
        text = await callGeminiAPI(structuredPrompt, "flash");
        usedEngine = "gemini-flash";
        break;
    }

    console.log("📨 AI returned response, length:", text.length);
    console.log("📄 AI response preview:", text.substring(0, 300) + "...");

    // Try to extract JSON from markdown code blocks first
    const jsonMatch = text.match(/``````/);
    
    let testCases = [];
    
    if (jsonMatch) {
      try {
        console.log("🔍 Found JSON code block, attempting to parse...");
        const parsed = JSON.parse(jsonMatch[1]);
        testCases = Array.isArray(parsed) ? parsed : (parsed.testCases || []);
        console.log("✅ Successfully parsed JSON from code block");
      } catch (jsonError) {
        console.warn("⚠️ JSON in code block is invalid, trying markdown parsing");
        console.log("❌ JSON parsing error:", jsonError.message);
        testCases = parseMarkdownToTestCases(text);
      }
    } else {
      console.log("📋 No JSON found, parsing markdown format");
      testCases = parseMarkdownToTestCases(text);
    }

    // Final validation
    if (!Array.isArray(testCases) || testCases.length === 0) {
      console.error("⚠️ No valid test cases found after parsing!");
      testCases = [{
        name: "Parsing Failed - Check Raw Response",
        description: "The AI generated test cases but parsing failed. Check the raw response.",
        precondition: "Review the raw AI response",
        steps: ["1 | Check raw response in network tab | Extract test cases manually"]
      }];
    }

    // Log count mismatch for debugging
    if (testCaseCount && testCases.length !== testCaseCount) {
      console.warn(`🚨 COUNT MISMATCH: Requested ${testCaseCount}, got ${testCases.length}`);
    }

    console.log(`\n✅ Final result: Returning ${testCases.length} test cases using ${usedEngine}`);
    console.log("🔍 First test case sample:", JSON.stringify(testCases[0], null, 2));

    res.json({ 
      testCases, 
      raw: text,
      requestedCount: testCaseCount,
      actualCount: testCases.length,
      engine: usedEngine
    });

  } catch (error) {
    console.error("❌ Error generating test cases:", error);
    res.status(500).json({ 
      error: "Failed to generate test cases",
      details: error.message 
    });
  }
});

// 3. Health Check Endpoint (ADD: Cohere status)
app.get("/api/health", (req, res) => {
  const groqStatus = process.env.GROQ_API_KEY ? "✅ configured" : "❌ not configured";
  const geminiStatus = process.env.GEMINI_API_KEY ? "✅ configured" : "❌ not configured";
  const cohereStatus = process.env.COHERE_API_KEY ? "✅ configured" : "❌ not configured";
  
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    endpoints: ["/api/improve", "/api/ai/improve-prompt", "/api/ai/generate-testcases"],
    engines: {
      "gemini-flash": geminiStatus,
      "gemini-pro": geminiStatus,
      "groq": groqStatus,
      "cohere-free": cohereStatus,
      "ollama": "🚧 coming soon"
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404 - ${req.method} ${req.url}`);
  res.status(404).json({ 
    error: "Endpoint not found", 
    requested: `${req.method} ${req.url}`,
    available: ["/api/improve", "/api/ai/improve-prompt", "/api/ai/generate-testcases", "/api/health"] 
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ Server is running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   POST /api/improve - Improve user prompts (original)`);
  console.log(`   POST /api/ai/improve-prompt - Improve user prompts (new)`);
  console.log(`   POST /api/ai/generate-testcases - Generate test cases`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`🤖 AI Engine Status:`);
  console.log(`   Gemini Flash: ${process.env.GEMINI_API_KEY ? '✅ Ready' : '❌ Not configured'}`);
  console.log(`   Gemini Pro: ${process.env.GEMINI_API_KEY ? '✅ Ready' : '❌ Not configured'}`);
  console.log(`   Groq: ${process.env.GROQ_API_KEY ? '✅ Ready' : '❌ Not configured'}`);
  console.log(`   Cohere: ${process.env.COHERE_API_KEY ? '✅ Ready' : '❌ Not configured'}`);
  console.log(`   Ollama: 🚧 Coming soon\n`);
});
