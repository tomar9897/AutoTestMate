import React from "react";

const CustomLoaders = ({ stage, message }) => {
  const LoaderPromptImprovement = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 rounded-full animate-spin">
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">✨</span>
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Improving Your Prompt</h3>
        <p className="text-gray-500">AI is analyzing and enhancing your requirements...</p>
        <div className="flex justify-center space-x-1 mt-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );

  const LoaderTestCaseGeneration = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="relative">
        <div className="w-20 h-20 border-4 border-indigo-200 rounded-lg animate-pulse">
          <div className="absolute inset-2 border-2 border-indigo-400 rounded animate-spin"></div>
          <div className="absolute inset-4 border-2 border-indigo-600 rounded-full animate-ping"></div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">🧪</span>
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Generating Test Cases</h3>
        <p className="text-gray-500">Creating comprehensive test scenarios...</p>
        <div className="mt-3 space-y-2">
          <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full animate-pulse" style={{width: '70%'}}></div>
          </div>
          <p className="text-xs text-gray-400">Analyzing requirements and generating steps...</p>
        </div>
      </div>
    </div>
  );

  const LoaderGeneric = () => (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="relative">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg">🤖</span>
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Processing</h3>
        <p className="text-gray-500">{message || "Working on your request..."}</p>
      </div>
    </div>
  );

  switch (stage) {
    case 'improving':
      return <LoaderPromptImprovement />;
    case 'generating':
      return <LoaderTestCaseGeneration />;
    default:
      return <LoaderGeneric />;
  }
};

export default CustomLoaders;