// WebSocket service - DISABLED
// Django backend doesn't support WebSocket/Socket.IO
// All real-time functionality has been moved to REST API polling

class WebSocketService {
  constructor() {
    this.disabled = true
  }

  // All methods are no-ops - WebSocket disabled
  connect() {
    console.log('ℹ️ WebSocket disabled - using REST API only')
  }

  disconnect() {
    // No-op
  }

  subscribeToInventory() {
    // No-op
  }

  subscribeToProduct() {
    // No-op
  }

  on() {
    // No-op
  }

  off() {
    // No-op
  }

  isConnected() {
    return false
  }
}

// Create singleton instance
const webSocketService = new WebSocketService()

export default webSocketService
