import type { CollectionAfterChangeHook } from 'payload'

import { patchFormSubmissionCrmMetadata, isEngageBaySyncSkipped } from '@/lib/formSubmissions/patchCrmMetadata'
import {
  attachFormSubmissionNoteToEngageBay,
  getLeadEmailFromRows,
  postSubscriberToEngageBay,
  submissionRowsToEngageBayBody,
  type SubmissionRow,
} from '@/lib/engagebay/syncFormSubmissionToEngageBay'

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * On new form-submissions docs, sync to EngageBay when configured; then store outcome on the submission.
 * Skips when `skipEngageBaySync` is set on req.context (internal metadata updates).
 */
export const afterFormSubmissionEngageBay: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  if (operation !== 'create') return
  if (isEngageBaySyncSkipped(req)) return

  const { payload } = req

  if (process.env.ENGAGEBAY_SYNC_FORM_SUBMISSIONS === 'false') {
    await patchFormSubmissionCrmMetadata(payload, req, doc.id, {
      crmSyncStatus: 'skipped_sync_disabled',
      crmSyncedAt: nowIso(),
      crmSyncDetail: 'ENGAGEBAY_SYNC_FORM_SUBMISSIONS=false',
    })
    return
  }

  if (!process.env.ENGAGEBAY_API_KEY?.trim()) {
    await patchFormSubmissionCrmMetadata(payload, req, doc.id, {
      crmSyncStatus: 'skipped_no_api_key',
      crmSyncedAt: nowIso(),
      crmSyncDetail: null,
    })
    return
  }

  const rows = doc.submissionData as SubmissionRow[] | undefined
  if (!Array.isArray(rows) || rows.length === 0) {
    await patchFormSubmissionCrmMetadata(payload, req, doc.id, {
      crmSyncStatus: 'skipped_no_rows',
      crmSyncedAt: nowIso(),
      crmSyncDetail: null,
    })
    return
  }

  const body = submissionRowsToEngageBayBody(rows)
  const leadEmail = getLeadEmailFromRows(rows)

  if (!body || !leadEmail) {
    await patchFormSubmissionCrmMetadata(payload, req, doc.id, {
      crmSyncStatus: 'skipped_no_email',
      crmSyncedAt: nowIso(),
      crmSyncDetail: null,
    })
    payload.logger.info({ formSubmissionId: doc.id }, 'EngageBay sync skipped: no email in submission')
    return
  }

  try {
    const res = await postSubscriberToEngageBay(body)
    const responseText = await res.text().catch(() => '')
    if (!res.ok) {
      await patchFormSubmissionCrmMetadata(payload, req, doc.id, {
        crmSyncStatus: 'failed_contact',
        crmSyncedAt: nowIso(),
        crmSyncDetail: `HTTP ${res.status}: ${responseText.slice(0, 400)}`,
      })
      payload.logger.error(
        { formSubmissionId: doc.id, status: res.status, body: responseText.slice(0, 500) },
        'EngageBay contact sync failed',
      )
      return
    }

    const noteResult = await attachFormSubmissionNoteToEngageBay({
      subscriberResponseBodyText: responseText,
      leadEmail,
      rows,
    })

    let detail = 'Contact synced to EngageBay.'
    let status: 'ok' | 'ok_note_warning' = 'ok'
    if (!noteResult.ok) {
      status = 'ok_note_warning'
      detail = `Contact synced; note issue: ${noteResult.reason}`
      payload.logger.warn(
        { formSubmissionId: doc.id, reason: noteResult.reason },
        'EngageBay submission note skipped or failed',
      )
    }

    await patchFormSubmissionCrmMetadata(payload, req, doc.id, {
      crmSyncStatus: status,
      crmSyncedAt: nowIso(),
      crmSyncDetail: detail,
    })
    payload.logger.info({ formSubmissionId: doc.id }, 'EngageBay contact sync ok')
  } catch (err) {
    await patchFormSubmissionCrmMetadata(payload, req, doc.id, {
      crmSyncStatus: 'failed',
      crmSyncedAt: nowIso(),
      crmSyncDetail: err instanceof Error ? err.message.slice(0, 400) : 'unknown error',
    })
    payload.logger.error({ err, formSubmissionId: doc.id }, 'EngageBay contact sync error')
  }
}
