import { useEffect } from "react";

/**
 * Custom hook to inject JSON-LD structured data into the document head
 * @param {Object} structuredData - The JSON-LD structured data object
 * @param {string} id - Unique identifier for the script tag
 */
const useStructuredData = (structuredData, id) => {
  useEffect(() => {
    if (!structuredData || !id) return;

    // Remove any existing structured data with this ID
    const existingScript = document.getElementById(id);
    if (existingScript) {
      existingScript.remove();
    }

    // Create new script element
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.innerHTML = JSON.stringify(structuredData);

    // Append to document head
    document.head.appendChild(script);

    // Cleanup function to remove the script when component unmounts
    return () => {
      const scriptToRemove = document.getElementById(id);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [structuredData, id]);
};

export default useStructuredData;
