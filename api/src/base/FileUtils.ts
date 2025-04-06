/**
 *  Download image from url and return as File
 * @param url url of the image
 * @returns File of the image
 */
export const downloadImage =  async (url: string): Promise<File | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch image from ${url}`)
    }
    
    const blob = await response.blob()
    const file = new File([blob], url.split('/').pop() || `image.${blob.type.split('/')[1]}`, { type: blob.type })
    return file
  } catch (error) {
    console.warn('Error downloading image:', error)
    return null
  }
}
