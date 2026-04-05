import { beforeEach, describe, expect, it, vi } from 'vitest'

import { defaultInstantQuoteCatalog } from '@/lib/quotes/instantQuoteCatalog'

const createLocalReq = vi.fn()
const getPayload = vi.fn()
const createLeadFormSubmission = vi.fn()
const getInstantQuoteCatalog = vi.fn()

vi.mock('payload', () => ({
  createLocalReq,
  getPayload,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('@/lib/forms/createLeadFormSubmission', () => ({
  createLeadFormSubmission,
}))

vi.mock('@/lib/quotes/getInstantQuoteCatalog', () => ({
  getInstantQuoteCatalog,
}))

function makeInstantQuotePayload() {
  return {
    address: '',
    condition: 'standard',
    details: '',
    email: 'jamie@example.com',
    frequency: 'one_time',
    fullName: 'Jamie Customer',
    phone: '',
    requestScheduling: false,
    scheduleApproximateSize: '',
    schedulingNotes: '',
    schedulingPreferredWindow: 'flexible',
    schedulingPropertyType: 'residential',
    schedulingTargetDate: '',
    serviceKey: 'driveway',
    sqft: '1200',
    stories: '1',
  }
}

function makeUpload(name: string, body: string, type = 'image/jpeg') {
  const file = new File([body], name, { type })
  Object.defineProperty(file, 'arrayBuffer', {
    value: async () => new TextEncoder().encode(body).buffer,
  })
  return file
}

describe('instant quote route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createLocalReq.mockResolvedValue({})
    createLeadFormSubmission.mockResolvedValue({
      crmSyncStatus: null,
      id: 91,
    })
    getInstantQuoteCatalog.mockResolvedValue(defaultInstantQuoteCatalog)
  })

  it('stores multipart attachments in the dedicated internal collection', async () => {
    const payload = {
      create: vi.fn().mockResolvedValue({ id: 501 }),
      logger: {
        error: vi.fn(),
      },
    }
    getPayload.mockResolvedValue(payload)

    const formData = new FormData()
    formData.set('payload', JSON.stringify(makeInstantQuotePayload()))
    formData.append('attachments', makeUpload('front.jpg', 'front'))
    formData.append('attachments', makeUpload('driveway.png', 'driveway', 'image/png'))

    const { POST } = await import('@/app/api/lead-forms/instant-quote/route')
    const response = await POST({
      formData: async () => formData,
      headers: new Headers({
        'content-type': 'multipart/form-data; boundary=test-boundary',
        'x-request-id': 'req-quote-multipart',
      }),
      method: 'POST',
      url: 'http://localhost/api/lead-forms/instant-quote',
    } as unknown as Request)

    expect(response.status).toBe(200)
    expect(createLeadFormSubmission).toHaveBeenCalledTimes(1)
    expect(payload.create).toHaveBeenCalledTimes(2)
    expect(payload.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        collection: 'instant-quote-request-attachments',
        data: expect.objectContaining({
          attachmentStatus: 'new',
          contentType: 'image/jpeg',
          customerFilename: 'front.jpg',
          intakeSource: 'instant_quote',
          submission: 91,
        }),
        overrideAccess: true,
      }),
    )
    expect(response.headers.get('x-request-id')).toBe('req-quote-multipart')
    await expect(response.json()).resolves.toMatchObject({
      attachmentCount: 2,
      attachmentSyncStatus: 'saved',
      ok: true,
      submissionId: 91,
    })
  })

  it('rejects invalid attachment batches before creating the submission', async () => {
    const payload = {
      create: vi.fn(),
      logger: {
        error: vi.fn(),
      },
    }
    getPayload.mockResolvedValue(payload)

    const formData = new FormData()
    formData.set('payload', JSON.stringify(makeInstantQuotePayload()))
    formData.append('attachments', makeUpload('notes.pdf', 'fake-pdf', 'application/pdf'))

    const { POST } = await import('@/app/api/lead-forms/instant-quote/route')
    const response = await POST({
      formData: async () => formData,
      headers: new Headers({
        'content-type': 'multipart/form-data; boundary=test-boundary',
      }),
      method: 'POST',
      url: 'http://localhost/api/lead-forms/instant-quote',
    } as unknown as Request)

    expect(response.status).toBe(400)
    expect(createLeadFormSubmission).not.toHaveBeenCalled()
    expect(payload.create).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({
      error: 'notes.pdf must be an image file.',
    })
  })

  it('keeps the base submission when attachment persistence fails after create', async () => {
    const payload = {
      create: vi.fn().mockRejectedValue(new Error('disk full')),
      logger: {
        error: vi.fn(),
      },
    }
    getPayload.mockResolvedValue(payload)

    const formData = new FormData()
    formData.set('payload', JSON.stringify(makeInstantQuotePayload()))
    formData.append('attachments', makeUpload('front.jpg', 'front'))

    const { POST } = await import('@/app/api/lead-forms/instant-quote/route')
    const response = await POST({
      formData: async () => formData,
      headers: new Headers({
        'content-type': 'multipart/form-data; boundary=test-boundary',
      }),
      method: 'POST',
      url: 'http://localhost/api/lead-forms/instant-quote',
    } as unknown as Request)

    expect(response.status).toBe(200)
    expect(createLeadFormSubmission).toHaveBeenCalledTimes(1)
    expect(payload.logger.error).toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({
      attachmentCount: 0,
      attachmentSyncStatus: 'failed',
      ok: true,
      submissionId: 91,
    })
  })
})
