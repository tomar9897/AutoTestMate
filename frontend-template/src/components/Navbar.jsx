
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

  const handleEngineChange = (e) => {
    const newEngine = e.target.value;
    setSelectedEngine(newEngine);
    localStorage.setItem("selectedEngine", newEngine);
    console.log("🔄 Engine switched to:", newEngine);
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

        {/* UPDATED: Engine Selector with all new options */}
        <select
          value={selectedEngine}
          onChange={handleEngineChange}
          className="bg-gray-100 dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="gemini">🔷 Gemini Flash (Google)</option>
          <option value="gemini-pro">💎 Gemini Pro (Google)</option>
          <option value="groq">⚡ Groq (Llama3)</option>
          <option value="openai-free">🔥 OpenAI (Free Tier)</option>
          <option value="cohere-free">🌟 Cohere (Free Tier)</option>
          <option value="ollama">🦙 Ollama (Coming Soon)</option>
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
