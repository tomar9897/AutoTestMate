
import * as XLSX from "xlsx";
import jsPDF from 'jspdf';
import 'jspdf-autotable';


const parseStepData = (step) => {
  if (typeof step === 'string') {
    return step.split('|').map(s => s.trim());
  }
  if (typeof step === 'object' && step !== null) {
    return [
      step.stepNum || '',
      step.stepDesc || '',
      step.expectedResult || ''
    ];
  }
  return ['', '', ''];
};

// Excel export function 
export const exportTestCasesToExcel = (testCases) => {
  if (!testCases || testCases.length === 0) {
    alert("No test cases to export!");
    return;
  }

  console.log("📊 Starting Excel export...");
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
        testCase.name || "", // Name
        "", // Attachments
        "New", // Status (default)
        "Manual", // Type (default)
        testCase.description || "", // Description
        testCase.precondition || "", // Precondition
        "", // Test step #
        "", // Test step description
        "", // Test step expected result
        "", // Test Step Attachment
        "Medium", // Priority (default)
        "15", // Execution Time (default)
        "Yes", // Sanity Testcase (default)
        "Yes", // Regression Testcase (default)
        "", // Automatable
        "" // Labels
      ]);
      currentRow++;
    } else {
      const startRow = currentRow;
      
      // Add each step as a separate row
      steps.forEach((step, stepIndex) => {
        const [stepNum, stepDesc, expectedResult] = parseStepData(step);

        worksheetData.push([
          stepIndex === 0 ? testCase.name || "" : "", // Name (only on first step)
          "", // Attachments
          stepIndex === 0 ? "New" : "", // Status (only on first step)
          stepIndex === 0 ? "Manual" : "", // Type (only on first step)
          stepIndex === 0 ? testCase.description || "" : "", // Description (only on first step)
          stepIndex === 0 ? testCase.precondition || "" : "", // Precondition (only on first step)
          stepNum || "", // Test step #
          stepDesc || "", // Test step description
          expectedResult || "", // Test step expected result
          "", // Test Step Attachment
          stepIndex === 0 ? "Medium" : "", // Priority (only on first step)
          stepIndex === 0 ? "15" : "", // Execution Time (only on first step)
          stepIndex === 0 ? "Yes" : "", // Sanity Testcase (only on first step)
          stepIndex === 0 ? "Yes" : "", // Regression Testcase (only on first step)
          "", // Automatable
          "" // Labels
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
      font: { bold: true } // Bold text
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
    { wch: 15 } // Labels
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
  console.log(`✅ Excel file exported: ${filename}`);
};

// ENHANCED: Export to PDF function
export const exportTestCasesToPDF = (testCases) => {
  if (!testCases || testCases.length === 0) {
    alert("No test cases to export!");
    return;
  }

  console.log("📄 Starting PDF export...");
  
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Test Case Documentation', pageWidth / 2, 20, { align: 'center' });
    
    // Subtitle
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, 30, { align: 'center' });
    doc.text(`Total Test Cases: ${testCases.length}`, pageWidth / 2, 38, { align: 'center' });
    
    let yPosition = 50;
    
    testCases.forEach((testCase, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Test Case Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const tcName = testCase.name || `Test Case ${index + 1}`;
      doc.text(`Test Case ${index + 1}: ${tcName}`, 15, yPosition);
      yPosition += 10;
      
      // Description
      if (testCase.description) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Description:', 15, yPosition);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(testCase.description, pageWidth - 30);
        doc.text(descLines, 15, yPosition + 6);
        yPosition += 6 + (descLines.length * 5);
      }
      
      // Precondition
      if (testCase.precondition) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Precondition:', 15, yPosition);
        doc.setFont('helvetica', 'normal');
        const preLines = doc.splitTextToSize(testCase.precondition, pageWidth - 30);
        doc.text(preLines, 15, yPosition + 6);
        yPosition += 6 + (preLines.length * 5);
      }
      
      // Steps Table
      if (testCase.steps && testCase.steps.length > 0) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Test Steps:', 15, yPosition);
        yPosition += 8;
        
        const tableData = testCase.steps.map((step, stepIndex) => {
          const [stepNum, stepDesc, expectedResult] = parseStepData(step);
          return [
            stepNum || (stepIndex + 1).toString(),
            stepDesc || '',
            expectedResult || ''
          ];
        });
        
        doc.autoTable({
          startY: yPosition,
          head: [['Step', 'Action', 'Expected Result']],
          body: tableData,
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [66, 139, 202], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] },
          margin: { left: 15, right: 15 },
          tableWidth: pageWidth - 30,
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: (pageWidth - 60) * 0.45 },
            2: { cellWidth: (pageWidth - 60) * 0.45 }
          }
        });
        
        yPosition = doc.lastAutoTable.finalY + 15;
      } else {
        yPosition += 10;
      }
      
      // Separator line
      if (index < testCases.length - 1) {
        doc.setDrawColor(200, 200, 200);
        doc.line(15, yPosition, pageWidth - 15, yPosition);
        yPosition += 10;
      }
    });
    
    // Save the PDF
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    doc.save(`TestCases_${timestamp}.pdf`);
    console.log(`✅ PDF file exported: TestCases_${timestamp}.pdf`);
    
  } catch (error) {
    console.error('❌ PDF export failed:', error);
    alert('Failed to export PDF file. Please try again.');
  }
};

// ENHANCED: Export to CSV function
export const exportTestCasesToCSV = (testCases) => {
  if (!testCases || testCases.length === 0) {
    alert("No test cases to export!");
    return;
  }

  console.log("📈 Starting CSV export...");

  try {
    const csvData = [];
    
    // Headers
    csvData.push([
      'Test Case #', 
      'Name', 
      'Description', 
      'Precondition', 
      'Step #', 
      'Step Action', 
      'Expected Result'
    ]);
    
    testCases.forEach((testCase, index) => {
      const steps = testCase.steps || [{ stepNum: '1', stepDesc: 'No steps defined', expectedResult: 'N/A' }];
      
      steps.forEach((step, stepIndex) => {
        const [stepNum, stepDesc, expectedResult] = parseStepData(step);
        csvData.push([
          index + 1,
          stepIndex === 0 ? testCase.name || '' : '', // Only show name on first step
          stepIndex === 0 ? testCase.description || '' : '',
          stepIndex === 0 ? testCase.precondition || '' : '',
          stepNum || (stepIndex + 1),
          stepDesc || '',
          expectedResult || ''
        ]);
      });
    });
    
    // Convert to CSV string with proper escaping
    const csvString = csvData.map(row => 
      row.map(cell => {
        const cellStr = String(cell || '');
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n') || cellStr.includes('\r')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
    
    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.setAttribute('download', `TestCases_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
    
    console.log(`✅ CSV file exported: TestCases_${timestamp}.csv`);
    
  } catch (error) {
    console.error('❌ CSV export failed:', error);
    alert('Failed to export CSV file. Please try again.');
  }
};

// ENHANCED: Batch export function with better error handling
export const exportAllFormats = async (testCases) => {
  if (!testCases || testCases.length === 0) {
    alert("No test cases to export!");
    return;
  }

  console.log("📦 Starting batch export (all formats)...");

  const results = { success: 0, total: 3, errors: [] };

  try {
    exportTestCasesToExcel(testCases);
    results.success++;
    console.log("✅ Excel export completed");
  } catch (error) {
    console.error("❌ Excel export failed:", error);
    results.errors.push("Excel export failed");
  }

  try {
    exportTestCasesToPDF(testCases);
    results.success++;
    console.log("✅ PDF export completed");
  } catch (error) {
    console.error("❌ PDF export failed:", error);
    results.errors.push("PDF export failed");
  }

  try {
    exportTestCasesToCSV(testCases);
    results.success++;
    console.log("✅ CSV export completed");
  } catch (error) {
    console.error("❌ CSV export failed:", error);
    results.errors.push("CSV export failed");
  }

  // Show result to user
  if (results.success === results.total) {
    alert("🎉 All formats exported successfully! Check your downloads folder.");
  } else if (results.success > 0) {
    alert(`⚠️ ${results.success}/${results.total} formats exported successfully.\n\nErrors: ${results.errors.join(', ')}\n\nCheck your downloads folder for completed exports.`);
  } else {
    alert("❌ All exports failed. Please try individual formats.");
  }

  console.log(`📦 Batch export completed: ${results.success}/${results.total} successful`);
};

