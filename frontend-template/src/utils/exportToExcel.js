
// import * as XLSX from "xlsx";

// export const exportTestCasesToExcel = (testCases) => {
//   if (!testCases || testCases.length === 0) {
//     alert("No test cases to export!");
//     return;
//   }

//   const worksheetData = [];
  
//   // Add header row
//   worksheetData.push([
//     "Test Case #",
//     "Test Case Name", 
//     "Description",
//     "Precondition",
//     "Step #",
//     "Step Description", 
//     "Expected Result"
//   ]);

//   // Process each test case
//   testCases.forEach((testCase, index) => {
//     const testCaseNumber = index + 1;
//     const steps = testCase.steps || [];
    
//     if (steps.length === 0) {
//       // If no steps, add a row with just the test case info
//       worksheetData.push([
//         testCaseNumber,
//         testCase.name || "",
//         testCase.description || "",
//         testCase.precondition || "",
//         "",
//         "",
//         ""
//       ]);
//     } else {
//       // Add each step as a separate row
//       steps.forEach((step, stepIndex) => {
//         const [stepNum, stepDesc, expectedResult] = step.split("|").map(s => s.trim());
        
//         worksheetData.push([
//           stepIndex === 0 ? testCaseNumber : "", // Only show test case number on first step
//           stepIndex === 0 ? testCase.name || "" : "",
//           stepIndex === 0 ? testCase.description || "" : "",
//           stepIndex === 0 ? testCase.precondition || "" : "",
//           stepNum || "",
//           stepDesc || "",
//           expectedResult || ""
//         ]);
//       });
//     }
//   });

//   // Create worksheet
//   const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
//   // Set column widths
//   const columnWidths = [
//     { wch: 12 }, // Test Case #
//     { wch: 25 }, // Test Case Name
//     { wch: 35 }, // Description
//     { wch: 30 }, // Precondition
//     { wch: 8 },  // Step #
//     { wch: 40 }, // Step Description
//     { wch: 35 }  // Expected Result
//   ];
//   worksheet['!cols'] = columnWidths;

//   // Create workbook and add worksheet
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "Test Cases");

//   // Generate filename with timestamp
//   const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
//   const filename = `TestCases_${timestamp}.xlsx`;

//   // Save file
//   XLSX.writeFile(workbook, filename);
  
//   console.log(`Excel file exported: ${filename}`);
// };


// import * as XLSX from "xlsx";

// export const exportTestCasesToExcel = (testCases) => {
//   if (!testCases || testCases.length === 0) {
//     alert("No test cases to export!");
//     return;
//   }

//   const worksheetData = [];
  
//   // Add custom header row
//   const headers = [
//     "Name",
//     "Attachments", 
//     "Status",
//     "Type",
//     "Description",
//     "Precondition",
//     "Test step #",
//     "Test step description", 
//     "Test step expected result",
//     "Test Step Attachment",
//     "Priority",
//     "Execution Time",
//     "Sanity Testcase",
//     "Regression Testcase",
//     "Automatable",
//     "Labels"
//   ];
//   worksheetData.push(headers);

//   // Process each test case
//   testCases.forEach((testCase, index) => {
//     const steps = testCase.steps || [];
    
//     if (steps.length === 0) {
//       // If no steps, add a row with just the test case info
//       worksheetData.push([
//         testCase.name || "",        // Name
//         "",                         // Attachments
//         "",                         // Status
//         "",                         // Type
//         testCase.description || "", // Description
//         testCase.precondition || "",// Precondition
//         "",                         // Test step #
//         "",                         // Test step description
//         "",                         // Test step expected result
//         "",                         // Test Step Attachment
//         "",                         // Priority
//         "",                         // Execution Time
//         "",                         // Sanity Testcase
//         "",                         // Regression Testcase
//         "",                         // Automatable
//         ""                          // Labels
//       ]);
//     } else {
//       // Add each step as a separate row
//       steps.forEach((step, stepIndex) => {
//         const [stepNum, stepDesc, expectedResult] = step.split("|").map(s => s.trim());
        
//         worksheetData.push([
//           stepIndex === 0 ? testCase.name || "" : "",        // Name (only on first step)
//           "",                                                 // Attachments
//           "",                                                 // Status
//           "",                                                 // Type
//           stepIndex === 0 ? testCase.description || "" : "", // Description (only on first step)
//           stepIndex === 0 ? testCase.precondition || "" : "",// Precondition (only on first step)
//           stepNum || "",                                      // Test step #
//           stepDesc || "",                                     // Test step description
//           expectedResult || "",                               // Test step expected result
//           "",                                                 // Test Step Attachment
//           "",                                                 // Priority
//           "",                                                 // Execution Time
//           "",                                                 // Sanity Testcase
//           "",                                                 // Regression Testcase
//           "",                                                 // Automatable
//           ""                                                  // Labels
//         ]);
//       });
//     }
//   });

//   // Create worksheet
//   const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
//   // Apply yellow highlight to header row
//   headers.forEach((header, colIndex) => {
//     const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
//     if (!worksheet[cellAddress]) {
//       worksheet[cellAddress] = { t: "s", v: header };
//     }
//     worksheet[cellAddress].s = {
//       fill: { fgColor: { rgb: "FFFF00" } }, // Yellow background
//       font: { bold: true }                   // Bold text
//     };
//   });
  
//   // Set column widths
//   const columnWidths = [
//     { wch: 25 }, // Name
//     { wch: 15 }, // Attachments
//     { wch: 12 }, // Status
//     { wch: 12 }, // Type
//     { wch: 35 }, // Description
//     { wch: 30 }, // Precondition
//     { wch: 12 }, // Test step #
//     { wch: 40 }, // Test step description
//     { wch: 35 }, // Test step expected result
//     { wch: 18 }, // Test Step Attachment
//     { wch: 12 }, // Priority
//     { wch: 15 }, // Execution Time
//     { wch: 15 }, // Sanity Testcase
//     { wch: 18 }, // Regression Testcase
//     { wch: 15 }, // Automatable
//     { wch: 15 }  // Labels
//   ];
//   worksheet['!cols'] = columnWidths;

//   // Create workbook and add worksheet
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "Test Cases");

//   // Generate filename with timestamp
//   const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
//   const filename = `TestCases_${timestamp}.xlsx`;

//   // Save file
//   XLSX.writeFile(workbook, filename);
  
//   console.log(`Excel file exported: ${filename}`);
// };



import * as XLSX from "xlsx";

export const exportTestCasesToExcel = (testCases) => {
  if (!testCases || testCases.length === 0) {
    alert("No test cases to export!");
    return;
  }

  const worksheetData = [];
  
  // Add custom header row
  const headers = [
    "Name",
    "Attachments", 
    "Status",
    "Type",
    "Description",
    "Precondition",
    "Test step #",
    "Test step description", 
    "Test step expected result",
    "Test Step Attachment",
    "Priority",
    "Execution Time",
    "Sanity Testcase",
    "Regression Testcase",
    "Automatable",
    "Labels"
  ];
  worksheetData.push(headers);

  // Store merge ranges for later processing
  const mergeRanges = [];
  let currentRow = 1; // Start from row 1 (0 is header)

  // Process each test case
  testCases.forEach((testCase, index) => {
    const steps = testCase.steps || [];
    
    if (steps.length === 0) {
      // If no steps, add a row with just the test case info
      worksheetData.push([
        testCase.name || "",        // Name
        "",                         // Attachments
        "New",                      // Status (default)
        "Manual",                   // Type (default)
        testCase.description || "", // Description
        testCase.precondition || "",// Precondition
        "",                         // Test step #
        "",                         // Test step description
        "",                         // Test step expected result
        "",                         // Test Step Attachment
        "Medium",                   // Priority (default)
        "15",                       // Execution Time (default)
        "Yes",                      // Sanity Testcase (default)
        "Yes",                      // Regression Testcase (default)
        "",                         // Automatable
        ""                          // Labels
      ]);
      currentRow++;
    } else {
      const startRow = currentRow;
      
      // Add each step as a separate row
      steps.forEach((step, stepIndex) => {
        const [stepNum, stepDesc, expectedResult] = step.split("|").map(s => s.trim());
        
        worksheetData.push([
          stepIndex === 0 ? testCase.name || "" : "",        // Name (only on first step)
          "",                                                 // Attachments
          stepIndex === 0 ? "New" : "",                      // Status (only on first step)
          stepIndex === 0 ? "Manual" : "",                   // Type (only on first step)
          stepIndex === 0 ? testCase.description || "" : "", // Description (only on first step)
          stepIndex === 0 ? testCase.precondition || "" : "",// Precondition (only on first step)
          stepNum || "",                                      // Test step #
          stepDesc || "",                                     // Test step description
          expectedResult || "",                               // Test step expected result
          "",                                                 // Test Step Attachment
          stepIndex === 0 ? "Medium" : "",                   // Priority (only on first step)
          stepIndex === 0 ? "15" : "",                       // Execution Time (only on first step)
          stepIndex === 0 ? "Yes" : "",                      // Sanity Testcase (only on first step)
          stepIndex === 0 ? "Yes" : "",                      // Regression Testcase (only on first step)
          "",                                                 // Automatable
          ""                                                  // Labels
        ]);
        currentRow++;
      });
      
      const endRow = currentRow - 1;
      
      // Add merge ranges for all columns except step columns (6, 7, 8 are Test step #, description, expected result)
      if (steps.length > 1) {
        // Columns to merge: 0-5 and 9-15 (skip 6,7,8 which are the step columns)
        const columnsToMerge = [0, 1, 2, 3, 4, 5, 9, 10, 11, 12, 13, 14, 15];
        
        columnsToMerge.forEach(colIndex => {
          mergeRanges.push({
            s: { r: startRow, c: colIndex },
            e: { r: endRow, c: colIndex }
          });
        });
      }
    }
  });

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Apply merges
  if (mergeRanges.length > 0) {
    worksheet['!merges'] = mergeRanges;
  }
  
  // Apply yellow highlight to header row
  headers.forEach((header, colIndex) => {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
    if (!worksheet[cellAddress]) {
      worksheet[cellAddress] = { t: "s", v: header };
    }
    worksheet[cellAddress].s = {
      fill: { fgColor: { rgb: "FFFF00" } }, // Yellow background
      font: { bold: true }                   // Bold text
    };
  });
  
  // Set column widths
  const columnWidths = [
    { wch: 25 }, // Name
    { wch: 15 }, // Attachments
    { wch: 12 }, // Status
    { wch: 12 }, // Type
    { wch: 35 }, // Description
    { wch: 30 }, // Precondition
    { wch: 12 }, // Test step #
    { wch: 40 }, // Test step description
    { wch: 35 }, // Test step expected result
    { wch: 18 }, // Test Step Attachment
    { wch: 12 }, // Priority
    { wch: 15 }, // Execution Time
    { wch: 15 }, // Sanity Testcase
    { wch: 18 }, // Regression Testcase
    { wch: 15 }, // Automatable
    { wch: 15 }  // Labels
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook and add worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Test Cases");

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `TestCases_${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, filename);
  
  console.log(`Excel file exported: ${filename}`);
};