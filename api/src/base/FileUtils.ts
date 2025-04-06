/**
 *  Download image from url and return as Blob
 * @param url url of the image
 * @returns Blob of the image
 */
export const downloadImage =  async (url: string): Promise<Blob | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${url}`)
    }
    
    const blob = await response.blob()
    return blob
  } catch (error) {
    console.warn('Error downloading image:', error)
    return null
  }
}
