const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const PLACEHOLDER_BY_TYPE = {
  skincare: '/images/placeholders/skincare.svg',
  makeup: '/images/placeholders/makeup.svg',
  bodycare: '/images/placeholders/bodycare.svg',
  haircare: '/images/placeholders/haircare.svg',
  treatment: '/images/placeholders/treatment.svg',
  fragrance: '/images/placeholders/fragrance.svg',
  tools: '/images/placeholders/tools.svg',
  default: '/images/placeholders/skincare.svg',
}

const TYPE_KEYWORDS = {
  tools: ['brush', 'makeup brush', 'applicator', 'comb', 'sponge', 'blender', 'tool', 'set'],
  fragrance: ['fragrance', 'perfume', 'cologne', 'eau', 'scent', 'mist', 'spray'],
  makeup: ['makeup', 'lip', 'lipstick', 'mascara', 'foundation', 'blush', 'eyeliner', 'palette', 'concealer', 'powder'],
  haircare: ['hair', 'shampoo', 'conditioner', 'curl', 'scalp', 'leave in', 'hair oil', 'hair mask'],
  bodycare: ['body', 'lotion', 'butter', 'scrub', 'soap', 'body wash', 'shower gel', 'body cream'],
  treatment: ['treatment', 'serum', 'mask', 'peel', 'repair', 'acne', 'spot', 'ampoule', 'essence'],
  skincare: ['skin', 'cleanser', 'moisturizer', 'moisturiser', 'cream', 'toner', 'sunscreen', 'spf', 'face wash'],
}

export const normalizeText = (value = '') => value.toString().toLowerCase().trim()

export const normalizeMediaUrl = (imageUrl) => {
  if (!imageUrl) return null
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
    return imageUrl
  }
  if (imageUrl.startsWith('/media/')) {
    return `${BACKEND_BASE_URL}${imageUrl}`
  }
  return imageUrl
}

export const isGeneratedPlaceholder = (imageUrl = '') => {
  const image = normalizeText(imageUrl)
  return image.includes('picsum.photos') || image.includes('placehold.co') || image.includes('placeholder')
}

export const inferProductType = (product = {}) => {
  const typeText = normalizeText(product.product_type || product.type)
  const categoryText = normalizeText(
    product.category_name || product.category?.name || product.category?.slug || product.category || ''
  )
  const nameText = normalizeText(product.name)
  const combined = `${typeText} ${categoryText} ${nameText}`

  if (combined.includes('body care') || combined.includes('bodycare')) return 'bodycare'
  if (combined.includes('hair care') || combined.includes('haircare')) return 'haircare'

  for (const [type, keywords] of Object.entries(TYPE_KEYWORDS)) {
    if (keywords.some((keyword) => combined.includes(keyword))) {
      return type
    }
  }

  if (typeText in PLACEHOLDER_BY_TYPE) return typeText
  if (categoryText in PLACEHOLDER_BY_TYPE) return categoryText
  return 'default'
}

export const getProductPlaceholder = (product = {}) => {
  const type = inferProductType(product)
  return PLACEHOLDER_BY_TYPE[type] || PLACEHOLDER_BY_TYPE.default
}

export const resolveProductImage = (product = {}) => {
  const rawImage = product.image || product.primary_image || product.image_url || null
  const normalizedImage = normalizeMediaUrl(rawImage)

  if (normalizedImage && !isGeneratedPlaceholder(normalizedImage)) {
    return normalizedImage
  }

  return getProductPlaceholder(product)
}
