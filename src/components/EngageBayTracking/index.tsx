import Script from 'next/script'

function getTrackingKey(): string | null {
  const raw = process.env.ENGAGEBAY_JS_TRACKING_KEY?.trim()
  if (!raw) return null
  const pipe = raw.indexOf('|')
  return pipe > 0 ? raw.slice(0, pipe) : raw
}

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
  const trackingKey = getTrackingKey()
  const scheduleFormId = process.env.ENGAGEBAY_SCHEDULE_FORM_ID?.trim()

  if (!parsed && !trackingKey && !scheduleFormId) return null

  const inline = parsed
    ? `var EhAPI = window.EhAPI || {};EhAPI.after_load = function(){EhAPI.set_account(${JSON.stringify(parsed.key)},${JSON.stringify(parsed.ref)});EhAPI.execute('rules');};window.EhAPI = EhAPI;`
    : 'var EhAPI = window.EhAPI || {};EhAPI.after_load = EhAPI.after_load || function(){};window.EhAPI = EhAPI;'

  const cacheBust = new Date().getUTCHours()
  const src = `https://d2p078bqz5urf7.cloudfront.net/jsapi/ehform.js?v${cacheBust}`

  return (
    <>
      <Script id="engagebay-ehapi" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: inline }} />
      <Script id="engagebay-loader" strategy="afterInteractive" src={src} />
    </>
  )
}
