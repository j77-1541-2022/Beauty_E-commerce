import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, AlertCircle, Plus, X, Upload, Image as ImageIcon, Check, Trash2, Power, PowerOff, Edit3 } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GlassCard } from '../../components/ui/GlassCard'
import SkeletonLoader from '../../components/ui/SkeletonLoader'
import ImageUploader from '../../components/ImageUploader'
import { dealerAPI, productAPI } from '../../services/apiClient'

const productTypes = [
  { value: 'skincare', label: 'Skincare' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'haircare', label: 'Hair Care' },
  { value: 'fragrance', label: 'Fragrance' },
  { value: 'tools', label: 'Beauty Tools' }
]

const shopCategoryOptions = [
  { slug: 'skincare', label: 'Skincare', productType: 'skincare' },
  { slug: 'makeup', label: 'Makeup', productType: 'makeup' },
  { slug: 'bodycare', label: 'Body Care', productType: 'skincare' },
  { slug: 'haircare', label: 'Hair Care', productType: 'haircare' },
  { slug: 'treatment', label: 'Treatment', productType: 'skincare' },
  { slug: 'fragrance', label: 'Fragrance', productType: 'fragrance' }
]

const normalizeSlug = (value = '') => value.toString().toLowerCase().replace(/[^a-z0-9]/g, '')

const formatApiError = (payload) => {
  if (!payload) return ''
  if (typeof payload === 'string') return payload
  if (Array.isArray(payload)) return payload.filter(Boolean).join(', ')
  if (typeof payload === 'object') {
    if (typeof payload.error === 'string') return payload.error
    if (typeof payload.detail === 'string') return payload.detail

    const details = Object.entries(payload)
      .map(([field, value]) => {
        if (Array.isArray(value)) return `${field}: ${value.join(', ')}`
        if (value && typeof value === 'object') return `${field}: ${JSON.stringify(value)}`
        return `${field}: ${value}`
      })
      .filter((entry) => entry && !entry.endsWith(': undefined'))

    return details.join(' | ')
  }

  return String(payload)
}

const defaultFormState = {
  id: null,
  name: '',
  sku: '',
  price: '',
  unit_price: '',
  description: '',
  product_type: 'skincare',
  category: '',
  brand: '',
  stock_quantity: '',
  reorder_level: '',
  primary_image: null,
  images: [],
  expiry_date: '',
  batch_number: '',
  manufactured_date: '',
  discount: '', // NEW FIELD
}

const DealerProducts = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [formData, setFormData] = useState(defaultFormState)
  const [submitting, setSubmitting] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [selectAll, setSelectAll] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchBrands()
  }, [])

  useEffect(() => {
    if (!products.length) return

    const params = new URLSearchParams(location.search)
    const editId = params.get('edit')
    if (!editId) return

    const targetProduct = products.find((product) => String(product.id) === String(editId))
    if (!targetProduct) return

    setEditingProduct(targetProduct)
    setFormData({
      id: targetProduct.id,
      name: targetProduct.name || '',
      sku: targetProduct.sku || '',
      price: targetProduct.price || '',
      unit_price: targetProduct.unit_price || targetProduct.cost_price || '',
      description: targetProduct.description || '',
      product_type: targetProduct.product_type || 'skincare',
      category: targetProduct.category?.id || targetProduct.category || '',
      brand: targetProduct.brand?.id || targetProduct.brand || '',
      stock_quantity: targetProduct.stock_quantity || '',
      reorder_level: targetProduct.reorder_level || '',
      primary_image: targetProduct.primary_image || null,
      images: targetProduct.images || [],
      expiry_date: targetProduct.expiry_date || '',
      batch_number: targetProduct.batch_number || '',
      manufactured_date: targetProduct.manufactured_date || '',
      discount: targetProduct.discount || '',
    })
    setImagePreview(targetProduct.primary_image || null)
    setShowModal(true)

    params.delete('edit')
    const nextSearch = params.toString()
    navigate(
      {
        pathname: location.pathname,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: true }
    )
  }, [products, location.pathname, location.search, navigate])

  const fetchProducts = async () => {
    try {
      const res = await dealerAPI.getProducts()
      const payload = res.data
      const list = Array.isArray(payload)
        ? payload
        : payload?.results ?? payload?.data ?? []
      setProducts(list)
    } catch (err) {
      console.error('Failed to fetch dealer products:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await productAPI.getCategories()
      const categoryList = Array.isArray(response)
        ? response
        : response?.results || []

      const normalizedApiCategories = categoryList.map((category) => ({
        id: category.id,
        name: category.name,
        slug: normalizeSlug(category.name),
        display_name: category.name
      }))

      const existingSlugs = new Set(normalizedApiCategories.map((category) => category.slug))
      const missingRequiredCategories = shopCategoryOptions
        .filter((category) => !existingSlugs.has(category.slug))
        .map((category) => ({
          id: `name:${category.label}`,
          name: category.label,
          slug: category.slug,
          display_name: category.label
        }))

      setCategories([...normalizedApiCategories, ...missingRequiredCategories])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      setCategories(
        shopCategoryOptions.map((category) => ({
          id: `name:${category.label}`,
          name: category.label,
          slug: category.slug,
          display_name: category.label
        }))
      )
    }
  }

  const fetchBrands = async () => {
    try {
      const response = await productAPI.getBrands()
      const brandList = Array.isArray(response)
        ? response
        : response?.results || []

      setBrands(brandList.map((brand) => ({
        id: brand.id,
        name: brand.name,
        display_name: brand.name
      })))
    } catch (err) {
      console.error('Failed to fetch brands:', err)
      setBrands([
        { id: 1, name: 'Beauty Brand A', display_name: 'Beauty Brand A' },
        { id: 2, name: 'Beauty Brand B', display_name: 'Beauty Brand B' },
        { id: 3, name: 'Beauty Brand C', display_name: 'Beauty Brand C' },
        { id: 4, name: 'Luxury Cosmetics', display_name: 'Luxury Cosmetics' },
        { id: 5, name: 'Natural Beauty', display_name: 'Natural Beauty' }
      ])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    try {
      if (!formData.description?.trim()) {
        setSubmitError('Description is required.')
        return
      }

      const priceValue = parseFloat(formData.price) || 0
      const unitPriceValue = parseFloat(formData.unit_price) || (priceValue * 0.7)
      const productData = {
        name: formData.name,
        sku: formData.sku,
        selling_price: priceValue,
        cost_price: unitPriceValue,
        original_price: priceValue,
        description: formData.description,
        product_type: formData.product_type,
        expiry_date: formData.expiry_date || null,
        batch_number: formData.batch_number || '',
        manufactured_date: formData.manufactured_date || null,
        is_active: true
      }

      if (formData.category) {
        const categoryId = parseInt(formData.category, 10)
        if (!Number.isNaN(categoryId)) {
          productData.category = categoryId
        } else if (String(formData.category).startsWith('name:')) {
          productData.category_name = String(formData.category).replace('name:', '')
        }
      }

      if (formData.brand) {
        const brandId = parseInt(formData.brand, 10)
        if (!Number.isNaN(brandId)) {
          productData.brand = brandId
        }
      }

      let imageUploadWarning = ''

      if (editingProduct) {
        // Update existing product
        await dealerAPI.updateProduct(editingProduct.id, productData)

        // Update inventory if stock data provided
        if (formData.stock_quantity && formData.reorder_level) {
          // Try to find existing inventory first
          try {
            const invRes = await dealerAPI.getInventory()
            const existingInv = invRes.data.find(inv => inv.product === editingProduct.id)
            if (existingInv) {
              await dealerAPI.updateInventory(existingInv.id, {
                stock_quantity: parseInt(formData.stock_quantity),
                reorder_level: parseInt(formData.reorder_level)
              })
            }
          } catch (invErr) {
            console.log('Inventory update skipped:', invErr)
          }
        }

        // Upload new image if provided
        if (formData.primary_image && formData.primary_image instanceof File) {
          const formDataImage = new FormData()
          formDataImage.append('image', formData.primary_image)
          try {
            await dealerAPI.uploadProductImage(editingProduct.id, formDataImage)
          } catch (uploadErr) {
            const serverMessage = formatApiError(uploadErr?.response?.data)
            imageUploadWarning = serverMessage
              ? `Product updated, but image upload failed: ${serverMessage}`
              : 'Product updated, but image upload failed. Please try image upload again.'
            console.error('Image upload failed during update:', uploadErr)
          }
        }
      } else {
        // Create new product
        const productResponse = await dealerAPI.createProduct(productData)
        const newProduct = productResponse.data

        // Create inventory for the product
        if (formData.stock_quantity && formData.reorder_level) {
          await dealerAPI.createInventory({
            product: newProduct.id,
            stock_quantity: parseInt(formData.stock_quantity),
            reorder_level: parseInt(formData.reorder_level)
          })
        }

        // Upload primary image if provided
        if (formData.primary_image) {
          const formDataImage = new FormData()
          formDataImage.append('image', formData.primary_image)
          try {
            await dealerAPI.uploadProductImage(newProduct.id, formDataImage)
          } catch (uploadErr) {
            const serverMessage = formatApiError(uploadErr?.response?.data)
            imageUploadWarning = serverMessage
              ? `Product created, but image upload failed: ${serverMessage}`
              : 'Product created, but image upload failed. You can edit the product and upload the image again.'
            console.error('Image upload failed during create:', uploadErr)
          }
        }
      }

      setShowModal(false)
      setEditingProduct(null)
      setFormData(defaultFormState)
      setImagePreview(null)
      fetchProducts()

      if (imageUploadWarning) {
        alert(imageUploadWarning)
      }
    } catch (err) {
      console.error('Failed to save product:', err)
      const fieldErrors = err?.response?.data || {}
      const firstFieldWithError = Object.keys(fieldErrors).find(
        (key) => Array.isArray(fieldErrors[key]) && fieldErrors[key].length > 0
      )

      if (err?.response?.status === 409) {
        setSubmitError('A product with this SKU already exists. Please use a unique SKU.')
      } else if (err?.response?.data?.sku?.length) {
        setSubmitError(err.response.data.sku[0])
      } else if (firstFieldWithError) {
        setSubmitError(`${firstFieldWithError}: ${fieldErrors[firstFieldWithError][0]}`)
      } else if (err?.response?.data?.error) {
        setSubmitError(err.response.data.error)
      } else {
        setSubmitError('Failed to save product. Please check your details and try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setFormData({
      id: product.id,
      name: product.name || '',
      sku: product.sku || '',
      price: product.price || '',
      unit_price: product.unit_price || product.cost_price || '',
      description: product.description || '',
      product_type: product.product_type || 'skincare',
      category: product.category?.id || product.category || '',
      brand: product.brand?.id || product.brand || '',
      stock_quantity: product.stock_quantity || '',
      reorder_level: product.reorder_level || '',
      primary_image: product.primary_image || null,
      images: product.images || [],
      expiry_date: product.expiry_date || '',
      batch_number: product.batch_number || '',
      manufactured_date: product.manufactured_date || '',
      discount: product.discount || '', // NEW FIELD
    })
    if (product.primary_image) {
      setImagePreview(product.primary_image)
    } else {
      setImagePreview(null)
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingProduct(null)
    setFormData(defaultFormState)
    setImagePreview(null)
    setSubmitError('')
  }

  // Resize image before upload
  const resizeImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.85) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx.drawImage(img, 0, 0, width, height)

          // Convert to blob
          canvas.toBlob((blob) => {
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            })
            resolve(resizedFile)
          }, 'image/jpeg', quality)
        }
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    })
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      // Resize image if it's too large
      let processedFile = file
      if (file.size > 1024 * 1024) { // If larger than 1MB
        processedFile = await resizeImage(file, 1200, 1200, 0.9)
      }

      setFormData({...formData, primary_image: processedFile})
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target.result)
      reader.readAsDataURL(processedFile)
    }
  }

  const handleSelectProduct = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId)
      } else {
        return [...prev, productId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
    setSelectAll(!selectAll)
  }

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return
    
    if (!confirm(`Are you sure you want to delete ${selectedProducts.length} product(s)?`)) {
      return
    }

    try {
      await Promise.all(
        selectedProducts.map(id => dealerAPI.deleteProduct(id))
      )
      setSelectedProducts([])
      setShowBulkActions(false)
      setSelectAll(false)
      fetchProducts()
    } catch (err) {
      console.error('Failed to delete products:', err)
    }
  }

  const handleBulkDeactivate = async () => {
    if (selectedProducts.length === 0) return

    try {
      await Promise.all(
        selectedProducts.map(id => dealerAPI.updateProduct(id, { is_active: false }))
      )
      setSelectedProducts([])
      setShowBulkActions(false)
      setSelectAll(false)
      fetchProducts()
    } catch (err) {
      console.error('Failed to deactivate products:', err)
    }
  }

  const handleBulkActivate = async () => {
    if (selectedProducts.length === 0) return

    try {
      await Promise.all(
        selectedProducts.map(id => dealerAPI.updateProduct(id, { is_active: true }))
      )
      setSelectedProducts([])
      setShowBulkActions(false)
      setSelectAll(false)
      fetchProducts()
    } catch (err) {
      console.error('Failed to activate products:', err)
    }
  }

  useEffect(() => {
    setShowBulkActions(selectedProducts.length > 0)
  }, [selectedProducts])

  const formatKSH = (val) => `KSh ${val?.toLocaleString('en-KE')}`

  const StockProgressBar = ({ current, reorder }) => {
    const max = Math.max(current, reorder * 2, 100)
    const percentage = (current / max) * 100
    return (
      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
        <div
          className={`h-2 rounded-full ${
            current === 0 ? 'bg-red-500' :
            current <= reorder ? 'bg-amber-500' :
            'bg-emerald-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-64" />
          </div>
          <div className="h-10 bg-gray-200 rounded-lg w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonLoader key={i} variant="product" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleSelectAll}
            className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Products</h1>
            <p className="text-gray-600">Manage your product inventory</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {showBulkActions && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50"
          >
            <GlassCard className="flex items-center gap-4 px-6 py-4 shadow-2xl">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-gray-900">
                  {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkActivate}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                  title="Activate selected products"
                >
                  <Power className="w-4 h-4" />
                  Activate
                </button>
                <button
                  onClick={handleBulkDeactivate}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                  title="Deactivate selected products"
                >
                  <PowerOff className="w-4 h-4" />
                  Deactivate
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  title="Delete selected products"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
              <button
                onClick={() => {
                  setSelectedProducts([])
                  setSelectAll(false)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
                  {submitError}
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  {imagePreview && (
                    <div className="w-16 h-16 rounded-lg overflow-hidden border">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (KSh)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (dealer only)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.unit_price}
                  onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Internal cost/unit price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
                <select
                  required
                  value={formData.product_type}
                  onChange={(e) => setFormData({...formData, product_type: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {productTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const selectedCategoryValue = e.target.value
                      const selectedCategory = categories.find(
                        (category) => String(category.id) === String(selectedCategoryValue)
                      )
                      const matchedType = shopCategoryOptions.find(
                        (category) => category.slug === selectedCategory?.slug
                      )

                      setFormData({
                        ...formData,
                        category: selectedCategoryValue,
                        product_type: matchedType?.productType || formData.product_type
                      })
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.display_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">Select Brand</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Level</label>
                  <input
                    type="number"
                    required
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({...formData, reorder_level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
              {/* Expiry Information */}
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Product Expiry Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manufactured Date</label>
                    <input
                      type="date"
                      value={formData.manufactured_date}
                      onChange={(e) => setFormData({...formData, manufactured_date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                  <input
                    type="text"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                    placeholder="e.g., BTCH-2024-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50"
                >
                  {submitting ? (editingProduct ? 'Updating...' : 'Adding...') : (editingProduct ? 'Update Product' : 'Add Product')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Array.isArray(products) ? products : []).map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className={`p-5 ${!product.is_active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => handleSelectProduct(product.id)}
                    className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                    <Package className="w-6 h-6 text-pink-600" />
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  product.stock_quantity === 0 ? 'bg-red-100 text-red-700' :
                  product.stock_quantity <= product.reorder_level ? 'bg-amber-100 text-amber-700' :
                  'bg-emerald-100 text-emerald-700'
                }`}>
                  {product.stock_quantity === 0 ? 'Out of Stock' :
                   product.stock_quantity <= product.reorder_level ? 'Low Stock' :
                   'In Stock'}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-500 mb-3">SKU: {product.sku}</p>
              
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-500">Price</p>
                  <p className="font-semibold">{formatKSH(product.price)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Stock</p>
                  <p className={`font-semibold ${
                    product.stock_quantity <= product.reorder_level ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {product.stock_quantity} units
                  </p>
                </div>
              </div>
              
              <StockProgressBar current={product.stock_quantity} reorder={product.reorder_level} />
              
              {product.stock_quantity <= product.reorder_level && (
                <div className="mt-3 flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>Reorder level: {product.reorder_level}</span>
                </div>
              )}

              {/* Edit Button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEditProduct(product)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Product
                </button>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
      
      {products.length === 0 && (
        <GlassCard className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No products listed yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add Your First Product
          </button>
        </GlassCard>
      )}
    </div>
  )
}

export default DealerProducts
