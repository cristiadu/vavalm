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
