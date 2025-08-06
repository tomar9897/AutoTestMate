// import React from "react";

// const Sidebar = ({ chatHistory, onLoadChat }) => {
//   return (
//     <aside className="w-64 bg-white dark:bg-gray-900 text-sm p-4 border-r dark:border-gray-700 overflow-y-auto">
//       <h3 className="text-lg font-bold mb-4 dark:text-white">🗂️ Chat History</h3>

//       {chatHistory.length === 0 && (
//         <p className="text-gray-500 dark:text-gray-400">No saved chats.</p>
//       )}

//       <ul className="space-y-2">
//         {chatHistory.map((chat) => (
//           <li
//             key={chat.id}
//             className="cursor-pointer p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
//             onClick={() => onLoadChat(chat)}
//           >
//             {chat.prompt.slice(0, 30)}...
//           </li>
//         ))}
//       </ul>
//     </aside>
//   );
// };

// export default Sidebar;


import React, { useState } from "react";

const Sidebar = ({ chatHistory, onLoadChat, onUpdateChatName, onToggleSidebar }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");

  // Filter chat history based on search term
  const filteredHistory = chatHistory.filter(chat => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (chat.name && chat.name.toLowerCase().includes(searchLower)) ||
      (chat.prompt && chat.prompt.toLowerCase().includes(searchLower)) ||
      (chat.improvedPrompt && chat.improvedPrompt.toLowerCase().includes(searchLower))
    );
  });

  const handleEditStart = (chat) => {
    setEditingId(chat.id);
    setEditingName(chat.name || chat.prompt.slice(0, 30) + "...");
  };

  const handleEditSave = () => {
    if (editingName.trim() && onUpdateChatName) {
      onUpdateChatName(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName("");
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 text-sm border-r dark:border-gray-700 overflow-y-auto flex flex-col">
      {/* Header with Close Button */}
      <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-bold dark:text-white">🗂️ Chat History</h3>
        <button
          onClick={onToggleSidebar}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title="Hide sidebar"
        >
          ✕
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b dark:border-gray-700">
        <input
          type="text"
          placeholder="🔍 Search chats..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
        />
      </div>

      {/* Chat History List */}
      <div className="flex-1 p-4 overflow-y-auto">
        {filteredHistory.length === 0 && searchTerm === "" && (
          <p className="text-gray-500 dark:text-gray-400">No saved chats.</p>
        )}

        {filteredHistory.length === 0 && searchTerm !== "" && (
          <p className="text-gray-500 dark:text-gray-400">No chats match your search.</p>
        )}

        <ul className="space-y-3">
          {filteredHistory.map((chat) => (
            <li
              key={chat.id}
              className="group border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              {editingId === chat.id ? (
                // Edit Mode
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    onBlur={handleEditSave}
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    autoFocus
                  />
                  <div className="flex space-x-1">
                    <button
                      onClick={handleEditSave}
                      className="text-xs px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleEditCancel}
                      className="text-xs px-2 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <button
                      onClick={() => onLoadChat(chat)}
                      className="text-left flex-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <div className="font-medium text-sm dark:text-white truncate pr-2">
                        {chat.name || `${chat.prompt.slice(0, 30)}...`}
                      </div>
                    </button>
                    <button
                      onClick={() => handleEditStart(chat)}
                      className="opacity-0 group-hover:opacity-100 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                      title="Edit name"
                    >
                      ✏️
                    </button>
                  </div>
                  
                  {/* Metadata */}
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    {chat.timestamp && (
                      <div className="flex items-center">
                        <span className="mr-1">📅</span>
                        {new Date(chat.timestamp).toLocaleDateString()}
                      </div>
                    )}
                    {chat.testCases && chat.testCases.length > 0 && (
                      <div className="flex items-center">
                        <span className="mr-1">🧪</span>
                        {chat.testCases.length} test case{chat.testCases.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;