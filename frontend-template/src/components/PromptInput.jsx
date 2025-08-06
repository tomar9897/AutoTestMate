// src/components/PromptInput.jsx

import React, { useState } from 'react';

const PromptInput = ({ onSubmit }) => {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt); // Call parent handler
      setPrompt(""); // Clear input
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <textarea
        className="w-full h-28 p-3 border border-gray-300 rounded resize-none shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="✍️ Enter a user story, requirement, or prompt..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition"
      >
        🚀 Generate Test Cases
      </button>
    </form>
  );
};

export default PromptInput;
