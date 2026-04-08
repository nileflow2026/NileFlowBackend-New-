import React, { useState, useEffect } from "react";
import { databases, Config, Query } from "../../appwrite";

/**
 * Debug component to help troubleshoot user-related issues
 * Add this component temporarily to your page to debug user ID issues
 */
export default function UserDebugPanel({ userId }) {
  const [debugInfo, setDebugInfo] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      const debug = {
        providedUserId: userId,
        userIdLength: userId?.length,
        userIdType: typeof userId,
        config: {
          databaseId: Config.databaseId,
          userCollectionId: Config.userCollectionId,
          orderCollectionId: Config.orderCollectionId,
          addressCollection: Config.addressCollection,
        },
        users: [],
        userExists: false,
        error: null,
      };

      try {
        // Try to fetch the specific user
        if (userId) {
          try {
            const user = await databases.getDocument(
              Config.databaseId,
              Config.userCollectionId,
              userId
            );
            debug.userExists = true;
            debug.foundUser = {
              id: user.$id,
              username: user.username,
              email: user.email,
              created: user.$createdAt,
            };
          } catch (userErr) {
            debug.userExists = false;
            debug.userError = {
              code: userErr.code,
              message: userErr.message,
              type: userErr.type,
            };
          }
        }

        // Fetch some example users
        const usersResult = await databases.listDocuments(
          Config.databaseId,
          Config.userCollectionId,
          [],
          10
        );

        debug.users = usersResult.documents.map((user) => ({
          id: user.$id,
          username: user.username,
          email: user.email,
          created: user.$createdAt,
        }));

        debug.totalUsers = usersResult.total;
      } catch (err) {
        debug.error = {
          code: err.code,
          message: err.message,
          type: err.type,
        };
      }

      setDebugInfo(debug);
    };

    fetchDebugInfo();
  }, [userId]);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700"
        >
          🐛 Debug User
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-96 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              🐛 User Debug Information
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {debugInfo && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Provided User ID
                </h4>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm font-mono">
                  <p>
                    <strong>Value:</strong> "{debugInfo.providedUserId}"
                  </p>
                  <p>
                    <strong>Length:</strong> {debugInfo.userIdLength}
                  </p>
                  <p>
                    <strong>Type:</strong> {debugInfo.userIdType}
                  </p>
                  <p>
                    <strong>Valid Format:</strong>{" "}
                    {debugInfo.userIdLength >= 20 ? "✅ Yes" : "❌ No"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  User Lookup Result
                </h4>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm">
                  {debugInfo.userExists ? (
                    <div className="text-green-600">
                      <p>✅ User Found!</p>
                      <p>Username: {debugInfo.foundUser.username}</p>
                      <p>Email: {debugInfo.foundUser.email}</p>
                    </div>
                  ) : (
                    <div className="text-red-600">
                      <p>❌ User Not Found</p>
                      {debugInfo.userError && (
                        <div>
                          <p>Error Code: {debugInfo.userError.code}</p>
                          <p>Error Type: {debugInfo.userError.type}</p>
                          <p>Message: {debugInfo.userError.message}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Available Users (First 10)
                </h4>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm max-h-32 overflow-y-auto">
                  <p className="mb-2">
                    <strong>Total Users:</strong> {debugInfo.totalUsers}
                  </p>
                  {debugInfo.users.length > 0 ? (
                    <ul className="space-y-1">
                      {debugInfo.users.map((user) => (
                        <li key={user.id} className="font-mono text-xs">
                          <span className="text-blue-600 dark:text-blue-400">
                            {user.id}
                          </span>{" "}
                          - {user.username} ({user.email})
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No users found</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Configuration
                </h4>
                <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm font-mono">
                  <p>Database ID: {debugInfo.config.databaseId}</p>
                  <p>User Collection: {debugInfo.config.userCollectionId}</p>
                  <p>Order Collection: {debugInfo.config.orderCollectionId}</p>
                  <p>
                    Address Collection: {debugInfo.config.addressCollection}
                  </p>
                </div>
              </div>

              {debugInfo.error && (
                <div>
                  <h4 className="font-semibold text-red-600 mb-2">
                    Configuration Error
                  </h4>
                  <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded text-sm">
                    <p>Code: {debugInfo.error.code}</p>
                    <p>Type: {debugInfo.error.type}</p>
                    <p>Message: {debugInfo.error.message}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                console.log("Full Debug Info:", debugInfo);
                alert("Debug info logged to console!");
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-3"
            >
              Log to Console
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
