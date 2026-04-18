import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CheckoutPage from '../CheckoutPage'

const mockNavigate = vi.fn()
const mockShowNotification = vi.fn()
const mockHandleError = vi.fn()
const mockSetLoading = vi.fn()

const mockGetCart = vi.fn()
const mockOrderCreate = vi.fn()
const mockPaymentInitiate = vi.fn()
const mockPaymentStatus = vi.fn()
const mockRecordCash = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: () => ({ children, whileHover, whileTap, initial, animate, exit, transition, ...props }) => (
        <div {...props}>{children}</div>
      ),
    }
  ),
  AnimatePresence: ({ children }) => <>{children}</>,
}))

vi.mock('../../contexts/CustomerAuthContext', () => ({
  useCustomerAuth: () => ({
    user: {
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone: '0712345678',
    },
  }),
}))

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ isDark: false }),
}))

vi.mock('../../contexts/NotificationContext', () => ({
  useNotification: () => ({ showNotification: mockShowNotification }),
}))

vi.mock('../../contexts/ErrorHandlerContext', () => ({
  useErrorHandler: () => ({
    handleError: mockHandleError,
    setLoading: mockSetLoading,
  }),
}))

vi.mock('../../services/cartAPI', () => ({
  cartAPI: {
    getCart: (...args) => mockGetCart(...args),
  },
}))

vi.mock('../../services/apiClient', () => ({
  orderAPI: {
    create: (...args) => mockOrderCreate(...args),
  },
  paymentAPI: {
    initiate: (...args) => mockPaymentInitiate(...args),
    getStatus: (...args) => mockPaymentStatus(...args),
    recordCash: (...args) => mockRecordCash(...args),
  },
}))

vi.mock('../../components/AnimatedBackground', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../components/BeautyLogo', () => ({
  default: () => <div>Logo</div>,
}))

vi.mock('../../components/LoadingSpinner', () => ({
  default: () => <div>Loading...</div>,
}))

vi.mock('../../components/ui/GlassCard', () => ({
  GlassCard: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../components/ui/AnimatedButton', () => ({
  default: ({ children, icon, ...props }) => (
    <button {...props}>
      {children}
      {icon}
    </button>
  ),
}))

const renderCheckout = () => {
  return render(
    <MemoryRouter>
      <CheckoutPage />
    </MemoryRouter>
  )
}

const completeShippingAndPaymentSteps = async () => {
  await waitFor(() => {
    expect(screen.getByText('Shipping Information')).toBeInTheDocument()
  })

  fireEvent.change(screen.getByPlaceholderText('Estate / landmark in Kenya'), {
    target: { value: 'Ngong Road' },
  })
  fireEvent.change(screen.getByPlaceholderText('Nairobi'), { target: { value: 'Nairobi' } })
  fireEvent.change(screen.getByPlaceholderText('Nairobi County'), {
    target: { value: 'Nairobi County' },
  })
  fireEvent.change(screen.getByPlaceholderText('00100'), { target: { value: '00100' } })

  fireEvent.click(screen.getByRole('button', { name: /Continue to Payment/i }))

  await waitFor(() => {
    expect(screen.getByText('Payment Method')).toBeInTheDocument()
  })

  fireEvent.change(screen.getByPlaceholderText('+254 712 345 678'), {
    target: { value: '0712345678' },
  })

  fireEvent.click(screen.getByRole('button', { name: /Review Order/i }))

  await waitFor(() => {
    expect(screen.getByText('Review Order')).toBeInTheDocument()
  })
}

describe('CheckoutPage payment flows', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetCart.mockResolvedValue({
      items: [
        {
          product: {
            id: 1,
            name: 'Lip Gloss',
            price: 500,
            selling_price: 500,
          },
          quantity: 1,
        },
      ],
      total_items: 1,
      total_price: 500,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('completes checkout when M-Pesa payment is confirmed', async () => {
    mockOrderCreate.mockResolvedValue({ data: { data: { order: { id: 101 } } } })
    mockPaymentInitiate.mockResolvedValue({
      data: { data: { payment: { checkout_request_id: 'ws_CO_123' } } },
    })
    mockPaymentStatus.mockResolvedValue({
      data: { data: { payment: { status: 'completed' } } },
    })

    vi.spyOn(global, 'setInterval').mockImplementation((cb) => {
      Promise.resolve().then(() => cb())
      return 1
    })
    vi.spyOn(global, 'clearInterval').mockImplementation(() => {})

    renderCheckout()
    await completeShippingAndPaymentSteps()

    fireEvent.click(screen.getByRole('button', { name: /Pay with M-Pesa/i }))

    await waitFor(() => {
      expect(screen.getByText(/Order Placed Successfully!/i)).toBeInTheDocument()
    })

    expect(mockOrderCreate).toHaveBeenCalledTimes(1)
    expect(mockPaymentInitiate).toHaveBeenCalledTimes(1)
    expect(mockPaymentStatus).toHaveBeenCalled()
  }, 20000)

  it('shows timeout recovery actions when payment confirmation does not arrive', async () => {
    mockOrderCreate.mockResolvedValue({ data: { data: { order: { id: 202 } } } })
    mockPaymentInitiate.mockResolvedValue({
      data: { data: { payment: { checkout_request_id: 'ws_CO_456' } } },
    })
    mockPaymentStatus.mockResolvedValue({
      data: { data: { payment: { status: 'pending' } } },
    })

    vi.spyOn(global, 'setInterval').mockImplementation((cb) => {
      Promise.resolve().then(async () => {
        for (let i = 0; i < 40; i++) {
          await cb()
        }
      })
      return 1
    })
    vi.spyOn(global, 'clearInterval').mockImplementation(() => {})

    renderCheckout()
    await completeShippingAndPaymentSteps()

    fireEvent.click(screen.getByRole('button', { name: /Pay with M-Pesa/i }))

    await waitFor(() => {
      expect(screen.getByText(/Payment Timeout/i)).toBeInTheDocument()
    })

    const retryButton = screen.getByRole('button', { name: /Retry M-Pesa/i })
    const statusButton = screen.getByRole('button', { name: /Check Status/i })
    const changeButton = screen.getByRole('button', { name: /Change Method/i })

    expect(retryButton).toBeInTheDocument()
    expect(statusButton).toBeInTheDocument()
    expect(changeButton).toBeInTheDocument()

    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(mockPaymentInitiate).toHaveBeenCalledTimes(2)
    })
  }, 20000)

  it('handles 401 order creation failure by surfacing fallback messaging', async () => {
    mockOrderCreate.mockRejectedValue({
      response: {
        status: 401,
        data: { message: 'Session expired' },
      },
    })

    renderCheckout()
    await completeShippingAndPaymentSteps()

    fireEvent.click(screen.getByRole('button', { name: /Pay with M-Pesa/i }))

    await waitFor(() => {
      expect(mockHandleError).toHaveBeenCalled()
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Failed to place order. Please review your details and try again.',
        'error'
      )
    })

    expect(screen.queryByText(/Order Placed Successfully!/i)).not.toBeInTheDocument()
  }, 20000)

  it('handles payment initiation server failure and shows checkout error message', async () => {
    mockOrderCreate.mockResolvedValue({ data: { data: { order: { id: 303 } } } })
    mockPaymentInitiate.mockRejectedValue({
      response: {
        status: 500,
        data: { message: 'Internal server error' },
      },
    })

    renderCheckout()
    await completeShippingAndPaymentSteps()

    fireEvent.click(screen.getByRole('button', { name: /Pay with M-Pesa/i }))

    await waitFor(() => {
      expect(mockPaymentInitiate).toHaveBeenCalledTimes(1)
      expect(mockShowNotification).toHaveBeenCalledWith(
        'Unable to retry M-Pesa request right now.',
        'error'
      )
    })

    expect(screen.queryByText(/Order Placed Successfully!/i)).not.toBeInTheDocument()
  }, 20000)
})
