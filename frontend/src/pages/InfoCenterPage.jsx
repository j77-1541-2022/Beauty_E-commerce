import React, { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, HelpCircle, Phone, PackageCheck, CreditCard, Ruler, Truck, Star, MessageSquare, FileText, ShoppingBag, Mail } from 'lucide-react'
import Footer from '../components/Footer'

const sections = [
  {
    id: 'about-us',
    title: 'About Us',
    icon: FileText,
    content: 'Glow Beyond Beauty curates premium beauty products from trusted dealers across Kenya. Our focus is quality, transparency, and helping customers find products that truly match their needs.',
  },
  {
    id: 'contact',
    title: 'Contact',
    icon: Mail,
    content: 'Reach us via WhatsApp at +254 111 551 064 or email us through Gmail at simonekinyua8@gmail.com. Our support team responds during business hours, Monday to Saturday.',
  },
  {
    id: 'faq',
    title: 'FAQ',
    icon: HelpCircle,
    content: 'Common questions include payment timing, delivery windows, returns, and product authenticity. If your question is not listed, use the contact section and we will help quickly.',
  },
  {
    id: 'beauty-blog',
    title: 'Beauty Blog',
    icon: BookOpen,
    content: 'Our beauty blog covers skincare routines, makeup application guides, seasonal care tips, and ingredient explainers for smarter product choices.',
  },
  {
    id: 'customer-service',
    title: 'Customer Service',
    icon: Phone,
    content: 'Customer service helps with account support, order assistance, payment follow-up, and product concerns. We aim for clear and practical resolution on every request.',
  },
  {
    id: 'shipping-returns',
    title: 'Shipping & Returns',
    icon: Truck,
    content: 'Shipping timelines depend on destination and stock availability. Returns are accepted according to the product condition and return policy terms communicated at checkout.',
  },
  {
    id: 'size-guide',
    title: 'Size Guide',
    icon: Ruler,
    content: 'Use the size guide to choose the right product volume and variant. Compare quantities and usage frequency to find the best value for your routine.',
  },
  {
    id: 'payment-methods',
    title: 'Payment Methods',
    icon: CreditCard,
    content: 'Supported payment methods include M-Pesa and available checkout options configured in your region. Payment confirmation appears in your order timeline after processing.',
  },
  {
    id: 'track-order',
    title: 'Track Order',
    icon: PackageCheck,
    content: 'Track your order status from placement through fulfillment in the Orders page. If you are not logged in, sign in first to access your order history securely.',
  },
  {
    id: 'customer-reviews',
    title: 'Customer Reviews',
    icon: Star,
    content: 'Customer reviews help other shoppers understand real product experience. Ratings and comments are moderated for authenticity and relevance.',
  },
]

const InfoCenterPage = () => {
  const location = useLocation()

  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.replace('#', '')
    const section = document.getElementById(id)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [location.hash])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Help & Information Center</h1>
            <p className="text-slate-600 text-sm">Everything linked from the footer in one place.</p>
          </div>
          <Link to="/shop" className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
            <ShoppingBag className="w-4 h-4" />
            Back to Shop
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 space-y-6">
        {sections.map(({ id, title, icon: Icon, content }) => (
          <section key={id} id={id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm scroll-mt-28">
            <div className="flex items-center gap-3 mb-3">
              <Icon className="w-5 h-5 text-pink-600" />
              <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            <p className="text-slate-700 leading-relaxed">{content}</p>
            {id === 'track-order' && (
              <div className="mt-4">
                <Link to="/orders" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                  <MessageSquare className="w-4 h-4" />
                  Open Orders Page
                </Link>
              </div>
            )}
          </section>
        ))}
      </main>

      <Footer />
    </div>
  )
}

export default InfoCenterPage
