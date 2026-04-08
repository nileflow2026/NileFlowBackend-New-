// components/DebugPanel.jsx
import React, { useState } from "react";

const DebugPanel = ({ metadata }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!metadata) return null;

  return (
    <div className="mt-8 bg-gray-900/60 backdrop-blur-sm border border-amber-800/30 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-800/40 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></div>
          <span className="text-amber-200 font-medium">Debug Info</span>
          <span className="text-xs text-amber-300/60 bg-amber-900/20 px-2 py-1 rounded">
            DEV MODE
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-amber-300 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 text-sm">
          {/* Session Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/40 rounded p-3">
              <div className="text-amber-300 font-medium mb-2">Session</div>
              <div className="space-y-1 text-gray-300">
                <div>
                  ID:{" "}
                  <span className="text-amber-200 font-mono text-xs">
                    {metadata.sessionId || "N/A"}
                  </span>
                </div>
                <div>
                  Algorithm:{" "}
                  <span className="text-blue-300">
                    {metadata.algorithm || "default"}
                  </span>
                </div>
                <div>
                  Version:{" "}
                  <span className="text-green-300">
                    {metadata.version || "1.0"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/40 rounded p-3">
              <div className="text-amber-300 font-medium mb-2">Performance</div>
              <div className="space-y-1 text-gray-300">
                <div>
                  Response:{" "}
                  <span className="text-green-300">
                    {metadata.responseTime || "N/A"}ms
                  </span>
                </div>
                <div>
                  Items:{" "}
                  <span className="text-blue-300">
                    {metadata.itemCount || 0}
                  </span>
                </div>
                <div>
                  Source:{" "}
                  <span className="text-purple-300">
                    {metadata.dataSource || "hybrid"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Cultural Intelligence */}
          {metadata.culturalBoost && (
            <div className="bg-green-900/20 border border-green-800/30 rounded p-3">
              <div className="text-green-300 font-medium mb-2 flex items-center">
                🌍 Cultural Intelligence
                <span className="ml-2 bg-green-800/30 px-2 py-1 rounded text-xs">
                  +{Math.round((metadata.culturalBoost - 1) * 100)}% boost
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-green-100">
                <div>
                  Cultural Score:{" "}
                  <span className="text-green-300">
                    {metadata.culturalScore?.toFixed(2) || "N/A"}
                  </span>
                </div>
                <div>
                  Location Match:{" "}
                  <span className="text-green-300">
                    {metadata.locationMatch || "N/A"}
                  </span>
                </div>
                <div>
                  Language Pref:{" "}
                  <span className="text-green-300">
                    {metadata.languagePreference || "N/A"}
                  </span>
                </div>
                <div>
                  Cultural Tags:{" "}
                  <span className="text-green-300">
                    {metadata.culturalTags?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Recommendation Strategy */}
          <div className="bg-blue-900/20 border border-blue-800/30 rounded p-3">
            <div className="text-blue-300 font-medium mb-2">Strategy Mix</div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <div className="text-blue-200">Collaborative</div>
                <div className="text-blue-400 font-medium">
                  {metadata.collaborative || "0%"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-purple-200">Content-based</div>
                <div className="text-purple-400 font-medium">
                  {metadata.contentBased || "0%"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-amber-200">Popular</div>
                <div className="text-amber-400 font-medium">
                  {metadata.popularity || "0%"}
                </div>
              </div>
            </div>
          </div>

          {/* Filters Applied */}
          {metadata.filtersApplied && metadata.filtersApplied.length > 0 && (
            <div className="bg-purple-900/20 border border-purple-800/30 rounded p-3">
              <div className="text-purple-300 font-medium mb-2">
                Active Filters
              </div>
              <div className="flex flex-wrap gap-1">
                {metadata.filtersApplied.map((filter, index) => (
                  <span
                    key={index}
                    className="bg-purple-800/30 text-purple-200 px-2 py-1 rounded text-xs"
                  >
                    {filter}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Raw Metadata */}
          <details className="bg-gray-800/20 rounded p-3">
            <summary className="text-gray-400 cursor-pointer hover:text-gray-300 text-xs">
              Raw Metadata (Click to expand)
            </summary>
            <pre className="mt-2 text-xs text-gray-400 bg-black/40 rounded p-2 overflow-x-auto">
              {JSON.stringify(metadata, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
