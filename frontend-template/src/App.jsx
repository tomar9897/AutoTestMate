import { useState, useRef, useCallback, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import PromptInput from "./components/PromptInput";
import ImprovedPromptEditor from "./components/ImprovedPromptEditor.jsx";
import CustomLoaders from "./components/CustomLoaders1";
import Onboarding from "./components/Onboarding";
import { exportTestCasesToExcel } from "./utils/exportToExcel";

function App() {
  const [stage, setStage] = useState("input");
  const [loadingStage, setLoadingStage] = useState("");
  const [originalPrompt, setOriginalPrompt] = useState("");
  const [improvedPrompt, setImprovedPrompt] = useState("");
  const [testCases, setTestCases] = useState([]);
  const [selectedEngine, setSelectedEngine] = useState("gemini");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [testCaseCount, setTestCaseCount] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Check if user has seen onboarding before
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    return !hasSeenOnboarding;
  });
  
  // Undo/Redo functionality -- useless, can remove it
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  });

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  // Helper function to convert pipe strings to step objects
  const parseStepString = (stepString) => {
    if (typeof stepString === 'object') return stepString;
    
    const parts = stepString.split('|');
    return {
      stepNum: parts[0] || '',
      stepDesc: parts[1] || '',
      expectedResult: parts[2] || ''
    };
  };

  // Helper function to convert step objects to pipe strings for export
  const stepToString = (step) => {
    if (typeof step === 'string') return step;
    return `${step.stepNum || ''} | ${step.stepDesc || ''} | ${step.expectedResult || ''}`;
  };

  // Convert test cases to ensure step objects format
  const normalizeTestCases = (cases) => {
    return cases.map(tc => ({
      ...tc,
      steps: (tc.steps || []).map(step => parseStepString(step))
    }));
  };

  // Save state to history for undo/redo
  const saveToHistory = useCallback((newTestCases) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(newTestCases)));
      return newHistory.slice(-50);
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const previousState = history[historyIndex - 1];
      setTestCases(JSON.parse(JSON.stringify(previousState)));
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const nextState = history[historyIndex + 1];
      setTestCases(JSON.parse(JSON.stringify(nextState)));
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        handleRedo();
      }
    }
  }, [handleUndo, handleRedo]);

  //event listener for keyboard shortcut
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Validate test case count
  const validateTestCaseCount = (count) => {
    const numCount = parseInt(count);
    if (isNaN(numCount) || numCount < 1) {
      return null;
    }
    if (numCount > 25) {
      alert("Maximum 25 test cases allowed. Setting to 25.");
      return 25;
    }
    return numCount;
  };

  // New Chat btn functionality
  const handleNewChat = () => {
    setStage("input");
    setTestCases([]);
    setOriginalPrompt("");
    setImprovedPrompt("");
    setHistory([]);
    setHistoryIndex(-1);
    setTestCaseCount("");
  };

  const handlePromptSubmit = async (prompt) => {
    setOriginalPrompt(prompt);
    setStage("loading");
    setLoadingStage("improving");

    try {
      const improveResponse = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      if (!improveResponse.ok) {
        throw new Error(`HTTP error! status: ${improveResponse.status}`);
      }

      const improveData = await improveResponse.json();
      const improved = improveData.improvedPrompt;

      setImprovedPrompt(improved);
      setStage("review");
      setLoadingStage("");
    } catch (err) {
      console.error("❌ Error improving prompt:", err);
      setImprovedPrompt(prompt);
      setStage("review");
      setLoadingStage("");
    }
  };

  const handleImprovedPromptConfirm = async (finalPrompt) => {
    const validatedCount = testCaseCount ? validateTestCaseCount(testCaseCount) : null;
    
    setStage("loading");
    setLoadingStage("generating");
    setImprovedPrompt(finalPrompt);

    try {
      const requestBody = { 
        improvedPrompt: finalPrompt, 
        engine: selectedEngine,
        testCaseCount: validatedCount
      };

      const testCasesResponse = await fetch("/api/ai/generate-testcases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!testCasesResponse.ok) {
        throw new Error(`HTTP error! status: ${testCasesResponse.status}`);
      }

      const testCasesData = await testCasesResponse.json();
      
      let structuredTestCases = [];
      if (testCasesData.testCases && Array.isArray(testCasesData.testCases)) {
        structuredTestCases = testCasesData.testCases;
      } else if (testCasesData.testCases && typeof testCasesData.testCases === 'object') {
        structuredTestCases = testCasesData.testCases.testCases || [];
      } else if (testCasesData.raw) {
        console.warn("⚠️ Received raw response, creating empty test case template");
        structuredTestCases = [{
          name: "Generated Test Case",
          description: "Please edit this test case based on the raw response",
          precondition: "",
          steps: [{ stepNum: "1", stepDesc: "Review generated content", expectedResult: "Update accordingly" }]
        }];
      }

      const normalizedCases = normalizeTestCases(structuredTestCases);
      setTestCases(normalizedCases);
      setStage("result");
      setLoadingStage("");

      setHistory([JSON.parse(JSON.stringify(normalizedCases))]);
      setHistoryIndex(0);

      const chat = {
        id: Date.now(),
        prompt: finalPrompt,
        improvedPrompt: finalPrompt,
        testCases: normalizedCases.map(tc => ({
          ...tc,
          steps: tc.steps.map(stepToString)
        })),
        name: `${normalizedCases.length} Test Cases - ${new Date().toLocaleDateString()}`,
        timestamp: new Date().toISOString(),
      };

      setChatHistory((prev) => {
        const updated = [chat, ...prev];
        localStorage.setItem("chatHistory", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("❌ Error generating test cases:", err);
      const fallbackCases = [{
        name: "Error - Manual Entry Required",
        description: "There was an error generating test cases. Please enter manually.",
        precondition: "",
        steps: [{ stepNum: "1", stepDesc: "Enter step description", expectedResult: "Enter expected result" }]
      }];
      setTestCases(fallbackCases);
      setHistory([JSON.parse(JSON.stringify(fallbackCases))]);
      setHistoryIndex(0);
      setStage("result");
      setLoadingStage("");
    }
  };

  const loadChatFromHistory = (chat) => {
    setOriginalPrompt(chat.prompt || "");
    setImprovedPrompt(chat.improvedPrompt || "");
    const cases = Array.isArray(chat.testCases) ? chat.testCases : [];
    const normalizedCases = normalizeTestCases(cases);
    setTestCases(normalizedCases);
    setHistory([JSON.parse(JSON.stringify(normalizedCases))]);
    setHistoryIndex(0);
    setStage("result");
  };

  const updateChatName = (chatId, newName) => {
    setChatHistory((prev) => {
      const updated = prev.map(chat => 
        chat.id === chatId ? { ...chat, name: newName } : chat
      );
      localStorage.setItem("chatHistory", JSON.stringify(updated));
      return updated;
    });
  };

  const handleImprovedPromptChange = (newPrompt) => {
    setImprovedPrompt(newPrompt);
  };

  const regenerateTestCases = async () => {
    if (!improvedPrompt.trim()) {
      alert("Please enter an improved prompt first!");
      return;
    }

    const validatedCount = testCaseCount ? validateTestCaseCount(testCaseCount) : null;
    
    setStage("loading");
    setLoadingStage("generating");
    
    try {
      const requestBody = { 
        improvedPrompt, 
        engine: selectedEngine,
        testCaseCount: validatedCount
      };

      const testCasesResponse = await fetch("/api/ai/generate-testcases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!testCasesResponse.ok) {
        throw new Error(`HTTP error! status: ${testCasesResponse.status}`);
      }

      const testCasesData = await testCasesResponse.json();
      
      let structuredTestCases = [];
      if (testCasesData.testCases && Array.isArray(testCasesData.testCases)) {
        structuredTestCases = testCasesData.testCases;
      } else if (testCasesData.testCases && typeof testCasesData.testCases === 'object') {
        structuredTestCases = testCasesData.testCases.testCases || [];
      } else if (testCasesData.raw) {
        console.warn("⚠️ Received raw response, creating empty test case template");
        structuredTestCases = [{
          name: "Generated Test Case",
          description: "Please edit this test case based on the raw response",
          precondition: "",
          steps: [{ stepNum: "1", stepDesc: "Review generated content", expectedResult: "Update accordingly" }]
        }];
      }
      
      const normalizedCases = normalizeTestCases(structuredTestCases);
      setTestCases(normalizedCases);
      setHistory([JSON.parse(JSON.stringify(normalizedCases))]);
      setHistoryIndex(0);
      setStage("result");
      setLoadingStage("");
    } catch (err) {
      console.error("❌ Error regenerating test cases:", err);
      const fallbackCases = [{
        name: "Error - Manual Entry Required",
        description: "There was an error regenerating test cases. Please enter manually.",
        precondition: "",
        steps: [{ stepNum: "1", stepDesc: "Enter step description", expectedResult: "Enter expected result" }]
      }];
      setTestCases(fallbackCases);
      setHistory([JSON.parse(JSON.stringify(fallbackCases))]);
      setHistoryIndex(0);
      setStage("result");
      setLoadingStage("");
    }
  };

  // Enhanced update functions with undo support
  const updateTestCases = (newTestCases) => {
    setTestCases(newTestCases);
    saveToHistory(newTestCases);
  };

  const updateTestCaseField = (tcIndex, field, value) => {
    const updated = [...testCases];
    updated[tcIndex][field] = value;
    updateTestCases(updated);
  };

  const updateTestStep = (tcIndex, stepIndex, field, value) => {
    const updated = [...testCases];
    if (!updated[tcIndex].steps) {
      updated[tcIndex].steps = [];
    }
    if (!updated[tcIndex].steps[stepIndex]) {
      updated[tcIndex].steps[stepIndex] = { stepNum: '', stepDesc: '', expectedResult: '' };
    }
    updated[tcIndex].steps[stepIndex][field] = value;
    updateTestCases(updated);
  };

  const addTestStep = (tcIndex) => {
    const updated = [...testCases];
    if (!updated[tcIndex].steps) {
      updated[tcIndex].steps = [];
    }
    const stepNum = (updated[tcIndex].steps.length + 1).toString();
    updated[tcIndex].steps.push({
      stepNum: stepNum,
      stepDesc: '',
      expectedResult: ''
    });
    updateTestCases(updated);
  };

  const deleteTestStep = (tcIndex, stepIndex) => {
    const updated = [...testCases];
    updated[tcIndex].steps.splice(stepIndex, 1);
    updateTestCases(updated);
  };

  const deleteTestCase = (tcIndex) => {
    const updated = testCases.filter((_, i) => i !== tcIndex);
    updateTestCases(updated);
  };

  const addNewTestCase = () => {
    const newTestCase = {
      name: "",
      description: "",
      precondition: "",
      steps: [{
        stepNum: "1",
        stepDesc: "",
        expectedResult: ""
      }],
    };
    updateTestCases([...testCases, newTestCase]);
  };

  // Drag and Drop functionality
  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    const tcIndex = parseInt(source.droppableId.split('-')[1]);
    
    if (source.index === destination.index) return;

    const updated = [...testCases];
    const steps = [...updated[tcIndex].steps];
    
    const [reorderedStep] = steps.splice(source.index, 1);
    steps.splice(destination.index, 0, reorderedStep);
    
    updated[tcIndex].steps = steps;
    updateTestCases(updated);
  };

  // Export functionality
  const handleExportClick = () => {
    setShowExportModal(true);
  };

  const handleExport = (format) => {
    const exportCases = testCases.map(tc => ({
      ...tc,
      steps: tc.steps.map(stepToString)
    }));
    
    exportTestCasesToExcel(exportCases);
    setShowExportModal(false);
  };

  // Export Modal Component
  const ExportModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">Export Test Cases</h3>
        <p className="text-gray-600 mb-6">Choose your preferred export format:</p>
        
        <div className="space-y-3">
          <button
            onClick={() => handleExport('excel')}
            className="w-full p-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center"
          >
            <span className="text-2xl mr-3">📊</span>
            <div>
              <div className="font-semibold">Excel (.xlsx)</div>
              <div className="text-sm text-gray-500">Formatted spreadsheet with styling</div>
            </div>
          </button>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowExportModal(false)}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen">
      {/* Onboarding Animation */}
      {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
      
      <Navbar
        selectedEngine={selectedEngine}
        setSelectedEngine={setSelectedEngine}
        onNewChat={stage !== "input" ? handleNewChat : null}
      />
      <div className="flex flex-1 overflow-hidden">
        {!sidebarCollapsed && (
          <Sidebar 
            chatHistory={chatHistory} 
            onLoadChat={loadChatFromHistory}
            onUpdateChatName={updateChatName}
            onToggleSidebar={() => setSidebarCollapsed(true)}
          />
        )}
        
        {sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="fixed top-20 left-4 z-50 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
            title="Show Chat History"
          >
            📂
          </button>
        )}

        <main className={`flex-1 bg-gray-50 overflow-y-auto p-6 transition-all duration-300 ${sidebarCollapsed ? 'ml-0' : ''}`}>
          {stage === "input" && (
            <div className="space-y-4">
              <PromptInput onSubmit={handlePromptSubmit} />
              
              {/* Test Case Count Input */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🔢 Number of Test Cases (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  placeholder="Enter number (1-25) or leave empty for AI to decide"
                  value={testCaseCount}
                  onChange={(e) => setTestCaseCount(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ✨ <strong>Examples:</strong> Enter "2" for 2 test cases, "10" for 10 test cases, up to 25 maximum
                </p>
              </div>
            </div>
          )}

          {stage === "loading" && (
            <CustomLoaders stage={loadingStage} />
          )}

          {stage === "review" && (
            <ImprovedPromptEditor
              improvedPrompt={improvedPrompt}
              onConfirm={handleImprovedPromptConfirm}
            />
          )}

          {stage === "result" && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="space-y-6">
                {/* Undo/Redo Controls */}
                <div className="flex justify-end space-x-2 mb-4">
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    title="Undo (Ctrl+Z)"
                  >
                    ↶ Undo
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    title="Redo (Ctrl+Y)"
                  >
                    ↷ Redo
                  </button>
                </div>

                {/* Original Prompt */}
                <div className="bg-white border-l-4 border-blue-400 shadow-md p-4 rounded mb-4">
                  <h3 className="text-lg font-bold text-blue-700 mb-2">
                    📝 Original Prompt
                  </h3>
                  <pre className="whitespace-pre-wrap text-gray-700 bg-gray-50 p-3 rounded">
                    {originalPrompt}
                  </pre>
                </div>

                {/* Improved Prompt - Editable */}
                <div className="bg-white border-l-4 border-green-500 shadow-md p-4 rounded">
                  <h3 className="text-lg font-bold text-green-700 mb-2">
                    ✍️ Improved Prompt
                  </h3>
                  <textarea
                    value={improvedPrompt}
                    onChange={(e) => handleImprovedPromptChange(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded bg-gray-50 text-gray-700 min-h-[100px] focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter improved prompt here..."
                  />
                  
                  {/* Test Case Count for Regeneration */}
                  <div className="mt-3 flex items-center space-x-4">
                    <input
                      type="number"
                      min="1"
                      max="25"
                      placeholder="# of test cases (1-25)"
                      value={testCaseCount}
                      onChange={(e) => setTestCaseCount(e.target.value)}
                      className="w-40 p-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 text-sm"
                    />
                    <button
                      onClick={regenerateTestCases}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                      🔄 Regenerate Test Cases
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-indigo-600">
                    ✅ Generated Test Cases ({testCases.length})
                  </h2>
                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                    onClick={handleExportClick}
                    disabled={testCases.length === 0}
                  >
                    <span>📤</span>
                    <span>Export to Excel</span>
                  </button>
                </div>

                {testCases.length === 0 ? (
                  <div className="bg-white p-6 rounded shadow border border-gray-200 text-center">
                    <p className="text-gray-500 mb-4">No test cases generated yet.</p>
                    <button
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                      onClick={addNewTestCase}
                    >
                      ➕ Add Your First Test Case
                    </button>
                  </div>
                ) : (
                  testCases.map((tc, tcIndex) => (
                    <div
                      key={`testcase-${tcIndex}`}
                      className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4"
                    >
                      {/* Test Case Header */}
                      <div className="flex justify-between items-center border-b pb-3">
                        <h3 className="text-xl font-bold text-indigo-700">
                          🧪 Test Case #{tcIndex + 1}
                        </h3>
                        <button
                          onClick={() => deleteTestCase(tcIndex)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                        >
                          🗑️ Delete
                        </button>
                      </div>

                      {/* Test Case Information */}
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            📋 Test Case Name
                          </label>
                          <textarea
                            placeholder="Enter test case name"
                            value={tc.name || ""}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 min-h-[2.5rem] resize-y"
                            onChange={(e) => updateTestCaseField(tcIndex, 'name', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            📝 Description
                          </label>
                          <textarea
                            placeholder="Enter test case description"
                            value={tc.description || ""}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 resize-y"
                            rows="3"
                            onChange={(e) => updateTestCaseField(tcIndex, 'description', e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            ⚙️ Precondition
                          </label>
                          <textarea
                            placeholder="Enter preconditions"
                            value={tc.precondition || ""}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50 resize-y"
                            rows="2"
                            onChange={(e) => updateTestCaseField(tcIndex, 'precondition', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Test Steps Table with Drag and Drop */}
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-lg font-semibold text-gray-800">
                            📋 Test Steps
                          </h4>
                          <button
                            onClick={() => addTestStep(tcIndex)}
                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                          >
                            ➕ Add Step
                          </button>
                        </div>
                        
                        <div className="overflow-x-auto">
                          <table className="min-w-full border border-gray-300 rounded-lg table-fixed">
                            <thead className="bg-indigo-100">
                              <tr>
                                <th className="w-12 px-2 py-3 text-center border-r border-gray-300 font-semibold text-gray-700">
                                  ⋮⋮
                                </th>
                                <th className="w-16 px-2 py-3 text-center border-r border-gray-300 font-semibold text-gray-700">
                                  Step #
                                </th>
                                <th className="px-4 py-3 text-left border-r border-gray-300 font-semibold text-gray-700">
                                  Step Description
                                </th>
                                <th className="px-4 py-3 text-left border-r border-gray-300 font-semibold text-gray-700">
                                  Expected Result
                                </th>
                                <th className="w-20 px-2 py-3 text-center font-semibold text-gray-700">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <Droppable droppableId={`steps-${tcIndex}`}>
                              {(provided) => (
                                <tbody {...provided.droppableProps} ref={provided.innerRef}>
                                  {tc.steps && tc.steps.length > 0 ? (
                                    tc.steps.map((step, stepIndex) => (
                                      <Draggable 
                                        key={`tc-${tcIndex}-step-${stepIndex}`} 
                                        draggableId={`tc-${tcIndex}-step-${stepIndex}`} 
                                        index={stepIndex}
                                      >
                                        {(provided, snapshot) => (
                                          <tr
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`border-b hover:bg-gray-50 ${
                                              snapshot.isDragging ? 'bg-blue-50 shadow-lg' : ''
                                            }`}
                                          >
                                            <td className="w-12 px-2 py-2 border-r border-gray-300 text-center">
                                              <div
                                                {...provided.dragHandleProps}
                                                className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 select-none"
                                              >
                                                ⋮⋮
                                              </div>
                                            </td>
                                            <td className="w-16 px-2 py-2 border-r border-gray-300">
                                              <textarea
                                                value={step.stepNum || ''}
                                                placeholder={`${stepIndex + 1}`}
                                                className="w-full border p-1 rounded focus:ring-1 focus:ring-indigo-500 text-center min-h-[2rem] resize-y text-sm"
                                                onChange={(e) => updateTestStep(tcIndex, stepIndex, 'stepNum', e.target.value)}
                                              />
                                            </td>
                                            <td className="px-3 py-2 border-r border-gray-300">
                                              <textarea
                                                value={step.stepDesc || ''}
                                                placeholder="Enter step description"
                                                className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 min-h-[2rem] resize-y"
                                                onChange={(e) => updateTestStep(tcIndex, stepIndex, 'stepDesc', e.target.value)}
                                              />
                                            </td>
                                            <td className="px-3 py-2 border-r border-gray-300">
                                              <textarea
                                                value={step.expectedResult || ''}
                                                placeholder="Enter expected result"
                                                className="w-full border p-2 rounded focus:ring-1 focus:ring-indigo-500 min-h-[2rem] resize-y"
                                                onChange={(e) => updateTestStep(tcIndex, stepIndex, 'expectedResult', e.target.value)}
                                              />
                                            </td>
                                            <td className="w-20 px-2 py-2 text-center">
                                              <button
                                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                                                onClick={() => deleteTestStep(tcIndex, stepIndex)}
                                                title="Delete step"
                                              >
                                                ❌
                                              </button>
                                            </td>
                                          </tr>
                                        )}
                                      </Draggable>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="5" className="text-center py-6 text-gray-500">
                                        No steps added yet. Click "Add Step" to get started.
                                      </td>
                                    </tr>
                                  )}
                                  {provided.placeholder}
                                </tbody>
                              )}
                            </Droppable>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Add New Test Case */}
                <div className="pt-4">
                  <button
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 shadow-md font-semibold"
                    onClick={addNewTestCase}
                  >
                    ➕ Add New Test Case
                  </button>
                </div>
              </div>
            </DragDropContext>
          )}
        </main>
      </div>

      {/* Export Modal */}
      {showExportModal && <ExportModal />}
    </div>
  );
}

export default App;