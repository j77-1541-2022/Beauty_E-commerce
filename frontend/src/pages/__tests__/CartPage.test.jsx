import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CartPage from '../CartPage'

const mockNavigate = vi.fn()
const mockUpdateQuantity = vi.fn()
const mockRefreshCart = vi.fn()

const cartState = {
  cartItems: [
    {
      id: 1,
      name: 'Lip Gloss',
      price: 500,
      quantity: 1,
      primary_image: '',
      category_name: 'Makeup',
    },
    {
      id: 2,
      name: 'Body Lotion',
      price: 300,
      quantity: 2,
      primary_image: '',
      category_name: 'Skincare',
    },
  ],
}

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
}))

vi.mock('../../contexts/CustomerAuthContext', () => ({
  useCustomerAuth: () => ({ user: { first_name: 'Jane' } }),
}))

vi.mock('../../contexts/CurrencyContext', () => ({
  useCurrency: () => ({
    formatPrice: (value) => `KSh ${Number(value).toLocaleString('en-KE')}`,
  }),
}))

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    currentTheme: {
      background: 'bg-white',
      nav: 'bg-white',
      accent: 'text-pink-600',
      text: 'text-gray-900',
      textMuted: 'text-gray-500',
      card: 'bg-white',
      cardBorder: 'border-gray-200',
      shadow: 'shadow',
      secondary: 'bg-gray-50',
      button: 'bg-pink-600 text-white',
      primaryHover: 'hover:bg-pink-700',
      link: 'text-pink-600 hover:text-pink-800',
    },
  }),
}))

vi.mock('../../contexts/CartContext', () => ({
  useCart: () => ({
    cartItems: cartState.cartItems,
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: (...args) => mockUpdateQuantity(...args),
    clearCart: vi.fn(),
    getCartTotal: () => cartState.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    getCartCount: () => cartState.cartItems.reduce((sum, item) => sum + item.quantity, 0),
    refreshCart: (...args) => mockRefreshCart(...args),
    loading: false,
  }),
}))

vi.mock('../../components/LuxuryBackground', () => ({
  default: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../components/LoadingSpinner', () => ({
  default: () => <div>Loading...</div>,
}))

vi.mock('../../services/orderAPI', () => ({
  default: {},
}))

const renderCartPage = () => {
  return render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>
  )
}

describe('CartPage cart-to-checkout flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cartState.cartItems = [
      {
        id: 1,
        name: 'Lip Gloss',
        price: 500,
        quantity: 1,
        primary_image: '',
        category_name: 'Makeup',
      },
      {
        id: 2,
        name: 'Body Lotion',
        price: 300,
        quantity: 2,
        primary_image: '',
        category_name: 'Skincare',
      },
    ]
  })

  it('calls quantity update handlers and keeps total summary visible', async () => {
    renderCartPage()

    expect(await screen.findByText('Shopping Cart')).toBeInTheDocument()

    expect(screen.getByText('Subtotal (3 items)')).toBeInTheDocument()
    expect(screen.getAllByText('KSh 1,100').length).toBeGreaterThan(0)

    const minusButtons = screen.getAllByRole('button').filter((button) => button.querySelector('svg.lucide-minus'))
    const plusButtons = screen.getAllByRole('button').filter((button) => button.querySelector('svg.lucide-plus'))

    fireEvent.click(minusButtons[0])
    fireEvent.click(plusButtons[0])

    await waitFor(() => {
      expect(mockUpdateQuantity).toHaveBeenCalledWith(1, 2)
    })

    expect(mockUpdateQuantity).toHaveBeenCalledTimes(1)
  }, 15000)

  it('navigates to checkout with cart items and computed total', async () => {
    renderCartPage()

    const checkoutButton = await screen.findByRole('button', { name: /Place Order/i })
    fireEvent.click(checkoutButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/checkout', {
        state: {
          cartItems: cartState.cartItems,
          cartTotal: 1100,
        },
      })
    })
  })
})
