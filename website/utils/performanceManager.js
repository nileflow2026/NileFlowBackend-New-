// Performance monitoring and resource preloading utilities
export class PerformanceManager {
  constructor() {
    this.metrics = {};
    this.resourceHints = [];
    this.criticalResources = [];

    // Start monitoring
    this.initPerformanceObserver();
  }

  // Initialize performance observers
  initPerformanceObserver() {
    if ("PerformanceObserver" in window) {
      // Monitor Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
        console.log(`📊 LCP: ${lastEntry.startTime}ms`);
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

      // Monitor First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.metrics.fid = entry.processingStart - entry.startTime;
          console.log(`📊 FID: ${this.metrics.fid}ms`);
        }
      });
      fidObserver.observe({ type: "first-input", buffered: true });

      // Monitor Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        this.metrics.cls = clsValue;
        console.log(`📊 CLS: ${clsValue}`);
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });
    }

    // Monitor First Contentful Paint
    if ("performance" in window) {
      window.addEventListener("load", () => {
        const paintTimings = performance.getEntriesByType("paint");
        const fcpEntry = paintTimings.find(
          (entry) => entry.name === "first-contentful-paint",
        );
        if (fcpEntry) {
          this.metrics.fcp = fcpEntry.startTime;
          console.log(`📊 FCP: ${fcpEntry.startTime}ms`);
        }
      });
    }
  }

  // Preload critical resources
  preloadCriticalResources() {
    const criticalResources = [
      { href: "/src/main.jsx", as: "script", type: "module" },
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
        as: "style",
      },
    ];

    criticalResources.forEach((resource) => {
      this.addResourceHint("preload", resource);
    });
  }

  // Prefetch likely next pages
  prefetchNextPages() {
    const likelyPages = ["/shop", "/deals", "/categories"];

    // Use requestIdleCallback for non-critical prefetching
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        likelyPages.forEach((page) => {
          this.addResourceHint("prefetch", { href: page });
        });
      });
    } else {
      setTimeout(() => {
        likelyPages.forEach((page) => {
          this.addResourceHint("prefetch", { href: page });
        });
      }, 2000);
    }
  }

  // DNS prefetch for external domains
  prefetchDNS() {
    const externalDomains = [
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
      // Add your API domains here
    ];

    externalDomains.forEach((domain) => {
      this.addResourceHint("dns-prefetch", { href: domain });
    });
  }

  // Add resource hint to document head
  addResourceHint(rel, attributes) {
    const link = document.createElement("link");
    link.rel = rel;

    Object.entries(attributes).forEach(([key, value]) => {
      link.setAttribute(key, value);
    });

    // Avoid duplicate hints
    const existing = document.querySelector(
      `link[rel="${rel}"][href="${attributes.href}"]`,
    );
    if (!existing) {
      document.head.appendChild(link);
      this.resourceHints.push({ rel, ...attributes });
    }
  }

  // Adaptive loading based on connection
  getAdaptiveLoadingStrategy() {
    if ("connection" in navigator) {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType;
      const saveData = connection.saveData;

      if (saveData || effectiveType === "slow-2g" || effectiveType === "2g") {
        return {
          imageQuality: 60,
          preloadImages: false,
          loadAnimation: false,
          chunkSize: "small",
        };
      } else if (effectiveType === "3g") {
        return {
          imageQuality: 75,
          preloadImages: true,
          loadAnimation: true,
          chunkSize: "medium",
        };
      } else {
        return {
          imageQuality: 85,
          preloadImages: true,
          loadAnimation: true,
          chunkSize: "large",
        };
      }
    }

    // Default strategy for unsupported browsers
    return {
      imageQuality: 80,
      preloadImages: true,
      loadAnimation: true,
      chunkSize: "medium",
    };
  }

  // Send metrics to analytics
  sendMetrics() {
    if ("sendBeacon" in navigator && Object.keys(this.metrics).length > 0) {
      const metricsData = {
        ...this.metrics,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        url: window.location.href,
      };

      // Send to your analytics endpoint
      navigator.sendBeacon(
        "/api/performance-metrics",
        JSON.stringify(metricsData),
      );
    }
  }

  // Get performance score
  getPerformanceScore() {
    const { fcp, lcp, fid, cls } = this.metrics;
    let score = 100;

    // FCP scoring (target: <1.8s)
    if (fcp > 1800) score -= 20;
    else if (fcp > 1000) score -= 10;

    // LCP scoring (target: <2.5s)
    if (lcp > 2500) score -= 30;
    else if (lcp > 1500) score -= 15;

    // FID scoring (target: <100ms)
    if (fid > 300) score -= 25;
    else if (fid > 100) score -= 10;

    // CLS scoring (target: <0.1)
    if (cls > 0.25) score -= 25;
    else if (cls > 0.1) score -= 10;

    return Math.max(score, 0);
  }
}

// Initialize performance manager
const performanceManager = new PerformanceManager();

// Auto-initialize optimizations
document.addEventListener("DOMContentLoaded", () => {
  performanceManager.prefetchDNS();
  performanceManager.preloadCriticalResources();

  // Delay prefetching to avoid blocking critical resources
  setTimeout(() => {
    performanceManager.prefetchNextPages();
  }, 1000);
});

// Send metrics before page unload
window.addEventListener("beforeunload", () => {
  performanceManager.sendMetrics();
});

export default performanceManager;
