// services/contextTracker.js
import axiosClient from "../api.js";

class ContextTracker {
  constructor(userId) {
    this.userId = userId;
    this.sessionData = {
      startTime: Date.now(),
      interactions: [],
      currentCategory: null,
    };
  }

  // Track user behavior for better recommendations
  trackInteraction(type, data) {
    this.sessionData.interactions.push({
      type, // 'view', 'click', 'add_to_cart', 'search'
      data,
      timestamp: Date.now(),
    });

    // Send context updates for real-time personalization
    if (this.shouldUpdateContext()) {
      this.sendContextUpdate();
    }
  }

  shouldUpdateContext() {
    // Update every 5 interactions or 2 minutes
    const interactionCount = this.sessionData.interactions.length;
    const timeSinceStart = Date.now() - this.sessionData.startTime;

    return interactionCount % 5 === 0 || timeSinceStart > 120000;
  }

  async sendContextUpdate() {
    await axiosClient.post("/api/feedback/context-update", {
      userId: this.userId,
      sessionData: this.sessionData,
      timestamp: Date.now(),
    });
  }
}

// Export the class to be instantiated where userId is available
export default ContextTracker;

// Example usage (commented out):
// const contextTracker = new ContextTracker(currentUserId);
// contextTracker.trackInteraction("search", { query: "smartphone", results: 45 });
// contextTracker.trackInteraction("click", { itemId: "item_123", position: 2 });
