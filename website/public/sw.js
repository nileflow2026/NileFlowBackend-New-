// Performance-optimized Service Worker with Push Notifications
const CACHE_NAME = "nile-flow-v1.2";
const STATIC_CACHE_NAME = "nile-flow-static-v1.2";
const DYNAMIC_CACHE_NAME = "nile-flow-dynamic-v1.2";

// Critical assets to cache immediately
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/new1.png", // favicon
];

self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log("📦 Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      }),
  );
});

self.addEventListener("activate", (event) => {
  console.log("🟢 Service Worker activated");

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME
            ) {
              console.log("🗑️ Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      }),
      // Claim clients
      self.clients.claim(),
    ]),
  );
});

// Performance-optimized fetch handler
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Handle different asset types with specific strategies
  if (
    url.pathname.includes("/assets/images/") ||
    url.pathname.includes("new1.")
  ) {
    event.respondWith(cacheFirstStrategy(request));
  } else if (
    url.pathname.includes("/assets/js/") ||
    url.pathname.includes("/assets/css/")
  ) {
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else if (url.pathname.includes("/api/")) {
    event.respondWith(networkFirstStrategy(request));
  } else if (url.hostname.includes("fonts.g")) {
    event.respondWith(cacheFirstStrategy(request));
  } else {
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Cache strategies
async function cacheFirstStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    if (networkResponse.ok && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      // Clone before using the response
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    return networkResponse;
  } catch (error) {
    console.log("Cache first failed:", error);
    const fallbackResponse = await caches.match(request);
    return (
      fallbackResponse ||
      new Response("Offline content not available", { status: 503 })
    );
  }
}

async function staleWhileRevalidateStrategy(request) {
  try {
    const cachedResponse = await caches.match(request);

    const fetchPromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok && networkResponse.status === 200) {
        try {
          const cache = await caches.open(DYNAMIC_CACHE_NAME);
          // Clone immediately after receiving response
          const responseClone = networkResponse.clone();
          await cache.put(request, responseClone);
        } catch (cacheError) {
          console.warn("Failed to cache response:", cacheError);
        }
      }
      return networkResponse;
    });

    return cachedResponse || (await fetchPromise);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response("Offline", { status: 503 });
  }
}

async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && networkResponse.status === 200) {
      try {
        const cache = await caches.open(DYNAMIC_CACHE_NAME);
        // Clone before using the response
        const responseClone = networkResponse.clone();
        await cache.put(request, responseClone);
      } catch (cacheError) {
        console.warn("Failed to cache API response:", cacheError);
      }
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return (
      cachedResponse || new Response("API unavailable offline", { status: 503 })
    );
  }
}

// Handle push events
self.addEventListener("push", (event) => {
  console.log("📱 Push notification received:", event);

  let notificationData = {
    title: "Nile Flow Africa",
    body: "You have a new notification",
    icon: "/new1.PNG",
    badge: "/new1.PNG",
    tag: "nile-flow-notification",
    requireInteraction: false,
    actions: [
      {
        action: "view",
        title: "View",
        icon: "/new1.PNG",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    data: {
      url: "/notifications",
      timestamp: Date.now(),
    },
  };

  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = {
        ...notificationData,
        title: pushData.title || notificationData.title,
        body: pushData.body || notificationData.body,
        data: {
          ...notificationData.data,
          ...pushData.data,
        },
      };
    } catch (error) {
      console.warn("Could not parse push data:", error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title,
      notificationData,
    ),
  );
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  console.log("🔔 Notification clicked:", event.notification.tag);

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Default action or 'view' action
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      const url = event.notification.data?.url || "/notifications";

      // Check if a window/tab is already open
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }

      // Open new window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    }),
  );
});

// Handle background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync-notifications") {
    console.log("🔄 Background sync triggered for notifications");
    event.waitUntil(syncNotifications());
  }
});

// Sync notifications in background
async function syncNotifications() {
  try {
    // This would fetch latest notifications from your API
    // For now, we'll just log that sync happened
    console.log("📥 Syncing notifications in background...");
  } catch (error) {
    console.error("❌ Background sync failed:", error);
  }
}
