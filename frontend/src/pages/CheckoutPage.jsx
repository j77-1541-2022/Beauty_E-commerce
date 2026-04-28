import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  Truck,
  Shield,
  CreditCard,
  MapPin,
  User,
  Phone,
  Mail,
  Check,
  Loader,
  Package,
  Sparkles
} from 'lucide-react'
import { useCustomerAuth } from '../contexts/CustomerAuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNotification } from '../contexts/NotificationContext'
import { useErrorHandler } from '../contexts/ErrorHandlerContext'
import { cartAPI } from '../services/cartAPI'
import { orderAPI, paymentAPI } from '../services/apiClient'
import { Download, Smartphone } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import AnimatedBackground from '../components/AnimatedBackground'
import BeautyLogo from '../components/BeautyLogo'
import { GlassCard } from '../components/ui/GlassCard'
import AnimatedButton from '../components/ui/AnimatedButton'
import useApiAction from '../hooks/useApiAction'

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { user } = useCustomerAuth()
  const { isDark } = useTheme()
  const { showNotification } = useNotification()
  const { handleError, setLoading: setGlobalLoading } = useErrorHandler()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderData, setOrderData] = useState(null)
  
  // Form data
  const [shippingInfo, setShippingInfo] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Kenya'
  })
  
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    saveCard: false
  })
  
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [shippingZone, setShippingZone] = useState('nairobi_cbd') // New: zone-based shipping
  const [paymentMethod, setPaymentMethod] = useState('mpesa') // 'card', 'mpesa', or 'cash'
  const [mpesaPhone, setMpesaPhone] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('idle') // 'idle', 'processing', 'awaiting_confirmation', 'completed', 'failed', 'timeout'
  const [receiptUrl, setReceiptUrl] = useState('')
  const [cartItems, setCartItems] = useState([])
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    subtotalBeforeTax: 0,
    shipping: 0,
    tax: 0,
    total: 0
  })

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      showNotification('Please log in to proceed with checkout', 'info')
      localStorage.setItem('redirectAfterLogin', '/checkout')
      navigate('/login')
    }
  }, [user, navigate, showNotification])

  const extractPaymentStatus = (statusResponse) => {
    return (
      statusResponse?.data?.data?.payment?.status ||
      statusResponse?.data?.data?.payment_status ||
      statusResponse?.data?.payment_status ||
      statusResponse?.data?.status
    )
  }

  const resolvePaymentState = async (status) => {
    if (status === 'completed' || status === 'paid') {
      setPaymentStatus('completed')
      
      // Refresh order data to get receipt URL and updated status
      if (orderData?.id) {
        try {
          const orderResponse = await orderAPI.getById(orderData.id)
          const refreshedOrder = orderResponse?.data?.data || orderResponse?.data || orderResponse
          if (refreshedOrder?.id) {
            setOrderData(refreshedOrder)
            if (refreshedOrder.receipt_url) {
              setReceiptUrl(refreshedOrder.receipt_url)
            }
          }
        } catch (err) {
          console.error('[resolvePaymentState] Failed to refresh order:', err)
        }
      }
      
      setOrderPlaced(true)
      showNotification('Payment confirmed. Order placed successfully.', 'success')
      setLoading(false)
      setGlobalLoading('checkout.placeOrder', false)
      return true
    }

    if (status === 'failed' || status === 'cancelled') {
      setPaymentStatus('failed')
      showNotification('Payment failed. You can retry M-Pesa or choose another method.', 'error')
      setLoading(false)
      setGlobalLoading('checkout.placeOrder', false)
      return true
    }

    return false
  }

  const { run: runMpesaRetry, loading: retryingMpesa } = useApiAction(
    'checkout.mpesa.retry',
    async ({ orderId, phoneNumber }) => {
      console.log('[M-Pesa Retry] Initiating payment:', { orderId, phoneNumber: normalizeKenyanPhone(phoneNumber) })
      const result = await paymentAPI.initiate({
        order_id: orderId,
        phone_number: normalizeKenyanPhone(phoneNumber),
        payment_method: 'mpesa'
      })
      console.log('[M-Pesa Retry] Response received:', result)
      return result
    },
    {
      startMessage: 'Retrying M-Pesa request...',
      errorMessage: 'Unable to retry M-Pesa request right now.',
      context: 'Checkout M-Pesa Retry'
    }
  )

  const { run: runManualStatusCheck, loading: checkingPaymentStatus } = useApiAction(
    'checkout.payment.statusCheck',
    async (orderId) => paymentAPI.getStatus(orderId),
    {
      startMessage: 'Checking payment status...',
      errorMessage: 'Unable to check payment status right now.',
      context: 'Checkout Manual Payment Status Check'
    }
  )

  const steps = [
    { id: 1, name: 'Cart', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 2, name: 'Details', icon: <MapPin className="w-5 h-5" /> },
    { id: 3, name: 'Payment', icon: <CreditCard className="w-5 h-5" /> },
    { id: 4, name: 'Confirm', icon: <Package className="w-5 h-5" /> }
  ]

  const activeStage = currentStep === 1 ? 2 : currentStep === 2 ? 3 : 4

  // Shipping zones with costs
  const shippingZones = [
    { id: 'nairobi_cbd', name: 'Nairobi (CBD)', cost: 2.00 },
    { id: 'nairobi_other', name: 'Nairobi (Other)', cost: 3.00 },
    { id: 'machakos', name: 'Machakos Town', cost: 5.00 },
    { id: 'athi_river', name: 'Athi River', cost: 4.00 },
    { id: 'other', name: 'Other Locations', cost: 15.00 }
  ]

  const shippingOptions = [
    { id: 'standard', name: 'Standard Shipping', price: 2, days: '5-7 business days' },
    { id: 'express', name: 'Express Shipping', price: 2, days: '2-3 business days' },
    { id: 'overnight', name: 'Overnight Shipping', price: 2, days: '1 business day' }
  ]

  // Format price in KSH
  const formatKSH = (amount) => {
    return `KSh ${amount?.toLocaleString('en-KE') || '0'}`
  }

  const normalizeKenyanPhone = (value) => {
    const cleaned = String(value || '').replace(/\s+/g, '').replace(/-/g, '')
    if (!cleaned) {
      return ''
    }
    if (cleaned.startsWith('+254')) {
      return cleaned.slice(1)
    }
    if (cleaned.startsWith('07')) {
      return `254${cleaned.slice(1)}`
    }
    if (cleaned.startsWith('01')) {
      return `254${cleaned.slice(1)}`
    }
    if (cleaned.startsWith('254')) {
      return cleaned
    }
    return cleaned
  }

  useEffect(() => {
    fetchCartData()
  }, [])

  const fetchCartData = async () => {
    try {
      const cartData = await cartAPI.getCart()
      // Transform backend cart items to frontend format with price
      const transformedItems = (cartData.items || []).map(item => ({
        id: item.product?.id,
        product_id: item.product?.id,  // Keep product_id for order creation
        product: item.product,  // Keep full product object for reference
        name: item.product?.name,
        price: item.product?.selling_price || item.product?.price || 0,
        image: item.product?.primary_image,
        quantity: item.quantity || 1
      }))
      setCartItems(transformedItems)
      calculateOrderSummary(transformedItems)
    } catch (error) {
      console.error('Failed to fetch cart data:', error)
    }
  }

  const calculateOrderSummary = (items) => {
    const subtotalBeforeTax = items.reduce((total, item) => total + (item.price * item.quantity), 0)
    const tax = 0
    const subtotal = subtotalBeforeTax + tax
    const shipping = paymentMethod === 'cash'
      ? 0
      : (shippingZones.find(zone => zone.id === shippingZone)?.cost || 0)
    const total = subtotal + shipping

    setOrderSummary({ subtotal, subtotalBeforeTax, shipping, tax, total })
  }

  useEffect(() => {
    calculateOrderSummary(cartItems)
  }, [cartItems, shippingZone, paymentMethod])

  const handleShippingSubmit = (e) => {
    e.preventDefault()
    setCurrentStep(2)
  }

  const handlePaymentSubmit = (e) => {
    e.preventDefault()
    setCurrentStep(3)
  }

  const handlePlaceOrder = async () => {
    if (!cartItems.length) {
      showNotification('Your cart is empty. Add products before placing an order.', 'warning')
      return
    }

    const invalidCartItem = cartItems.find(item => !item.id || !item.quantity || item.quantity < 1)
    if (invalidCartItem) {
      showNotification('Your cart has invalid items. Please refresh cart and try again.', 'error')
      return
    }

    setLoading(true)
    setGlobalLoading('checkout.placeOrder', true)
    showNotification('Processing your order...', 'info')
    try {
      // Create order first
      const orderPayload = {
        customer_name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        customer_email: shippingInfo.email,
        customer_phone: normalizeKenyanPhone(shippingInfo.phone),
        shipping_address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zipCode}`,
        shipping_zone: shippingZone, // Include zone for tracking
        subtotal: orderSummary.subtotal,
        tax_amount: 0,
        shipping_cost: paymentMethod === 'cash' ? 0 : orderSummary.shipping,
        items: cartItems.map(item => ({
          product_id: item.product_id || item.product?.id || item.id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity
        }))
      }
      
      console.log('[Order Creation] Sending payload:', orderPayload)
      const orderResult = await orderAPI.create(orderPayload)
      console.log('[Order Creation] API Response:', orderResult)
      
      // Extract order from response (new APIResponseMixin wrapper structure)
      let createdOrder = null
      if (orderResult?.data?.data?.id) {
        // New structure: { status: 'success', data: { ...order... }, message: '...' }
        createdOrder = orderResult.data.data
        console.log('[Order Creation] Extracted from data.data')
      } else if (orderResult?.data?.id) {
        // Old structure: direct order in data
        createdOrder = orderResult.data
        console.log('[Order Creation] Extracted from data')
      } else if (orderResult?.id) {
        // Fallback: order at root
        createdOrder = orderResult
        console.log('[Order Creation] Extracted from root')
      }
      
      if (!createdOrder?.id && !createdOrder?.order_number) {
        console.error('Order creation failed: Invalid response structure', orderResult)
        throw new Error('Order creation failed: Invalid response from server')
      }
      
      setOrderData(createdOrder)
      
      // If M-Pesa payment, initiate STK push
      if (paymentMethod === 'mpesa') {
        if (!mpesaPhone) {
          showNotification('Please enter M-Pesa phone number before proceeding.', 'warning')
          setCurrentStep(2)
          setLoading(false)
          setGlobalLoading('checkout.placeOrder', false)
          return
        }
        
        setPaymentStatus('processing')
        const paymentResponseResult = await runMpesaRetry({ orderId: createdOrder.id, phoneNumber: mpesaPhone })

        if (!paymentResponseResult.ok) {
          setPaymentStatus('failed')
          setLoading(false)
          setGlobalLoading('checkout.placeOrder', false)
          return
        }

        const paymentResponse = paymentResponseResult.result

        const checkoutRequestId =
          paymentResponse?.data?.data?.payment?.checkout_request_id ||
          paymentResponse?.data?.payment?.checkout_request_id ||
          paymentResponse?.data?.checkout_request_id ||
          paymentResponse?.checkout_request_id

        if (checkoutRequestId) {
          setPaymentStatus('awaiting_confirmation')
          showNotification('Waiting for payment confirmation...', 'info')
          // Poll for payment status
          pollPaymentStatus(createdOrder.id)
        } else {
          setPaymentStatus('failed')
          showNotification('Payment initiation failed. Please try again.', 'error')
          setLoading(false)
          setGlobalLoading('checkout.placeOrder', false)
        }
      } else if (paymentMethod === 'cash') {
        const cashResponse = await paymentAPI.recordCash({
          order_id: createdOrder.id,
          amount: orderSummary.total,
          phone_number: normalizeKenyanPhone(shippingInfo.phone),
          payment_method: 'cash',
        })
        console.log('Cash payment response:', cashResponse)
        setReceiptUrl(cashResponse?.data?.data?.receipt_url || cashResponse?.data?.receipt_url || '')
        setOrderPlaced(true)
        showNotification('Order placed and cash receipt generated.', 'success')
        setLoading(false)
        setGlobalLoading('checkout.placeOrder', false)
      } else {
        // Card payment - simulate success for now
        setOrderPlaced(true)
        showNotification('Order placed successfully.', 'success')
        setLoading(false)
        setGlobalLoading('checkout.placeOrder', false)
      }
    } catch (error) {
      console.error('Failed to place order:', error)
      const responseData = error?.response?.data || {}
      const backendFields = responseData?.error?.fields || responseData?.errors || responseData?.data || responseData

      let message = 'Failed to place order. Please review your details and try again.'

      // Log full order payload for debugging
      console.error('[Checkout] Order payload that failed:', orderPayload)
      console.error('[Checkout] Cart items at time of error:', cartItems)
      console.error('[Checkout] Backend error response:', responseData)

      // Extract specific validation errors
      if (backendFields?.items) {
        const itemErrors = Array.isArray(backendFields.items) ? backendFields.items.join(', ') : backendFields.items
        message = `Item validation error: ${itemErrors}`
      } else if (Array.isArray(backendFields?.detail) && backendFields.detail.length) {
        message = backendFields.detail[0]
      } else if (typeof backendFields?.detail === 'string') {
        message = backendFields.detail
      } else if (Array.isArray(responseData?.non_field_errors) && responseData.non_field_errors.length) {
        message = responseData.non_field_errors[0]
      } else if (typeof responseData?.message === 'string' && responseData.message) {
        message = responseData.message
      }

      setPaymentStatus('failed')
      handleError(error, 'Checkout')
      showNotification(message, 'error')
      setLoading(false)
      setGlobalLoading('checkout.placeOrder', false)
    }
  }

  const pollPaymentStatus = async (orderId) => {
    const maxAttempts = 60 // 1 minute of fast polling (60 * 1 second)
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const statusResponse = await paymentAPI.getStatus(orderId)
        console.log(`Payment status check (attempt ${attempt}):`, statusResponse)
        const status = extractPaymentStatus(statusResponse)
        console.log('Extracted payment status:', status)

        const isTerminal = await resolvePaymentState(status)
        if (isTerminal) {
          return
        }

        if (attempt < maxAttempts) {
          await delay(1000) // Check every 1 second for faster response
        }
      } catch (error) {
        console.error('Error checking payment status:', error)
        // Don't stop polling on error, just continue
        if (attempt < maxAttempts) {
          await delay(1000)
        }
      }
    }

    // After max attempts, show "still waiting" instead of timeout
    // Customer can manually check status using the Check Status button
    console.log('Polling reached max attempts, switching to manual check mode')
    showNotification('Payment is taking longer than expected. Please check status manually.', 'info')
    setLoading(false)
    setGlobalLoading('checkout.placeOrder', false)
  }

  const handleRetryMpesa = async () => {
    if (!orderData?.id) {
      showNotification('Order reference missing. Please place order again.', 'warning')
      return
    }

    if (!normalizeKenyanPhone(mpesaPhone)) {
      showNotification('Enter a valid M-Pesa phone number before retrying.', 'warning')
      setCurrentStep(2)
      return
    }

    setPaymentStatus('processing')
    const retryResult = await runMpesaRetry({ orderId: orderData.id, phoneNumber: mpesaPhone })

    if (!retryResult.ok) {
      setPaymentStatus('failed')
      return
    }

    const retryResponse = retryResult.result
    const checkoutRequestId =
      retryResponse?.data?.data?.payment?.checkout_request_id ||
      retryResponse?.data?.payment?.checkout_request_id ||
      retryResponse?.data?.checkout_request_id

    if (checkoutRequestId) {
      setPaymentStatus('awaiting_confirmation')
      pollPaymentStatus(orderData.id)
      return
    }

    setPaymentStatus('failed')
    showNotification('Retry request sent, but no checkout session was returned.', 'warning')
  }

  const handleManualPaymentCheck = async () => {
    if (!orderData?.id) {
      showNotification('Order reference missing. Please place order again.', 'warning')
      return
    }

    const checkResult = await runManualStatusCheck(orderData.id)
    if (!checkResult.ok) {
      return
    }

    const status = extractPaymentStatus(checkResult.result)
    console.log('[Manual Check] Payment status:', status)
    
    const isTerminal = await resolvePaymentState(status)

    if (isTerminal && (status === 'completed' || status === 'paid')) {
      // Payment successful - refresh order data for receipt
      try {
        const orderResponse = await orderAPI.getById(orderData.id)
        console.log('[Manual Check] Refreshed order data:', orderResponse)
        
        // Update orderData with fresh data including receipt URL
        const refreshedOrder = orderResponse?.data?.data || orderResponse?.data || orderResponse
        if (refreshedOrder?.id) {
          setOrderData(refreshedOrder)
          
          // Set receipt URL if available
          if (refreshedOrder.receipt_url) {
            setReceiptUrl(refreshedOrder.receipt_url)
          }
        }
        
        showNotification('Payment confirmed! Your order is now being processed.', 'success')
      } catch (err) {
        console.error('[Manual Check] Failed to refresh order:', err)
        // Still show success even if refresh fails
        showNotification('Payment confirmed! Order placed successfully.', 'success')
      }
    } else if (!isTerminal) {
      setPaymentStatus('awaiting_confirmation')
      showNotification('Payment is still pending confirmation. Please approve the STK push on your phone.', 'info')
    }
  }

  const downloadReceipt = async () => {
    try {
      const url = receiptUrl 
        ? `http://localhost:8000${receiptUrl}` 
        : `http://localhost:8000/api/v1/orders/${orderData.id}/receipt/`
      
      // Fetch the PDF as blob
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to download receipt')
      }
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      
      // Create temporary link to trigger download
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = `receipt_${orderData.order_number || orderData.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Cleanup
      window.URL.revokeObjectURL(downloadUrl)
      showNotification('Receipt downloaded successfully!', 'success')
    } catch (error) {
      console.error('Failed to download receipt:', error)
      showNotification('Failed to download receipt. Please try again.', 'error')
    }
  }

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = matches && matches[0] || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return ''
    }
  }

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4)
    }
    return v
  }

  if (orderPlaced) {
    return (
      <AnimatedBackground variant="midnight">
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl w-full"
          >
            <GlassCard className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>
              
              <h1 className="text-3xl font-bold text-white mb-4">Order Placed Successfully!</h1>
              <p className="text-white mb-6">
                Thank you for your order. We've sent a confirmation email to {shippingInfo.email}
              </p>
              
              <div className="bg-white/10 rounded-lg p-4 mb-6 text-left">
                <p className="text-white font-medium mb-2">Order Details:</p>
                <p className="text-white">Order ID: #{orderData?.id || 'ORD-' + Date.now()}</p>
                <p className="text-white">Total: {formatKSH(orderSummary.total)}</p>
                <p className="text-white">Estimated Delivery: {
                  shippingOptions.find(option => option.id === shippingMethod)?.days || '5-7 business days'
                }</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <AnimatedButton
                  onClick={downloadReceipt}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500"
                  icon={<Download className="w-5 h-5" />}
                >
                  Download Receipt
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => navigate('/orders')}
                  variant="outline"
                  className="flex-1"
                >
                  View Orders
                </AnimatedButton>
                <AnimatedButton
                  onClick={() => navigate('/shop')}
                  variant="outline"
                  className="flex-1"
                >
                  Continue Shopping
                </AnimatedButton>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </AnimatedBackground>
    )
  }

  return (
    <AnimatedBackground variant="midnight">
      <div className="relative z-10 min-h-screen">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/cart" className="flex items-center text-white hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Cart
              </Link>
              <BeautyLogo size="medium" animated={true} />
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-400" />
                <span className="text-white text-sm">Secure Checkout</span>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Progress Steps */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center mb-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <motion.div
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${
                    step.id <= activeStage
                      ? 'bg-purple-600 border-purple-600 text-white'
                      : 'bg-white/10 border-white/30 text-gray-200'
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {step.icon}
                </motion.div>
                <div className="ml-2 mr-4 hidden md:block">
                  <p className={`text-xs font-medium ${step.id <= activeStage ? 'text-white' : 'text-gray-300'}`}>
                    {step.name}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-4 transition-colors ${
                    step.id < activeStage ? 'bg-purple-600' : 'bg-white/30'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="shipping"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GlassCard className="p-6">
                      <h2 className="text-2xl font-bold text-white mb-6">Shipping Information</h2>
                      <form onSubmit={handleShippingSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              First Name
                            </label>
                            <input
                              type="text"
                              required
                              value={shippingInfo.firstName}
                              onChange={(e) => setShippingInfo({...shippingInfo, firstName: e.target.value})}
                              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Last Name
                            </label>
                            <input
                              type="text"
                              required
                              value={shippingInfo.lastName}
                              onChange={(e) => setShippingInfo({...shippingInfo, lastName: e.target.value})}
                              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                              placeholder="Doe"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Email Address
                          </label>
                          <input
                            type="email"
                            required
                            value={shippingInfo.email}
                            onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                            placeholder="john@example.com"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            required
                            value={shippingInfo.phone}
                            onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                            placeholder="+254 712 345 678"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">
                            Street Address / Location
                          </label>
                          <input
                            type="text"
                            required
                            value={shippingInfo.address}
                            onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                            placeholder="Estate / landmark in Kenya"
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              City
                            </label>
                            <input
                              type="text"
                              required
                              value={shippingInfo.city}
                              onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                              placeholder="Nairobi"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              State
                            </label>
                            <input
                              type="text"
                              required
                              value={shippingInfo.state}
                              onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                              placeholder="Nairobi County"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              ZIP Code
                            </label>
                            <input
                              type="text"
                              required
                              value={shippingInfo.zipCode}
                              onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                              placeholder="00100"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white mb-4">
                            Shipping Zone
                          </label>
                          <select
                            value={shippingZone}
                            onChange={(e) => setShippingZone(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          >
                            {shippingZones.map((zone) => (
                              <option key={zone.id} value={zone.id} className="bg-gray-900">
                                {zone.name} - {formatKSH(zone.cost)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <AnimatedButton
                          type="submit"
                          className="w-full"
                          icon={<ArrowRight className="w-5 h-5" />}
                        >
                          Continue to Payment
                        </AnimatedButton>
                      </form>
                    </GlassCard>
                  </motion.div>
                )}

                {/* Order Success Step */}
                {orderPlaced && orderData && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.5 }}
                  >
                    <GlassCard className="p-8 text-center">
                      <div className="mb-6">
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Check className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">Order Placed Successfully!</h2>
                        <p className="text-gray-300">
                          Order #{orderData.order_number || orderData.id}
                        </p>
                      </div>

                      <div className="bg-white/10 rounded-lg p-6 mb-6 text-left">
                        <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-300">Subtotal:</span>
                            <span className="text-white">{formatKSH(orderSummary.subtotalBeforeTax)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Shipping:</span>
                            <span className="text-white">{formatKSH(orderSummary.shipping)}</span>
                          </div>
                          <div className="flex justify-between font-semibold pt-2 border-t border-white/20">
                            <span className="text-white">Total:</span>
                            <span className="text-white">{formatKSH(orderSummary.total)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        {/* Download Receipt Button */}
                        <button
                          onClick={downloadReceipt}
                          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                        >
                          <Download className="w-5 h-5" />
                          Download Receipt
                        </button>

                        {/* Track Order Button */}
                        <button
                          onClick={() => navigate(`/customer/orders/${orderData.id}/track`)}
                          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                        >
                          <Truck className="w-5 h-5" />
                          Track Order
                        </button>

                        {/* Continue Shopping */}
                        <button
                          onClick={() => navigate('/shop')}
                          className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
                        >
                          <ShoppingBag className="w-5 h-5" />
                          Continue Shopping
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}

                {currentStep === 2 && !orderPlaced && (
                  <motion.div
                    key="payment"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GlassCard className="p-6">
                      <h2 className="text-2xl font-bold text-white mb-6">Payment Method</h2>
                      
                      {/* Payment Method Selection */}
                      <div className="space-y-3 mb-6">
                        <label
                          className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                            paymentMethod === 'card' 
                              ? 'bg-white/20 border-purple-500' 
                              : 'bg-white/10 border-white/20 hover:bg-white/20'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="card"
                            checked={paymentMethod === 'card'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mr-3"
                          />
                          <CreditCard className="w-5 h-5 text-white mr-3" />
                          <div>
                            <p className="text-white font-medium">Credit/Debit Card</p>
                            <p className="text-gray-200 text-sm">Pay with Visa, Mastercard, etc.</p>
                          </div>
                        </label>
                        
                        <label
                          className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                            paymentMethod === 'mpesa' 
                              ? 'bg-white/20 border-green-500' 
                              : 'bg-white/10 border-white/20 hover:bg-white/20'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="mpesa"
                            checked={paymentMethod === 'mpesa'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mr-3"
                          />
                          <Smartphone className="w-5 h-5 text-green-400 mr-3" />
                          <div>
                            <p className="text-white font-medium">M-Pesa</p>
                            <p className="text-gray-200 text-sm">Pay with mobile money (Kenya)</p>
                          </div>
                        </label>

                        <label
                          className={`flex items-center p-4 rounded-lg border cursor-pointer transition-colors ${
                            paymentMethod === 'cash'
                              ? 'bg-white/20 border-amber-500'
                              : 'bg-white/10 border-white/20 hover:bg-white/20'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash"
                            checked={paymentMethod === 'cash'}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mr-3"
                          />
                          <Package className="w-5 h-5 text-amber-300 mr-3" />
                          <div>
                            <p className="text-white font-medium">Cash</p>
                            <p className="text-gray-200 text-sm">Record an in-person payment and generate a receipt immediately</p>
                          </div>
                        </label>
                      </div>

                      {/* Card Payment Form */}
                      {paymentMethod === 'card' && (
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Card Number
                            </label>
                            <input
                              type="text"
                              required
                              value={paymentInfo.cardNumber}
                              onChange={(e) => setPaymentInfo({...paymentInfo, cardNumber: formatCardNumber(e.target.value)})}
                              maxLength={19}
                              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                              placeholder="1234 5678 9012 3456"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              Cardholder Name
                            </label>
                            <input
                              type="text"
                              required
                              value={paymentInfo.cardName}
                              onChange={(e) => setPaymentInfo({...paymentInfo, cardName: e.target.value})}
                              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                              placeholder="John Doe"
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                Expiry Date
                              </label>
                              <input
                                type="text"
                                required
                                value={paymentInfo.expiryDate}
                                onChange={(e) => setPaymentInfo({...paymentInfo, expiryDate: formatExpiryDate(e.target.value)})}
                                maxLength={5}
                                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                placeholder="MM/YY"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-white mb-2">
                                CVV
                              </label>
                              <input
                                type="text"
                                required
                                value={paymentInfo.cvv}
                                onChange={(e) => setPaymentInfo({...paymentInfo, cvv: e.target.value.replace(/\D/g, '').slice(0, 3)})}
                                maxLength={3}
                                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                                placeholder="123"
                              />
                            </div>
                          </div>

                          <div className="bg-white/10 rounded-lg p-4 flex items-start space-x-3">
                            <Shield className="w-5 h-5 text-green-400 mt-0.5" />
                            <div>
                              <p className="text-white font-medium">Secure Payment</p>
                              <p className="text-gray-200 text-sm">
                                Your payment information is encrypted and secure.
                              </p>
                            </div>
                          </div>

                          <div className="flex space-x-4">
                            <AnimatedButton
                              type="button"
                              onClick={() => setCurrentStep(1)}
                              variant="outline"
                              className="flex-1"
                            >
                              Back
                            </AnimatedButton>
                            <AnimatedButton
                              type="submit"
                              className="flex-1"
                              icon={<ArrowRight className="w-5 h-5" />}
                            >
                              Review Order
                            </AnimatedButton>
                          </div>
                        </form>
                      )}

                      {/* M-Pesa Payment Form */}
                      {paymentMethod === 'mpesa' && (
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                          <div className="bg-gradient-to-r from-green-500/20 to-green-600/20 border border-green-500/30 rounded-lg p-4 mb-4">
                            <p className="text-green-300 font-medium mb-1">M-Pesa Payment</p>
                            <p className="text-white text-sm">You will receive an STK push on your phone to complete payment</p>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-white mb-2">
                              M-Pesa Phone Number
                            </label>
                            <input
                              type="tel"
                              required
                              value={mpesaPhone}
                              onChange={(e) => setMpesaPhone(e.target.value)}
                              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-purple-300 focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                              placeholder="+254 712 345 678"
                            />
                            <p className="text-gray-200 text-xs mt-1">Enter number in format: 254XXXXXXXXX</p>
                          </div>

                          <div className="bg-white/10 rounded-lg p-4">
                            <p className="text-white font-medium mb-2">How it works:</p>
                            <ol className="text-gray-200 text-sm space-y-1 list-decimal list-inside">
                              <li>Click "Review Order" to continue</li>
                              <li>Confirm your order details</li>
                              <li>Click "Place Order" to initiate M-Pesa payment</li>
                              <li>Check your phone for the STK push</li>
                              <li>Enter your M-Pesa PIN to confirm</li>
                            </ol>
                          </div>

                          <div className="flex space-x-4">
                            <AnimatedButton
                              type="button"
                              onClick={() => setCurrentStep(1)}
                              variant="outline"
                              className="flex-1"
                            >
                              Back
                            </AnimatedButton>
                            <AnimatedButton
                              type="submit"
                              className="flex-1 bg-gradient-to-r from-green-500 to-green-600"
                              icon={<ArrowRight className="w-5 h-5" />}
                            >
                              Review Order
                            </AnimatedButton>
                          </div>
                        </form>
                      )}

                      {paymentMethod === 'cash' && (
                        <div className="space-y-4">
                          <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4 mb-4">
                            <p className="text-amber-200 font-medium mb-1">Cash Payment</p>
                            <p className="text-white text-sm">The order will be confirmed immediately and a receipt will be created for printing or download.</p>
                          </div>

                          <div className="bg-white/10 rounded-lg p-4">
                            <p className="text-white font-medium mb-2">Cash handling flow:</p>
                            <ol className="text-gray-200 text-sm space-y-1 list-decimal list-inside">
                              <li>Confirm the order total with the customer</li>
                              <li>Receive the cash amount from the dealer or cashier</li>
                              <li>Click Place Order to confirm and generate the receipt</li>
                            </ol>
                          </div>

                          <div className="flex space-x-4">
                            <AnimatedButton
                              type="button"
                              onClick={() => setCurrentStep(1)}
                              variant="outline"
                              className="flex-1"
                            >
                              Back
                            </AnimatedButton>
                            <AnimatedButton
                              type="button"
                              onClick={() => setCurrentStep(3)}
                              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500"
                              icon={<ArrowRight className="w-5 h-5" />}
                            >
                              Review Order
                            </AnimatedButton>
                          </div>
                        </div>
                      )}
                    </GlassCard>
                  </motion.div>
                )}

                {currentStep === 3 && !orderPlaced && (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <GlassCard className="p-6">
                      <h2 className="text-2xl font-bold text-white mb-6">Review Order</h2>
                      
                      {/* Order Summary */}
                      <div className="space-y-4 mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">Order Items</h3>
                          <div className="space-y-3">
                            {cartItems.map((item) => (
                              <div key={item.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg" />
                                  <div>
                                    <p className="text-white font-medium">{item.name}</p>
                                    <p className="text-gray-200 text-sm">Qty: {item.quantity}</p>
                                  </div>
                                </div>
                                <span className="text-white font-medium">
                                  {formatKSH(item.price * item.quantity)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">Shipping Address</h3>
                          <div className="bg-white/10 rounded-lg p-4">
                            <p className="text-white">
                              {shippingInfo.firstName} {shippingInfo.lastName}
                            </p>
                            <p className="text-gray-200">{shippingInfo.address}</p>
                            <p className="text-gray-200">
                              {shippingInfo.city}, {shippingInfo.state} {shippingInfo.zipCode}
                            </p>
                            <p className="text-gray-200">{shippingInfo.phone}</p>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">Payment Method</h3>
                          <div className="bg-white/10 rounded-lg p-4">
                            {paymentMethod === 'card' ? (
                              <>
                                <p className="text-white">
                                  Card ending in {paymentInfo.cardNumber.slice(-4)}
                                </p>
                                <p className="text-gray-200">{paymentInfo.cardName}</p>
                              </>
                            ) : paymentMethod === 'mpesa' ? (
                              <>
                                <p className="text-white flex items-center">
                                  <Smartphone className="w-4 h-4 mr-2 text-green-400" />
                                  M-Pesa
                                </p>
                                <p className="text-gray-200">{mpesaPhone}</p>
                              </>
                            ) : (
                              <>
                                <p className="text-white flex items-center">
                                  <Package className="w-4 h-4 mr-2 text-amber-300" />
                                  Cash Payment
                                </p>
                                <p className="text-gray-200">Receipt will be generated on completion</p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Payment Status Messages */}
                        {paymentStatus === 'processing' && (
                          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 text-center">
                            <Loader className="w-6 h-6 animate-spin text-blue-400 mx-auto mb-2" />
                            <p className="text-blue-200 font-medium">Processing...</p>
                            <p className="text-blue-300 text-sm">Initiating M-Pesa payment request</p>
                          </div>
                        )}

                        {paymentStatus === 'awaiting_confirmation' && (
                          <div className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg p-4 text-center">
                            <Loader className="w-6 h-6 animate-spin text-indigo-300 mx-auto mb-2" />
                            <p className="text-indigo-100 font-medium">Waiting for payment confirmation...</p>
                            <p className="text-indigo-200 text-sm">Approve the STK push on your phone to complete checkout</p>
                          </div>
                        )}

                        {paymentStatus === 'failed' && (
                          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-center space-y-3">
                            <p className="text-red-200 font-medium">Payment Failed</p>
                            <p className="text-red-300 text-sm">Retry M-Pesa, check status, or switch payment method.</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <AnimatedButton
                                type="button"
                                onClick={handleRetryMpesa}
                                disabled={retryingMpesa || checkingPaymentStatus}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600"
                              >
                                {retryingMpesa ? 'Retrying...' : 'Retry M-Pesa'}
                              </AnimatedButton>
                              <AnimatedButton
                                type="button"
                                onClick={handleManualPaymentCheck}
                                disabled={retryingMpesa || checkingPaymentStatus}
                                className="w-full"
                              >
                                {checkingPaymentStatus ? 'Checking...' : 'Check Status'}
                              </AnimatedButton>
                              <AnimatedButton
                                type="button"
                                onClick={() => {
                                  setPaymentStatus('idle')
                                  setCurrentStep(2)
                                }}
                                variant="outline"
                                className="w-full"
                              >
                                Change Method
                              </AnimatedButton>
                            </div>
                          </div>
                        )}

                        {paymentStatus === 'timeout' && (
                          <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-4 text-center space-y-3">
                            <Loader className="w-6 h-6 animate-spin text-amber-300 mx-auto mb-2" />
                            <p className="text-amber-200 font-medium">Still Waiting for Payment</p>
                            <p className="text-amber-300 text-sm">
                              The payment may take a few minutes to process. Click "Check Status" to verify if your payment was received.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <AnimatedButton
                                type="button"
                                onClick={handleRetryMpesa}
                                disabled={retryingMpesa || checkingPaymentStatus}
                                className="w-full bg-gradient-to-r from-green-500 to-green-600"
                              >
                                {retryingMpesa ? 'Retrying...' : 'Retry M-Pesa'}
                              </AnimatedButton>
                              <AnimatedButton
                                type="button"
                                onClick={handleManualPaymentCheck}
                                disabled={retryingMpesa || checkingPaymentStatus}
                                className="w-full bg-gradient-to-r from-blue-500 to-blue-600"
                                icon={checkingPaymentStatus ? <Loader className="w-4 h-4 animate-spin" /> : null}
                              >
                                {checkingPaymentStatus ? 'Checking...' : 'Check Status'}
                              </AnimatedButton>
                              <AnimatedButton
                                type="button"
                                onClick={() => {
                                  setPaymentStatus('idle')
                                  setCurrentStep(2)
                                }}
                                variant="outline"
                                className="w-full"
                              >
                                Change Method
                              </AnimatedButton>
                            </div>
                          </div>
                        )}

                        <AnimatedButton
                          onClick={handlePlaceOrder}
                          disabled={loading || paymentStatus === 'processing' || paymentStatus === 'awaiting_confirmation'}
                          className="w-full"
                          icon={loading ? <Loader className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
                        >
                          {loading ? 'Placing Order...' : paymentMethod === 'mpesa' ? 'Pay with M-Pesa' : 'Place Order'}
                        </AnimatedButton>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Order Summary Panel */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="sticky top-24"
              >
                <GlassCard className="p-6">
                  <h3 className="text-xl font-bold text-white mb-6">Order Summary</h3>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-white">Subtotal before tax</span>
                      <span className="text-white">{formatKSH(orderSummary.subtotalBeforeTax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">Tax (0%)</span>
                      <span className="text-white">{formatKSH(orderSummary.tax)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white">Shipping</span>
                      <span className="text-white">{formatKSH(orderSummary.shipping)}</span>
                    </div>
                    <div className="border-t border-white/20 pt-4">
                      <div className="flex justify-between">
                        <span className="text-xl font-bold text-white">Total</span>
                        <span className="text-xl font-bold text-white">{formatKSH(orderSummary.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center space-x-2 text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Free returns within 30 days</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Secure payment processing</span>
                    </div>
                    <div className="flex items-center space-x-2 text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="text-sm">24/7 customer support</span>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>
        </motion.main>
      </div>
    </AnimatedBackground>
  )
}

export default CheckoutPage
