export const downloadImage =  async (url: string): Promise<Buffer | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${url}`)
    }
    
    const buffer = await response.arrayBuffer()
    return Buffer.from(buffer)
  } catch (error) {
    console.warn('Error downloading image:', error)
    return null
  }
}
