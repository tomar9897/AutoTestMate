
export const buildStructuredPrompt = (rawPrompt, testCaseCount = null) => {
  // 1. Detect any explicit test-case count in the user’s raw prompt
  const numberMatch = rawPrompt.match(/(\d+)\s*(test\s*cases?|tests?)/i);
  const detectedCount = numberMatch ? parseInt(numberMatch[1]) : null;

  // 2. Determine final count (explicit parameter > detected > flexible)
  const maxAllowedCount = 25;
  let finalCount = testCaseCount || detectedCount;
  if (finalCount && finalCount > maxAllowedCount) {
    console.warn(`⚠️ Requested ${finalCount} test cases, limiting to ${maxAllowedCount}`);
    finalCount = maxAllowedCount;
  }

  // 3. Build count instruction
  const countInstruction = finalCount
    ? `⚠️ Generate **exactly ${finalCount}** functional test cases: numbered 1 through ${finalCount}, no more, no fewer.`
    : `🔍 Generate **3–7** comprehensive functional test cases (positive and negative flows).`;

  // 4. Build the structured prompt
  return `
You are **AutoTestMate**, a world-class QA Engineer and Prompt Architect. Your task is to create an **exhaustive suite of functional test cases** based on the user’s requirement. Do **not** include performance, security, or non-functional tests unless the user specifically requests them.

Original requirement:
---
"${rawPrompt}"
---

INSTRUCTIONS:
1. ${countInstruction}
2. Begin with a **Requirement Overview**: restate the requirement in clear, detailed QA language.
3. Then provide a structured **Test Case Plan** section:
   - Cover positive flows and negative error-handling scenarios.
   - Exclude performance, security, and other non-functional tests unless explicitly mentioned.
4. Use this exact Markdown format:

## Requirement Overview  
Provide 2–3 sentences summarizing the functionality to be tested, listing any assumptions.

## Test Case Plan  
Test cases must follow this template:

**Test Case 1: [Name]**  
**Objective:** Short description of the functionality being verified  
**Preconditions:** Setup, configuration, or data prerequisites  
**Test Steps:**  
1. **Action:** Step description  
   **Expected Result:** Precise expected outcome  
2. **Action:** …  
   **Expected Result:** …

**Test Case 2: [Name]**  
… repeat for each test

5. Label each test case sequentially (1, 2, 3…).  
6. Make steps extremely detailed—no placeholders.  
7. Ensure every functional requirement from the original prompt is tested.

Start output with “## Requirement Overview” and end with a “**Test Coverage Summary**” listing all covered functional areas.  
`.trim();
};
