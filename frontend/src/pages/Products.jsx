import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Package,
  DollarSign,
  Tag,
  Camera,
  Upload,
  X,
  Image as ImageIcon
} from 'lucide-react'
import { productsAPI } from '../services/apiClient'
import LoadingSpinner from '../components/LoadingSpinner'

const Products = () => {
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewImages, setPreviewImages] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    product_type: 'skincare',
    category: '',
    brand: '',
    cost_price: '',
    selling_price: '',
    is_active: true
  })

  const productTypes = [
    { value: 'skincare', label: 'Skincare' },
    { value: 'makeup', label: 'Makeup' },
    { value: 'haircare', label: 'Haircare' },
    { value: 'fragrance', label: 'Fragrance' },
    { value: 'tools', label: 'Beauty Tools' },
  ]

  useEffect(() => {
    fetchData()
  }, [searchTerm, selectedCategory, selectedBrand])

  // Handle query params - auto-open add modal if action=add
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'add') {
      setSelectedProduct(null)
      setFormData({
        name: '',
        description: '',
        sku: '',
        product_type: 'skincare',
        category: '',
        brand: '',
        cost_price: '',
        selling_price: '',
        is_active: true
      })
      setShowModal(true)
    }
  }, [searchParams])

  const fetchData = async () => {
    try {
      const params = {}
      if (searchTerm) params.search = searchTerm
      if (selectedCategory) params.category = selectedCategory
      if (selectedBrand) params.brand = selectedBrand

      const [productsRes, categoriesRes, brandsRes] = await Promise.all([
        productsAPI.getProducts(params),
        productsAPI.getCategories(),
        productsAPI.getBrands()
      ])

      setProducts(productsRes.results || productsRes.data || [])
      setCategories(categoriesRes.results || categoriesRes.data || [])
      setBrands(brandsRes.results || brandsRes.data || [])
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (selectedProduct) {
        await productsAPI.updateProduct(selectedProduct.id, formData)
      } else {
        await productsAPI.createProduct(formData)
      }
      setShowModal(false)
      setSelectedProduct(null)
      setFormData({
        name: '',
        description: '',
        sku: '',
        product_type: 'skincare',
        category: '',
        brand: '',
        cost_price: '',
        selling_price: '',
        is_active: true
      })
      fetchData()
    } catch (error) {
      console.error('Failed to save product:', error)
    }
  }

  const handleEdit = (product) => {
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      description: product.description,
      sku: product.sku,
      product_type: product.product_type,
      category: product.category,
      brand: product.brand,
      cost_price: product.cost_price,
      selling_price: product.selling_price,
      is_active: product.is_active
    })
    setShowModal(true)
  }

  const handleDelete = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.deleteProduct(productId)
        fetchData()
      } catch (error) {
        console.error('Failed to delete product:', error)
      }
    }
  }

  // Image handling functions
  const handleImageUpload = async (productId, imageFile) => {
    if (!imageFile) return

    const formData = new FormData()
    formData.append('image', imageFile)

    try {
      setUploadingImage(true)
      await productsAPI.uploadImage(productId, formData)
      fetchData() // Refresh products to show new image
      alert('Image uploaded successfully!')
    } catch (error) {
      console.error('Failed to upload image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))

    if (imageFiles.length === 0) {
      alert('Please select valid image files')
      return
    }

    // Create preview URLs
    const previews = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }))

    setPreviewImages(previews)
  }

  const handleUploadImages = async () => {
    if (!selectedProduct || previewImages.length === 0) return

    for (const imageObj of previewImages) {
      await handleImageUpload(selectedProduct.id, imageObj.file)
    }

    setShowImageModal(false)
    setPreviewImages([])
  }

  const handleManageImages = (product) => {
    setSelectedProduct(product)
    setShowImageModal(true)
    setPreviewImages([])
  }

  const removePreviewImage = (index) => {
    const newPreviews = previewImages.filter((_, i) => i !== index)
    setPreviewImages(newPreviews)
  }

  const getProductImageUrl = (product) => {
    if (product.primary_image) {
      // If it's a full URL, return as is
      if (product.primary_image.startsWith('http')) {
        return product.primary_image
      }
      // If it's a relative path, construct full URL
      return `http://localhost:8000${product.primary_image}`
    }
    // Default placeholder
    return 'https://via.placeholder.com/300x300/e0e7ff/6366f1?text=No+Image'
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">Products</h1>
          <p className="text-gray-600">Manage your beauty product catalog</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="input-field"
          >
            <option value="">All Brands</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>{brand.name}</option>
            ))}
          </select>

          <button className="btn-secondary flex items-center justify-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="glass-card p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="aspect-square bg-gradient-to-br from-primary-100 to-secondary-100 rounded-lg mb-4 overflow-hidden relative group">
              <img
                src={getProductImageUrl(product)}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300x300/e0e7ff/6366f1?text=No+Image'
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 rounded-lg flex items-center justify-center">
                <button
                  onClick={() => handleManageImages(product)}
                  className="opacity-0 group-hover:opacity-100 bg-white text-gray-800 p-2 rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-all duration-300"
                  title="Manage Images"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
              <p className="text-sm text-gray-600">{product.sku}</p>

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-primary-600">${product.selling_price}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Tag className="w-3 h-3" />
                <span>{product.category_name || 'No category'}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleEdit(product)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm">Edit</span>
              </button>
              <button
                onClick={() => handleManageImages(product)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm">Photos</span>
              </button>
              <button
                onClick={() => handleDelete(product.id)}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span className="text-sm">Delete</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold gradient-text mb-6">
              {selectedProduct ? 'Edit Product' : 'Add New Product'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Type</label>
                  <select
                    value={formData.product_type}
                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                    className="input-field"
                  >
                    {productTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                  <select
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select Brand</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cost Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Selling Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Product is active</label>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {selectedProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* Image Upload Modal */}
      {showImageModal && selectedProduct && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowImageModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Manage Product Images</h2>
                <p className="text-gray-600 mt-1">Upload and manage photos for {selectedProduct.name}</p>
              </div>
              <button
                onClick={() => setShowImageModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Image Preview */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Current Image</h3>
              <div className="flex items-center space-x-4">
                <img
                  src={getProductImageUrl(selectedProduct)}
                  alt={selectedProduct.name}
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Primary product image</p>
                  <p className="text-xs text-gray-500 mt-1">Upload new images to replace the current one</p>
                </div>
              </div>
            </div>

            {/* Upload Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Upload New Images</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center space-y-3"
                >
                  <div className="p-4 bg-primary-100 rounded-full">
                    <Upload className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900">Click to upload images</p>
                    <p className="text-sm text-gray-500">or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 10MB each</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview Section */}
            {previewImages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Preview ({previewImages.length} images)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previewImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.preview}
                        alt={image.name}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                      />
                      <button
                        onClick={() => removePreviewImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-gray-500 mt-1 truncate">{image.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowImageModal(false)}
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUploadImages}
                disabled={previewImages.length === 0 || uploadingImage}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {uploadingImage ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload {previewImages.length} Images</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

export default Products
