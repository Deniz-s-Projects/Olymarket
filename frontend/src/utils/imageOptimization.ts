export interface ImageOptimizationOptions {
  /** Maximum width for the optimized image. */
  maxWidth: number
  /** Maximum height for the optimized image. */
  maxHeight: number
  /** Quality hint passed to the encoder (between 0 and 1). */
  quality: number
}

const DEFAULT_OPTIONS: ImageOptimizationOptions = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
}

const SUPPORTED_OUTPUT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })

const loadImage = (dataUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error("Failed to load image"))
    image.src = dataUrl
  })

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob)
      } else {
        reject(new Error("Failed to optimize image"))
      }
    }, type, quality)
  })

const getTargetDimensions = (width: number, height: number, maxWidth: number, maxHeight: number) => {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height }
  }

  const widthRatio = maxWidth / width
  const heightRatio = maxHeight / height
  const ratio = Math.min(widthRatio, heightRatio)

  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  }
}

const getOutputType = (inputType: string) => {
  if (SUPPORTED_OUTPUT_TYPES.has(inputType)) {
    return inputType
  }
  return "image/jpeg"
}

const updateFileExtension = (fileName: string, mimeType: string) => {
  const extension = (() => {
    switch (mimeType) {
      case "image/jpeg":
        return "jpg"
      case "image/png":
        return "png"
      case "image/webp":
        return "webp"
      default:
        return null
    }
  })()

  if (!extension) {
    return fileName
  }

  if (fileName.toLowerCase().endsWith(`.${extension}`)) {
    return fileName
  }

  const lastDotIndex = fileName.lastIndexOf(".")
  if (lastDotIndex === -1) {
    return `${fileName}.${extension}`
  }

  return `${fileName.slice(0, lastDotIndex)}.${extension}`
}

export const optimizeImage = async (
  file: File,
  options: Partial<ImageOptimizationOptions> = {}
): Promise<File> => {
  if (!file.type.startsWith("image/")) {
    return file
  }

  const { maxWidth, maxHeight, quality } = { ...DEFAULT_OPTIONS, ...options }

  try {
    const dataUrl = await readFileAsDataUrl(file)
    const image = await loadImage(dataUrl)
    const { width, height } = getTargetDimensions(image.width, image.height, maxWidth, maxHeight)

    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext("2d")

    if (!context) {
      return file
    }

    context.drawImage(image, 0, 0, width, height)

    const outputType = getOutputType(file.type)
    const blob = await canvasToBlob(canvas, outputType, quality)
    const optimizedName = updateFileExtension(file.name, blob.type)

    return new File([blob], optimizedName, {
      type: blob.type,
      lastModified: file.lastModified,
    })
  } catch (error) {
    console.warn("Failed to optimize image", error)
    return file
  }
}
