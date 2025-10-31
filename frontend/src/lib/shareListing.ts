export type ShareListingParams = {
  url: string
  title?: string
  text?: string
}

export type ShareListingResult = {
  method: 'web-share' | 'clipboard'
}

const copyToClipboardFallback = (value: string) => {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)

  const selection = document.getSelection()
  const selectedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null

  textarea.select()
  const successful = document.execCommand('copy')
  document.body.removeChild(textarea)

  if (selectedRange && selection) {
    selection.removeAllRanges()
    selection.addRange(selectedRange)
  }

  if (!successful) {
    throw new Error('Unable to copy to clipboard')
  }
}

export const shareListing = async ({ url, title, text }: ShareListingParams): Promise<ShareListingResult> => {
  if (!url) {
    throw new Error('Missing URL to share')
  }

  if (typeof navigator === 'undefined') {
    throw new Error('Share API not available')
  }

  if (navigator.share) {
    try {
      await navigator.share({ url, title, text })
      return { method: 'web-share' }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('Share canceled')
      }
      throw error instanceof Error ? error : new Error('Failed to share listing')
    }
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url)
      return { method: 'clipboard' }
    } catch {
      // Fall through to manual copy fallback below
    }
  }

  copyToClipboardFallback(url)
  return { method: 'clipboard' }
}
