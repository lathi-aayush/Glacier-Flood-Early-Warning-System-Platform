export type HtmlExportResult = 'print' | 'download' | 'failed'

function downloadHtmlFile(html: string, filename: string): boolean {
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Opens the system print dialog for a full HTML document without `window.open`
 * (avoids pop-up blockers). User can choose “Save as PDF”.
 *
 * If the iframe print path fails, falls back to downloading an `.html` file.
 */
export async function printHtmlDocument(
  html: string,
  opts?: { fallbackFilename?: string },
): Promise<HtmlExportResult> {
  if (typeof document === 'undefined') return 'failed'

  const fallbackName = opts?.fallbackFilename ?? 'glacierguard-report.html'

  try {
    const iframe = document.createElement('iframe')
    iframe.style.cssText =
      'position:fixed;left:0;top:0;width:1px;height:1px;border:0;opacity:0.01;pointer-events:none;z-index:-1;'
    iframe.setAttribute('aria-hidden', 'true')
    iframe.setAttribute('title', 'GlacierGuard print preview')
    document.body.appendChild(iframe)

    const win = iframe.contentWindow
    const doc = iframe.contentDocument
    if (!win || !doc) {
      iframe.remove()
      return downloadHtmlFile(html, fallbackName) ? 'download' : 'failed'
    }

    const cleanup = () => {
      if (iframe.isConnected) iframe.remove()
    }

    doc.open()
    doc.write(html)
    doc.close()

    await new Promise<void>((resolve) => {
      win.setTimeout(() => resolve(), 150)
    })

    try {
      win.addEventListener('afterprint', cleanup, { once: true })
      win.focus()
      win.print()
      win.setTimeout(() => {
        if (iframe.isConnected) cleanup()
      }, 120_000)
      return 'print'
    } catch {
      cleanup()
      return downloadHtmlFile(html, fallbackName) ? 'download' : 'failed'
    }
  } catch {
    return downloadHtmlFile(html, fallbackName) ? 'download' : 'failed'
  }
}
