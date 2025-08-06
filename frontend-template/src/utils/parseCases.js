

// src/utils/parseCases.js

export const extractImprovedPrompt = (lines) => {
  const start = lines.findIndex((line) =>
    line.toLowerCase().includes("improved prompt")
  );
  const end = lines.findIndex((line) =>
    line.toLowerCase().includes("test case")
  );

  if (start !== -1 && end !== -1 && end > start) {
    return lines.slice(start + 1, end).join("\n").trim();
  }
  return "No improved prompt found.";
};

export const extractStructuredTestCases = (lines) => {
  const result = [];
  let currentCase = null;

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.toLowerCase().startsWith("test case name:")) {
      if (currentCase) result.push(currentCase);

      currentCase = {
        name: trimmedLine.split(":").slice(1).join(":").trim() || "",
        description: "",
        precondition: "",
        steps: [],
      };
    } else if (trimmedLine.toLowerCase().startsWith("test case description:") || 
               trimmedLine.toLowerCase().startsWith("description:")) {
      if (currentCase) {
        currentCase.description = trimmedLine.split(":").slice(1).join(":").trim() || "";
      }
    } else if (trimmedLine.toLowerCase().startsWith("test case precondition:") ||
               trimmedLine.toLowerCase().startsWith("precondition:")) {
      if (currentCase) {
        currentCase.precondition = trimmedLine.split(":").slice(1).join(":").trim() || "";
      }
    } else if (trimmedLine.includes("|") && currentCase) {
      // Parse step format: "1 | Description | Expected Result"
      const parts = trimmedLine.split("|").map(s => s.trim());
      if (parts.length >= 3) {
        currentCase.steps.push(`${parts[0]} | ${parts[1]} | ${parts[2]}`);
      }
    }
  });

  if (currentCase) result.push(currentCase);
  return result;
};