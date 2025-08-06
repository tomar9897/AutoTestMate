// import React, { useEffect, useState } from "react";

// const Navbar = ({ selectedEngine, setSelectedEngine }) => {
//   const [darkMode, setDarkMode] = useState(false);

//   // Load saved preference
//   useEffect(() => {
//     const saved = localStorage.getItem("theme") === "dark";
//     setDarkMode(saved);
//     document.documentElement.classList.toggle("dark", saved);
//   }, []);

//   // Handle toggle
//   const toggleTheme = () => {
//     const newMode = !darkMode;
//     setDarkMode(newMode);
//     localStorage.setItem("theme", newMode ? "dark" : "light");
//     document.documentElement.classList.toggle("dark", newMode);
//   };

//   return (
//     <header className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-800 dark:text-white shadow-sm">
//       <h1 className="text-xl font-bold">
//         🧠 AutoTestMate
//       </h1>

//       <div className="flex items-center gap-4">
//         {/* Engine Selector */}
//         <select
//           value={selectedEngine}
//           onChange={(e) => setSelectedEngine(e.target.value)}
//           className="bg-gray-100 dark:bg-gray-700 dark:text-white border rounded px-2 py-1 text-sm"
//         >
//           <option value="gemini">Gemini (Google API)</option>
//           <option value="ollama">Ollama GPT (Agentic)</option>
//         </select>

//         {/* Dark Mode Toggle */}
//         <button
//           onClick={toggleTheme}
//           className="text-xl focus:outline-none hover:scale-110 transition"
//           title="Toggle Dark Mode"
//         >
//           {darkMode ? "🌙" : "💡"}
//         </button>
//       </div>
//     </header>
//   );
// };

// export default Navbar;



import React, { useEffect, useState } from "react";

const Navbar = ({ selectedEngine, setSelectedEngine, onNewChat }) => {
  const [darkMode, setDarkMode] = useState(false);

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem("theme") === "dark";
    setDarkMode(saved);
    document.documentElement.classList.toggle("dark", saved);
  }, []);

  // Handle toggle
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", newMode);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b bg-white dark:bg-gray-800 dark:text-white shadow-sm">
      <h1 className="text-xl font-bold">
        🧠 AutoTestMate
      </h1>

      <div className="flex items-center gap-4">
        {/* New Chat Button */}
        {onNewChat && (
          <button
            onClick={onNewChat}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 text-sm"
            title="Start a new chat"
          >
            <span>🔁</span>
            <span>New Chat</span>
          </button>
        )}

        {/* Engine Selector */}
        <select
          value={selectedEngine}
          onChange={(e) => setSelectedEngine(e.target.value)}
          className="bg-gray-100 dark:bg-gray-700 dark:text-white border rounded px-3 py-2 text-sm"
        >
          <option value="gemini">Gemini (Google API)</option>
          <option value="grok">Grok (X AI)</option>
          <option value="ollama">Ollama GPT (Agentic)</option>
        </select>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="text-xl focus:outline-none hover:scale-110 transition"
          title="Toggle Dark Mode"
        >
          {darkMode ? "🌙" : "💡"}
        </button>
      </div>
    </header>
  );
};

export default Navbar;