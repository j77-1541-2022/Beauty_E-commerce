import { productsAPI, inventoryAPI, orderAPI, analyticsAPI } from './services/apiClient'

console.log('🔍 Debugging Frontend API Calls...')

// Test each API
const testAPIs = async () => {
  try {
    console.log('Testing Products API...')
    const products = await productsAPI.getProducts()
    console.log('✅ Products:', products.length, 'items')
    
    console.log('Testing Inventory API...')
    const inventory = await inventoryAPI.getInventory()
    console.log('✅ Inventory:', inventory.length, 'items')
    
    console.log('Testing Orders API...')
    const orders = await ordersAPI.getOrders()
    console.log('✅ Orders:', orders.length, 'items')
    
    console.log('Testing Analytics API...')
    const analytics = await analyticsAPI.getDashboard()
    console.log('✅ Analytics:', analytics)
    
  } catch (error) {
    console.error('❌ API Error:', error)
  }
}

// Run the test
testAPIs()
