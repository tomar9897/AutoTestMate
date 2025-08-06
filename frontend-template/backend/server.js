
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import axios from "axios"; 
import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildStructuredPrompt } from "./prompttemplate.js";

dotenv.config();
console.log("🔑 Loaded GROK_API_KEY from .env:", process.env.GROK_API_KEY);


const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Initialize AI 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const geminiModel = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

// Grok API config
const GROK_API_BASE = "https://api.x.ai/v1";
const GROK_API_KEY = process.env.GROK_API_KEY; // Add this to your .env file

// Helper function to call Grok API
async function callGrokAPI(prompt) {
  if (!GROK_API_KEY) {
    throw new Error("Grok API key not configured. Add GROK_API_KEY to your .env file");
  }

  try {
    const response = await axios.post(
      `${GROK_API_BASE}/chat/completions`,
      {
        model: "grok-beta", 
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 4000,
        stream: false
      },
      {
        headers: {
          "Authorization": `Bearer ${GROK_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 60000 
      }
    );

    const content = response.data.choices[0].message.content;
    console.log("✅ Grok API response received");
    return content;

  } catch (error) {
    console.error("❌ Grok API Error:", error.response?.data || error.message);
    
    // Provide specific error messages
    if (error.response?.status === 401) {
      throw new Error("Invalid Grok API key. Please check your GROK_API_KEY in .env file");
    } else if (error.response?.status === 429) {
      throw new Error("Grok API rate limit exceeded. Please try again later");
    } else if (error.code === 'ENOTFOUND') {
      throw new Error("Cannot connect to Grok API. Please check your internet connection");
    } else {
      throw new Error(`Grok API error: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

// func to parse markdown response into structured JSON
function parseMarkdownToTestCases(markdownText) {
  const testCases = [];
  
  try {
    // Split by test caseto get individual testcases
    const testCaseSections = markdownText.split(/Test Case \d+:/);
    
    for (let i = 1; i < testCaseSections.length; i++) {
      const section = testCaseSections[i];
      
      // Extract test case name
      const nameMatch = section.match(/Test Case Name:\s*(.+?)(?:\n|Description:)/);
      const name = nameMatch ? nameMatch[1].trim() : `Test Case ${i}`;
      
      // Extract description
      const descMatch = section.match(/Description:\s*(.+?)(?:\n|Precondition:)/);
      const description = descMatch ? descMatch[1].trim() : "";
      
      // precondition
      const precondMatch = section.match(/Precondition:\s*(.+?)(?:\n|Steps:)/);
      const precondition = precondMatch ? precondMatch[1].trim() : "";
      
      // steps from markdown table or  /pipe format
      const steps = [];
      
      // Try to find pipe-separated steps first
      const pipeStepMatches = section.match(/(\d+)\s*\|\s*(.+?)\s*\|\s*(.+?)(?=\n|$)/g);
      if (pipeStepMatches) {
        pipeStepMatches.forEach(match => {
          const trimmedMatch = match.trim();
          if (!trimmedMatch.includes('Test Step') && !trimmedMatch.includes('---')) {
            steps.push(trimmedMatch);
          }
        });
      }
      
      // If no pipe steps found, try table format
      if (steps.length === 0) {
        const tableMatch = section.match(/\|.*\|.*\|.*\|/g);
        if (tableMatch) {
          for (let j = 0; j < tableMatch.length; j++) {
            const row = tableMatch[j];
            
            // Skip header rows
            if (row.includes('Test Step') || row.includes('---')) continue;
            
            // Parse table row: | step | description | expected |
            const cells = row.split('|').map(cell => cell.trim()).filter(cell => cell);
            
            if (cells.length >= 3) {
              const stepNum = cells[0] || (j).toString();
              const stepDesc = cells[1] || "";
              const expectedResult = cells[2] || "";
              
              steps.push(`${stepNum} | ${stepDesc} | ${expectedResult}`);
            }
          }
        }
      }
      
      // If no steps found, then system willcreate one meaningful step based on the test case name
      if (steps.length === 0) {
        const defaultStep = name.includes("Invalid") || name.includes("Error") 
          ? `1 | ${name.replace(/Test Case \d+:\s*/, '')} | Error message should be displayed`
          : `1 | ${name.replace(/Test Case \d+:\s*/, '')} | Operation should complete successfully`;
        steps.push(defaultStep);
      }
      
      testCases.push({
        name,
        description,
        precondition,
        steps
      });
    }
    
    console.log(`📊 Parsed ${testCases.length} test cases from markdown`);
    return testCases;
    
  } catch (error) {
    console.error("❌ Error parsing markdown:", error);
    
    // Return a single fallback test case 
    return [{
      name: "Manual Review Required",
      description: "AI response could not be parsed correctly. Please review the raw response.",
      precondition: "Review the raw AI response for complete test case details",
      steps: ["1 | Review raw AI response | Extract and format test cases manually"]
    }];
  }
}

// 1. Prompt Improvement Endpoint
app.post("/api/improve", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    console.log("❌ Prompt missing in request");
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    console.log("📥 Improving prompt:", prompt);

    const result = await geminiModel.generateContent({
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

//  2. Generate Test Cases Endpoint (Full Grok integration -- there is no other api then geminin currently)
app.post("/api/ai/generate-testcases", async (req, res) => {
  const { improvedPrompt, engine, testCaseCount } = req.body;

  if (!improvedPrompt) {
    console.log("❌ Improved prompt missing in request");
    return res.status(400).json({ error: "Improved prompt is required" });
  }

  try {
    console.log("🧪 Generating test cases for:", improvedPrompt);
    console.log("🔢 Requested test case count:", testCaseCount);
    console.log("🤖 Using engine:", engine || "gemini");

    // Build structured prompt with test case count
    const structuredPrompt = buildStructuredPrompt(improvedPrompt, testCaseCount);
    console.log("📝 Structured Prompt:\n", structuredPrompt);

    let text;
    let usedEngine = engine || "gemini";
    
    // Configure generation parameters for better consistency
    const generationConfig = {
      temperature: 0.3, // Lower tempfor more consistent output
      topP: 0.8,
      topK: 40,
      maxOutputTokens: testCaseCount > 10 ? 8192 : 4096, // More tokens for larger requests
    };
    
    // Handle different AI engines
    switch (engine) {
      case "grok":
        try {
          console.log("🚀 Using Grok API...");
          text = await callGrokAPI(structuredPrompt);
          usedEngine = "grok";
        } catch (grokError) {
          console.error("❌ Grok API failed:", grokError.message);
          console.log("🔄 Falling back to Gemini...");
          
          const result = await geminiModel.generateContent({
            contents: [{ parts: [{ text: structuredPrompt }] }],
            generationConfig: generationConfig
          });
          text = await result.response.text();
          usedEngine = "gemini (grok fallback)";
        }
        break;
        
      case "ollama":
        console.log("⚠️ Ollama engine not yet implemented, falling back to Gemini");
        const ollamaResult = await geminiModel.generateContent({
          contents: [{ parts: [{ text: structuredPrompt }] }],
          generationConfig: generationConfig
        });
        text = await ollamaResult.response.text();
        usedEngine = "gemini (ollama not available)";
        break;
        
      case "gemini":
      default:
        console.log("🔷 Using Gemini API...");
        const geminiResult = await geminiModel.generateContent({
          contents: [{ parts: [{ text: structuredPrompt }] }],
          generationConfig: generationConfig
        });
        text = await geminiResult.response.text();
        usedEngine = "gemini";
        break;
    }

    console.log("📨 AI returned:\n", text);

    //trying to extract JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\n([\s\S]*?)\n```/);
    
    let testCases = [];
    
    if (jsonMatch) {
      // Found JSON in code block
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        testCases = Array.isArray(parsed) ? parsed : (parsed.testCases || []);
        console.log(" Successfully parsed JSON from code block");
      } catch (jsonError) {
        console.warn("⚠️ JSON in code block is invalid, trying markdown parsing");
        testCases = parseMarkdownToTestCases(text);
      }
    } else {
      // No JSON found, parse markdown format
      console.log("📋 No JSON found, parsing markdown format");
      testCases = parseMarkdownToTestCases(text);
    }

    // Enhanced validation - ensure we have the right count
    if (!Array.isArray(testCases) || testCases.length === 0) {
      console.warn("⚠️ No valid test cases found, creating fallback");
      testCases = [{
        name: "Manual Test Case Required",
        description: "Please review the raw response and create test cases manually",
        precondition: "System setup required",
        steps: ["1 | Review requirements | Create appropriate test steps"]
      }];
    }

    // Log count mismatch for debugging
    if (testCaseCount && testCases.length !== testCaseCount) {
      console.warn(`🚨 COUNT MISMATCH: Requested ${testCaseCount}, got ${testCases.length}`);
      console.log("Raw AI response length:", text.length);
      console.log("Used engine:", usedEngine);
    }

    console.log(`✅ Returning ${testCases.length} test cases using ${usedEngine}`);
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

// 3. Health Check Endpoint
app.get("/api/health", (req, res) => {
  const grokStatus = GROK_API_KEY ? "configured" : "not configured";
  const geminiStatus = process.env.GEMINI_API_KEY ? "configured" : "not configured";
  
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    endpoints: ["/api/improve", "/api/ai/generate-testcases"],
    engines: {
      gemini: geminiStatus,
      grok: grokStatus,
      ollama: "coming soon"
    }
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log(`📡 Available endpoints:`);
  console.log(`   POST /api/improve - Improve user prompts`);
  console.log(`   POST /api/ai/generate-testcases - Generate test cases`);
  console.log(`   GET  /api/health - Health check`);
  console.log(`🤖 AI Engine Status:`);
  console.log(`   Gemini: ${process.env.GEMINI_API_KEY ? '✅ Ready' : '❌ Not configured'}`);
  console.log(`   Grok: ${GROK_API_KEY ? '✅ Ready' : '❌ Not configured (add GROK_API_KEY to .env)'}`);
  console.log(`   Ollama: 🚧 Coming soon`);
});