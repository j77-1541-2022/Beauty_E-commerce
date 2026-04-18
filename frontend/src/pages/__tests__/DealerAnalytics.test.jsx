import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DealerAnalytics from '../dealer/DealerAnalytics'

const mockGetProducts = vi.fn()
const mockGetDemandForecast = vi.fn()
const mockGetABCAnalysis = vi.fn()
const mockGetEOQ = vi.fn()
const mockGetReorderRecommendations = vi.fn()

vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: () => ({ children, initial, animate, exit, transition, whileHover, whileTap, ...props }) => (
        <div {...props}>{children}</div>
      ),
    }
  ),
}))

vi.mock('../../components/ui/GlassCard', () => ({
  GlassCard: ({ children }) => <div>{children}</div>,
}))

vi.mock('../../components/ui/SkeletonLoader', () => ({
  default: () => <div>Loading...</div>,
}))

vi.mock('recharts', () => {
  const Box = ({ children }) => <div>{children}</div>

  return {
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
    ComposedChart: ({ children }) => <div data-testid="composed-chart">{children}</div>,
    CartesianGrid: Box,
    XAxis: Box,
    YAxis: Box,
    Tooltip: Box,
    Legend: Box,
    Area: Box,
    Line: Box,
    Bar: Box,
    ReferenceLine: Box,
    Cell: Box,
  }
})

vi.mock('../../services/apiClient', () => ({
  dealerAPI: {
    getProducts: (...args) => mockGetProducts(...args),
    getDemandForecast: (...args) => mockGetDemandForecast(...args),
    getABCAnalysis: (...args) => mockGetABCAnalysis(...args),
    getEOQ: (...args) => mockGetEOQ(...args),
    getReorderRecommendations: (...args) => mockGetReorderRecommendations(...args),
  },
}))

const renderDealerAnalytics = () => {
  return render(
    <MemoryRouter>
      <DealerAnalytics />
    </MemoryRouter>
  )
}

describe('DealerAnalytics charts', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockGetProducts.mockResolvedValue({
      data: {
        results: [
          { id: 1, name: 'Lip Gloss' },
          { id: 2, name: 'Body Lotion' },
        ],
      },
    })

    mockGetABCAnalysis.mockResolvedValue({
      data: {
        abc_data: [
          {
            product_name: 'Lip Gloss',
            sales_value: 12000,
            cumulative_percentage: 70,
            classification: 'A',
          },
          {
            product_name: 'Body Lotion',
            sales_value: 5000,
            cumulative_percentage: 95,
            classification: 'B',
          },
        ],
        summary: {
          a_count: 1,
          b_count: 1,
          c_count: 0,
          a_value: 12000,
          b_value: 5000,
          c_value: 0,
        },
      },
    })

    mockGetReorderRecommendations.mockResolvedValue({
      data: {
        recommendations: [],
      },
    })

    mockGetEOQ.mockResolvedValue({
      data: {
        eoq_data: [],
      },
    })
  })

  it('renders demand forecast chart after generating forecast for a selected product', async () => {
    mockGetDemandForecast.mockResolvedValue({
      data: {
        product_name: 'Lip Gloss',
        alpha: 0.3,
        historical_data: [
          {
            date: '2026-04-01',
            actual: 6,
            forecast: 6,
            lower: 4.8,
            upper: 7.2,
          },
        ],
        future_forecast: [
          {
            date: '2026-04-02',
            forecast: 7,
            lower: 5.6,
            upper: 8.4,
          },
        ],
      },
    })

    renderDealerAnalytics()

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Demand Forecast' })).toBeInTheDocument()
    })

    const productSelect = screen.getByRole('combobox')
    fireEvent.change(productSelect, { target: { value: '1' } })

    fireEvent.click(screen.getByRole('button', { name: /Generate Forecast/i }))

    await waitFor(() => {
      expect(mockGetDemandForecast).toHaveBeenCalledWith('1')
    })

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Lip Gloss' })).toBeInTheDocument()
      expect(screen.getByTestId('area-chart')).toBeInTheDocument()
    })
  })

  it('renders ABC Pareto chart section with summary after switching to ABC tab', async () => {
    renderDealerAnalytics()

    fireEvent.click(screen.getByRole('button', { name: /ABC Analysis/i }))

    await waitFor(() => {
      expect(screen.getByText('ABC Analysis (Pareto Chart)')).toBeInTheDocument()
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument()
    })

    expect(screen.getByText('A Items (80%)')).toBeInTheDocument()
    expect(screen.getByText('B Items (15%)')).toBeInTheDocument()
  })

  it('calculates EOQ for a selected product using current parameter inputs', async () => {
    mockGetEOQ.mockResolvedValue({
      data: {
        annual_demand: 365,
        eoq: 120,
        reorder_point: 10,
        safety_stock: 3,
        costs: {
          unit_cost: 500,
          ordering_cost: 700,
          holding_cost_percent: 25,
          annual_ordering_cost: 1200,
          annual_holding_cost: 900,
          total_annual_cost: 2100,
        },
      },
    })

    renderDealerAnalytics()

    fireEvent.click(screen.getByRole('button', { name: /EOQ Calculator/i }))

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Lip Gloss' })).toBeInTheDocument()
    })

    const eoqSelect = screen.getByRole('combobox')
    fireEvent.change(eoqSelect, { target: { value: '1' } })

    const numericInputs = screen.getAllByRole('spinbutton')
    fireEvent.change(numericInputs[0], { target: { value: '700' } })
    fireEvent.change(numericInputs[1], { target: { value: '25' } })

    const calculateButton = screen.getByRole('button', { name: /Calculate EOQ/i })
    await waitFor(() => {
      expect(calculateButton).toBeEnabled()
    })
    fireEvent.click(calculateButton)

    await waitFor(() => {
      expect(mockGetEOQ).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          ordering_cost: '700',
          holding_cost_percent: 20,
          lead_time: 7,
          safety_days: 3,
        })
      )
    })

    await waitFor(() => {
      expect(screen.getByText('Optimal Order Quantity (EOQ)')).toBeInTheDocument()
      expect(screen.getByText('Cost Analysis')).toBeInTheDocument()
    })
  })

  it('shows reorder recommendation details and restock link when tab is opened', async () => {
    mockGetReorderRecommendations.mockResolvedValue({
      data: {
        recommendations: [
          {
            product_id: 44,
            product_name: 'Shea Butter',
            current_stock: 2,
            reorder_level: 10,
            suggested_order_quantity: 18,
            urgency: 'Critical',
            estimated_order_value: 5400,
            supplier_email: 'supplier@example.com',
          },
        ],
        total_suggested_value: 5400,
        critical_count: 1,
        high_count: 0,
        medium_count: 0,
      },
    })

    renderDealerAnalytics()

    await waitFor(() => {
      expect(mockGetReorderRecommendations).toHaveBeenCalled()
    })

    fireEvent.click(screen.getByRole('button', { name: /Reorder Recommendations/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Reorder Recommendations' })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Shea Butter' })).toBeInTheDocument()
      expect(screen.getByText('Critical')).toBeInTheDocument()
    })

    const restockLink = screen.getByRole('link', { name: /Restock/i })
    expect(restockLink).toHaveAttribute('href', '/dealer/products?edit=44')
    expect(screen.getByRole('link', { name: 'supplier@example.com' })).toHaveAttribute('href', 'mailto:supplier@example.com')
  })

  it('keeps forecast fallback UI when forecast API fails', async () => {
    mockGetDemandForecast.mockRejectedValue(new Error('Forecast API error'))

    renderDealerAnalytics()

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Lip Gloss' })).toBeInTheDocument()
    })

    const productSelect = screen.getByRole('combobox')
    fireEvent.change(productSelect, { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: /Generate Forecast/i }))

    await waitFor(() => {
      expect(mockGetDemandForecast).toHaveBeenCalledWith('1')
    })

    expect(screen.getByText('Select a product to generate demand forecast')).toBeInTheDocument()
    expect(screen.queryByTestId('area-chart')).not.toBeInTheDocument()
  })

  it('does not allow EOQ calculation without selecting a product', async () => {
    renderDealerAnalytics()

    fireEvent.click(screen.getByRole('button', { name: /EOQ Calculator/i }))

    const calculateButton = screen.getByRole('button', { name: /Calculate EOQ/i })
    expect(calculateButton).toBeDisabled()

    fireEvent.click(calculateButton)
    expect(mockGetEOQ).not.toHaveBeenCalled()
  })

  it('shows healthy inventory empty-state when reorder API returns no recommendations', async () => {
    mockGetReorderRecommendations.mockResolvedValue({
      data: {
        recommendations: [],
        total_suggested_value: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
      },
    })

    renderDealerAnalytics()

    fireEvent.click(screen.getByRole('button', { name: /Reorder Recommendations/i }))

    await waitFor(() => {
      expect(screen.getByText('All inventory levels are healthy!')).toBeInTheDocument()
      expect(screen.getByText('No products require reordering at this time.')).toBeInTheDocument()
    })
  })
})
