class WebSocketService {
  constructor() {
    // WS is opt-in because local backend commonly runs without Channels/Redis.
    this.enabled = import.meta.env.VITE_ENABLE_WS === 'true'
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 2
    this.reconnectInterval = 5000
    this.listeners = new Map()
    this.isConnected = false
    this.currentChannel = null
    this.userRole = null
    this.userId = null
    this.connectionNotified = false
  }

  connect(channel = 'dashboard', userRole = null, userId = null) {
    if (!this.enabled) {
      if (!this.connectionNotified) {
        console.info('WebSocket disabled (set VITE_ENABLE_WS=true to enable). Using REST API only.')
        this.connectionNotified = true
      }
      this.notifyListeners('connection', { status: 'disabled', channel })
      return
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentChannel === channel) {
      return
    }

    // Disconnect existing connection if channel changed
    if (this.ws && this.currentChannel !== channel) {
      this.disconnect()
    }

    this.currentChannel = channel
    this.userRole = userRole
    this.userId = userId

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname || 'localhost'
    const wsChannelMap = {
      dashboard: 'inventory',
      dealer: 'inventory',
      'admin-dashboard': 'products',
      inventory: 'inventory',
      products: 'products'
    }
    const resolvedChannel = wsChannelMap[channel] || 'inventory'
    const wsUrl = `${protocol}//${host}:8000/ws/${resolvedChannel}/`

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log(`WebSocket connected to channel: ${resolvedChannel}`)
        this.isConnected = true
        this.reconnectAttempts = 0
        
        // Send authentication message
        if (userRole && userId) {
          this.send({
            type: 'authenticate',
            payload: { role: userRole, user_id: userId }
          })
        }
        
        this.notifyListeners('connection', { status: 'connected', channel: resolvedChannel })
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WebSocket message received:', data)
          
          // Handle different message types
          if (data.type) {
            this.notifyListeners(data.type, data.payload || data)
          } else {
            // Legacy support
            this.notifyListeners(data.event || 'message', data)
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.isConnected = false
        this.notifyListeners('connection', { status: 'disconnected', channel: resolvedChannel })
        this.attemptReconnect()
      }

      this.ws.onerror = (error) => {
        console.warn('WebSocket unavailable, continuing with REST API:', error)
        this.notifyListeners('connection', { status: 'error', error, channel: resolvedChannel })
      }
    } catch (error) {
      console.warn('Failed to create WebSocket connection, continuing with REST API:', error)
      this.attemptReconnect()
    }
  }

  attemptReconnect() {
    if (!this.enabled) return

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`)
      
      setTimeout(() => {
        this.connect(this.currentChannel || 'dashboard', this.userRole, this.userId)
      }, this.reconnectInterval)
    } else {
      console.log('Max reconnection attempts reached, falling back to REST API')
      this.notifyListeners('connection', { status: 'failed' })
    }
  }

  subscribe(eventType, callback) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType).add(callback)
  }

  unsubscribe(eventType, callback) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).delete(callback)
    }
  }

  notifyListeners(eventType, data) {
    if (this.listeners.has(eventType)) {
      this.listeners.get(eventType).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('Error in WebSocket listener callback:', error)
        }
      })
    }
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    } else {
      console.warn('WebSocket is not connected')
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.currentChannel = null
    this.userRole = null
    this.userId = null
    // Don't clear listeners - they might want to reconnect
  }

  // Helper methods for dealer-specific subscriptions
  subscribeToOrders(callback) {
    this.subscribe('new_order', callback)
    this.subscribe('order_updated', callback)
    this.subscribe('order_status_changed', callback)
  }

  subscribeToInventory(callback) {
    this.subscribe('inventory_updated', callback)
    this.subscribe('low_stock_alert', callback)
    this.subscribe('stock_movement', callback)
  }

  subscribeToDealerUpdates(callback) {
    this.subscribeToOrders(callback)
    this.subscribeToInventory(callback)
    this.subscribe('new_product', callback)
    this.subscribe('product_updated', callback)
  }

  unsubscribeFromOrders(callback) {
    this.unsubscribe('new_order', callback)
    this.unsubscribe('order_updated', callback)
    this.unsubscribe('order_status_changed', callback)
  }

  unsubscribeFromInventory(callback) {
    this.unsubscribe('inventory_updated', callback)
    this.unsubscribe('low_stock_alert', callback)
    this.unsubscribe('stock_movement', callback)
  }

  unsubscribeFromDealerUpdates(callback) {
    this.unsubscribeFromOrders(callback)
    this.unsubscribeFromInventory(callback)
    this.unsubscribe('new_product', callback)
    this.unsubscribe('product_updated', callback)
  }
}

export const wsService = new WebSocketService()
export default wsService
