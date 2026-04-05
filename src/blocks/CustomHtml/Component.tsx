import { sanitizeCustomHtml } from '@/lib/pages/customHtml'
import type { CustomHtmlBlock as CustomHtmlBlockProps } from '@/payload-types'

export function CustomHtmlBlock(props: CustomHtmlBlockProps) {
  const html = sanitizeCustomHtml(props.html)

  if (!html) {
    return null
  }

  return (
    <section className="container my-16">
      <div className="site-section-shell px-6 py-8 md:px-10 md:py-10">
        <div className="rounded-2xl border border-border/70 bg-card/50 p-4">
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </section>
  )
}
