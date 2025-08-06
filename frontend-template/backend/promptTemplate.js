// export const buildStructuredPrompt = (rawPrompt) => {
//   return `
// You are an expert QA engineer with deep knowledge of manual and automation testing.

// Given the following requirement:
// "${rawPrompt}"

// 1. Rewrite the requirement for clarity and professionalism. Label this section as "Improved Prompt".

// 2. Identify if the requirement specifies how many test cases to generate. If a number is mentioned, generate exactly that many test cases. If not, generate 5 structured test cases by default.
// - Test Case Name
// - Description
// - Precondition

// Then present the steps in a table format:

// Test Step | Test Step Description | Expected Result

// Use the following format exactly:

// Improved Prompt:
// ...

// Test Case:
// Test Case Name: ...
// Description: ...
// Precondition: ...
// Steps:
// 1 | ... | ...
// 2 | ... | ...
//   `.trim();
// };


// export const buildStructuredPrompt = (rawPrompt, testCaseCount = null) => {
//   // Auto-detect if user specified a number in their prompt
//   const numberMatch = rawPrompt.match(/(\d+)\s*(test\s*cases?|tests?)/i);
//   const detectedCount = numberMatch ? parseInt(numberMatch[1]) : null;
  
//   // Use specified count, detected count, or default to flexible generation
//   const finalCount = testCaseCount || detectedCount;
  
//   // Validate count limits (reasonable upper limit for AI models)
//   const maxAllowedCount = 35;
//   let validatedCount = finalCount;
  
//   if (finalCount && finalCount > maxAllowedCount) {
//     console.warn(`⚠️ Requested ${finalCount} test cases, limiting to ${maxAllowedCount}`);
//     validatedCount = maxAllowedCount;
//   }
  
//   let countInstruction = "";
//   let formatExample = "";
  
//   if (validatedCount) {
//     // Be VERY explicit about the exact count when specified
//     countInstruction = `CRITICAL REQUIREMENT: You MUST generate EXACTLY ${validatedCount} test cases. Count them carefully as you write. This is a strict requirement - no more, no less than ${validatedCount}.`;
    
//     // Provide format example based on requested count
//     formatExample = `
// EXAMPLE FORMAT (generate exactly ${validatedCount} test cases like this):

// Test Case 1:
// Test Case Name: [Name for first test case]
// Description: [Description for first test case]
// Precondition: [Precondition for first test case]
// Steps:
// 1 | [Step description] | [Expected result]
// 2 | [Step description] | [Expected result]

// Test Case 2:
// Test Case Name: [Name for second test case]
// Description: [Description for second test case]
// Precondition: [Precondition for second test case]
// Steps:
// 1 | [Step description] | [Expected result]
// 2 | [Step description] | [Expected result]

// ${validatedCount > 2 ? `... continue this exact pattern until Test Case ${validatedCount}` : ''}

// REMEMBER: You must create exactly ${validatedCount} numbered test cases.`;
//   } else {
//     countInstruction = "Generate 3-5 comprehensive test cases based on the complexity of the requirement.";
//     formatExample = `
// EXAMPLE FORMAT:

// Test Case 1:
// Test Case Name: [Descriptive name]
// Description: [What this test validates]
// Precondition: [Setup requirements]
// Steps:
// 1 | [Action to perform] | [Expected outcome]
// 2 | [Action to perform] | [Expected outcome]

// Test Case 2:
// Test Case Name: [Descriptive name]
// Description: [What this test validates]
// Precondition: [Setup requirements]
// Steps:
// 1 | [Action to perform] | [Expected outcome]
// 2 | [Action to perform] | [Expected outcome]

// (Continue for 3-5 test cases total)`;
//   }

//   return `
// You are an expert QA engineer with deep knowledge of manual and automation testing.

// Given the following requirement:
// "${rawPrompt}"

// TASK:
// 1. First, rewrite the requirement for clarity and professionalism. Label this section as "Improved Prompt".

// 2. ${countInstruction}

// ${formatExample}

// DETAILED REQUIREMENTS:
// - Each test case must be unique and test different aspects/scenarios
// - Cover positive scenarios, negative scenarios, and edge cases where applicable
// - Include boundary conditions and error handling
// - Make test steps clear, specific, and actionable
// - Ensure proper test case numbering (Test Case 1, Test Case 2, etc.)
// - Each test case should have meaningful names and descriptions
// - Test steps should follow the format: Step Number | Action Description | Expected Result

// ${validatedCount ? `FINAL REMINDER: Generate exactly ${validatedCount} test cases. Count them as you write to ensure accuracy.` : ''}

// Begin your response with "Improved Prompt:" followed by the test cases.
//   `.trim();
// };


export const buildStructuredPrompt = (rawPrompt, testCaseCount = null) => {
  // Auto-detect if user specified a number in their prompt
  const numberMatch = rawPrompt.match(/(\d+)\s*(test\s*cases?|tests?)/i);
  const detectedCount = numberMatch ? parseInt(numberMatch[1]) : null;
  
  // Use specified count, detected count, or default to flexible generation
  const finalCount = testCaseCount || detectedCount;
  
  // Validate count limits (reasonable upper limit for AI models)
  const maxAllowedCount = 25; // Reduced from 35 to prevent token issues
  let validatedCount = finalCount;
  
  if (finalCount && finalCount > maxAllowedCount) {
    console.warn(`⚠️ Requested ${finalCount} test cases, limiting to ${maxAllowedCount}`);
    validatedCount = maxAllowedCount;
  }
  
  let countInstruction = "";
  
  if (validatedCount) {
    // Be VERY explicit and concise about count
    countInstruction = `CRITICAL: Generate EXACTLY ${validatedCount} test cases. Count: 1, 2, 3... up to ${validatedCount}. NO MORE, NO LESS.`;
  } else {
    countInstruction = "Generate 3-5 comprehensive test cases.";
  }

  // Simplified format - removed verbose examples to save tokens
  return `
You are a QA expert. Generate test cases for: "${rawPrompt}"

RULES:
1. ${countInstruction}
2. Use this EXACT format for each test case:

Test Case N:
Test Case Name: [Clear name]
Description: [Brief description]
Precondition: [Setup needed]
Steps:
1 | [Action] | [Expected result]
2 | [Action] | [Expected result]

REQUIREMENTS:
- Number test cases 1, 2, 3, etc.
- Each test case must have real, detailed steps (NO placeholders)
- Cover positive, negative, and edge cases
- Be specific and actionable
- Steps format: Number | Action | Expected Result

${validatedCount ? `REMINDER: Create exactly ${validatedCount} test cases. Count them: 1, 2, 3... ${validatedCount}.` : ''}

Start with "Test Case 1:"
  `.trim();
};