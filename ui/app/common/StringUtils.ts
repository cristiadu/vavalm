import DOMPurify from "dompurify"

export const asWord = (key: string): string => {
  const words = key.split('_')
  const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1))
  const formattedString = capitalizedWords.join(' ')
  return formattedString
}

export const asSafeHTML = (description: string): string => {
  // Sanitize HTML content
  return DOMPurify.sanitize(description)
}

/**
 * Strips all HTML tags from a string, returning plain text.
 * Uses DOMPurify for safe sanitization to avoid incomplete multi-character sanitization vulnerabilities.
 */
export const stripHtmlTags = (html: string): string => {
  // First sanitize with DOMPurify, then strip remaining allowed tags
  const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] })
  return sanitized
}

export const asFormattedDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(new Date(date))
}
