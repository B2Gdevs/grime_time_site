const TRUSTED_IFRAME_HOSTS = ['player.vimeo.com', 'www.google.com', 'www.youtube.com', 'youtube.com']

function stripScripts(value: string): string {
  return value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
}

function stripEventHandlers(value: string): string {
  return value.replace(/\son[a-z-]+\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, '')
}

function stripJavascriptUrls(value: string): string {
  return value.replace(/\s(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, '')
}

function filterIframes(value: string): string {
  return value.replace(/<iframe\b[^>]*\ssrc=(["'])([^"']+)\1[^>]*><\/iframe>/gi, (full, quote, src) => {
    try {
      const url = new URL(src)

      if (TRUSTED_IFRAME_HOSTS.includes(url.hostname)) {
        return full
      }
    } catch {
      return ''
    }

    return ''
  })
}

export function sanitizeCustomHtml(value: null | string | undefined): string {
  if (!value?.trim()) {
    return ''
  }

  return filterIframes(stripJavascriptUrls(stripEventHandlers(stripScripts(value)))).trim()
}
