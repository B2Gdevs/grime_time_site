import Script from 'next/script'

function parseSetAccount(): { key: string; ref: string } | null {
  const raw = process.env.ENGAGEBAY_JS_TRACKING_KEY?.trim()
  const refEnv = process.env.ENGAGEBAY_JS_FORM_REF?.trim()
  if (!raw) return null
  if (refEnv) return { key: raw, ref: refEnv }
  const pipe = raw.indexOf('|')
  if (pipe > 0) return { key: raw.slice(0, pipe), ref: raw.slice(pipe + 1) }
  return null
}

/**
 * EngageBay form / tracking (ehform.js). `set_account` needs two strings:
 * - Set `ENGAGEBAY_JS_FORM_REF` + `ENGAGEBAY_JS_TRACKING_KEY`, or
 * - One var: `ENGAGEBAY_JS_TRACKING_KEY=id|formRef` (e.g. `l4oh...|gmailasyh`)
 */
export function EngageBayTracking() {
  const parsed = parseSetAccount()
  if (!parsed) return null
  const { key, ref: accountRef } = parsed

  const inline = `var EhAPI = EhAPI || {};EhAPI.after_load = function(){EhAPI.set_account(${JSON.stringify(key)},${JSON.stringify(accountRef)});EhAPI.execute('rules');};`

  const cacheBust = new Date().getUTCHours()
  const src = `https://d2p078bqz5urf7.cloudfront.net/jsapi/ehform.js?v${cacheBust}`

  return (
    <>
      <Script id="engagebay-ehapi" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: inline }} />
      <Script id="engagebay-loader" strategy="afterInteractive" src={src} />
    </>
  )
}
