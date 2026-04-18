import { productsAPI, inventoryAPI, orderAPI, analyticsAPI } from './services/apiClient'

console.log('🔍 Testing Dashboard APIs...')

const testDashboardAPIs = async () => {
  try {
    // Test all APIs that Dashboard uses
    const [
      dashboardResponse, 
      insightsResponse,
      productsResponse,
      inventoryResponse,
      ordersResponse
    ] = await Promise.all([
      analyticsAPI.getDashboard(),
      analyticsAPI.getInventoryInsights(),
      productsAPI.getProducts(),
      inventoryAPI.getInventory(),
      ordersAPI.getOrders()
    ])
    
    console.log('✅ Dashboard API Response:', dashboardResponse)
    console.log('✅ Insights API Response:', insightsResponse)
    console.log('✅ Products API Response:', productsResponse)
    console.log('✅ Inventory API Response:', inventoryResponse)
    console.log('✅ Orders API Response:', ordersResponse)
    
    // Calculate metrics like Dashboard does
    const productsData = productsResponse.results || productsResponse.data || productsResponse
    const inventoryData = inventoryResponse.results || inventoryResponse.data || inventoryResponse
    const ordersData = ordersResponse.results || ordersResponse.data || ordersResponse
    
    const totalProducts = productsData.length
    const totalInventory = inventoryData.reduce((sum, item) => sum + item.quantity, 0)
    const totalOrders = ordersData.length
    const totalRevenue = ordersData.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
    
    console.log('📊 Dashboard Metrics:', {
      totalProducts,
      totalInventory,
      totalOrders,
      totalRevenue: `$${totalRevenue.toFixed(2)}`
    })
    
  } catch (error) {
    console.error('❌ Dashboard API Test Failed:', error)
  }
}

testDashboardAPIs()
