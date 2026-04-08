import { useEffect, useCallback, useRef } from "react";

// Custom hook for performance monitoring
export const usePerformance = () => {
  const metricsRef = useRef({});

  const measureRender = useCallback((componentName) => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      console.log(
        `⚡ ${componentName} render time: ${renderTime.toFixed(2)}ms`,
      );

      // Store metrics
      if (!metricsRef.current.components) {
        metricsRef.current.components = {};
      }
      metricsRef.current.components[componentName] = renderTime;
    };
  }, []);

  const measureAPI = useCallback((endpoint) => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const apiTime = endTime - startTime;
      console.log(`🌐 API ${endpoint} time: ${apiTime.toFixed(2)}ms`);

      // Store metrics
      if (!metricsRef.current.api) {
        metricsRef.current.api = {};
      }
      metricsRef.current.api[endpoint] = apiTime;
    };
  }, []);

  return { measureRender, measureAPI, metrics: metricsRef.current };
};

// Hook for lazy loading with intersection observer
export const useLazyLoad = (callback, options = {}) => {
  const elementRef = useRef(null);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || hasLoadedRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoadedRef.current) {
          hasLoadedRef.current = true;
          callback();
          observer.unobserve(element);
        }
      },
      {
        rootMargin: "100px 0px",
        threshold: 0.1,
        ...options,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return elementRef;
};

// Hook for adaptive loading based on connection
export const useAdaptiveLoading = () => {
  const getConnectionInfo = useCallback(() => {
    if ("connection" in navigator) {
      const connection = navigator.connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        saveData: connection.saveData,
        isSlowConnection:
          connection.effectiveType === "slow-2g" ||
          connection.effectiveType === "2g",
      };
    }
    return {
      effectiveType: "4g",
      downlink: 10,
      saveData: false,
      isSlowConnection: false,
    };
  }, []);

  const shouldLoadResource = useCallback(
    (resourceType) => {
      const connection = getConnectionInfo();

      if (connection.saveData) return false;

      switch (resourceType) {
        case "animation":
          return !connection.isSlowConnection;
        case "highQualityImage":
          return connection.effectiveType === "4g" && connection.downlink > 1.5;
        case "prefetch":
          return connection.effectiveType === "4g" && !connection.saveData;
        default:
          return true;
      }
    },
    [getConnectionInfo],
  );

  return { getConnectionInfo, shouldLoadResource };
};

export default { usePerformance, useLazyLoad, useAdaptiveLoading };
