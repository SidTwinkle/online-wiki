/**
 * Composable for search result highlighting functionality
 * Provides utilities for highlighting search terms in text content
 */
export const useSearchHighlight = () => {
  
  /**
   * Highlights search terms in text with HTML mark tags
   * @param text - The text to highlight
   * @param query - The search query containing terms to highlight
   * @returns HTML string with highlighted terms
   */
  const highlightText = (text: string, query: string): string => {
    if (!text || !query) return text

    // Split query into individual terms and filter out empty ones
    const terms = query.trim().toLowerCase().split(/\s+/).filter(term => term.length > 0)
    
    if (terms.length === 0) return text

    // Escape special regex characters and create pattern
    const pattern = terms.map(term => 
      term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    ).join('|')
    
    const regex = new RegExp(`(${pattern})`, 'gi')
    
    return text.replace(regex, '<mark class="search-highlight">$1</mark>')
  }

  /**
   * Creates an optimized snippet from content with highlighted search terms
   * @param content - The full content to create snippet from
   * @param query - The search query
   * @param maxLength - Maximum length of the snippet (default: 200)
   * @returns HTML string with highlighted snippet
   */
  const createHighlightedSnippet = (content: string, query: string, maxLength: number = 200): string => {
    if (!content || !query) return content

    if (content.length <= maxLength) {
      return highlightText(content, query)
    }

    // Find the best snippet around search terms
    const terms = query.trim().toLowerCase().split(/\s+/).filter(term => term.length > 0)
    const lowerContent = content.toLowerCase()
    
    let bestIndex = -1
    let bestScore = 0
    
    // Find the position with the most search terms nearby
    for (const term of terms) {
      let index = lowerContent.indexOf(term)
      while (index !== -1) {
        let score = 0
        const start = Math.max(0, index - 100)
        const end = Math.min(content.length, index + 100)
        const snippet = lowerContent.substring(start, end)
        
        // Count how many terms appear in this snippet
        for (const t of terms) {
          const matches = (snippet.match(new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
          score += matches
        }
        
        if (score > bestScore) {
          bestScore = score
          bestIndex = index
        }
        
        index = lowerContent.indexOf(term, index + 1)
      }
    }

    if (bestIndex === -1) {
      // No terms found, return beginning of content
      const snippet = content.substring(0, maxLength) + (content.length > maxLength ? '...' : '')
      return highlightText(snippet, query)
    }

    // Create snippet around the best position
    const start = Math.max(0, bestIndex - 50)
    const end = Math.min(content.length, start + maxLength)
    const snippet = (start > 0 ? '...' : '') + 
                   content.substring(start, end) + 
                   (end < content.length ? '...' : '')

    return highlightText(snippet, query)
  }

  /**
   * Processes PostgreSQL ts_headline output and converts to our highlight format
   * @param snippet - The snippet from PostgreSQL ts_headline
   * @returns HTML string with converted highlights
   */
  const processPostgreSQLSnippet = (snippet: string): string => {
    if (!snippet) return snippet

    // Convert PostgreSQL's <b> tags to our highlight class
    return snippet
      .replace(/<b>/g, '<mark class="search-highlight">')
      .replace(/<\/b>/g, '</mark>')
  }

  /**
   * Gets the best highlighted snippet from a search result
   * Prefers PostgreSQL ts_headline output, falls back to manual highlighting
   * @param result - The search result object
   * @param query - The search query
   * @returns HTML string with highlighted snippet
   */
  const getOptimalSnippet = (result: { content: string; snippet?: string; title: string }, query: string): string => {
    // Use the snippet from PostgreSQL ts_headline if available (already highlighted)
    if (result.snippet && result.snippet !== result.content && result.snippet.includes('<b>')) {
      return processPostgreSQLSnippet(result.snippet)
    }

    // Fallback to manual highlighting
    const content = result.content || result.title
    return createHighlightedSnippet(content, query)
  }

  /**
   * Counts the number of search term matches in text
   * @param text - The text to search in
   * @param query - The search query
   * @returns Number of matches found
   */
  const countMatches = (text: string, query: string): number => {
    if (!text || !query) return 0

    const terms = query.trim().toLowerCase().split(/\s+/).filter(term => term.length > 0)
    const lowerText = text.toLowerCase()
    
    let totalMatches = 0
    for (const term of terms) {
      const matches = (lowerText.match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
      totalMatches += matches
    }
    
    return totalMatches
  }

  /**
   * Extracts plain text from HTML content (removes HTML tags)
   * @param html - HTML string
   * @returns Plain text string
   */
  const stripHtml = (html: string): string => {
    if (!html) return html
    return html.replace(/<[^>]*>/g, '')
  }

  return {
    highlightText,
    createHighlightedSnippet,
    processPostgreSQLSnippet,
    getOptimalSnippet,
    countMatches,
    stripHtml
  }
}