import React, { useState, useEffect } from "react";

const ImprovedPromptEditor = ({ improvedPrompt, onConfirm }) => {
  const [editablePrompt, setEditablePrompt] = useState(improvedPrompt);

  useEffect(() => {
    setEditablePrompt(improvedPrompt); // update when prop changes
  }, [improvedPrompt]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editablePrompt.trim()) {
      onConfirm(editablePrompt); // pass updated prompt to parent
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <label className="block text-gray-700 font-semibold text-lg">
        ✍️ Review & Edit Improved Prompt
      </label>
      <textarea
        className="w-full h-40 p-3 border border-gray-300 rounded shadow resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
        value={editablePrompt}
        onChange={(e) => setEditablePrompt(e.target.value)}
      />

      <button
        type="submit"
        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 transition"
      >
        ✅ Generate Test Cases
      </button>
    </form>
  );
};

export default ImprovedPromptEditor;
