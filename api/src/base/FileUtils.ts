/**
 *  Download image from url and return as Buffer
 * @param url url of the image
 * @returns Buffer of the image or null if download fails
 */
export const downloadPNGImage = async (url: string): Promise<Buffer | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${url}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch (error) {
    console.warn('Error downloading image:', error)
    return null
  }
}

export type ImageMimeType = 'image/gif' | 'image/jpeg' | 'image/png' | 'image/webp'

/**
 * Detects the MIME type of stored image bytes.
 * @param image image bytes to inspect
 * @returns MIME type suitable for an HTTP Content-Type header
 */
export const detectImageMimeType = (image: Buffer): ImageMimeType => {
  if (image.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return 'image/jpeg'
  }
  if (image.subarray(0, 6).toString('ascii') === 'GIF87a' || image.subarray(0, 6).toString('ascii') === 'GIF89a') {
    return 'image/gif'
  }
  if (image.subarray(0, 4).toString('ascii') === 'RIFF' && image.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp'
  }
  return 'image/png'
}
