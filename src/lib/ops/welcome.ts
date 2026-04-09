import type { Payload } from 'payload'

import type { PayloadPreference } from '@/payload-types'

const PAYLOAD_PREFERENCES_COLLECTION = 'payload-preferences'
export const OPS_WELCOME_PREFERENCE_KEY = 'ops-welcome-v1'

type PreferenceValue = PayloadPreference['value']

function preferenceUserId(preference: Pick<PayloadPreference, 'user'>): null | number {
  const value =
    preference.user &&
    typeof preference.user === 'object' &&
    'value' in preference.user
      ? preference.user.value
      : null

  return typeof value === 'number' ? value : null
}

function hasSeenValue(value: PreferenceValue): boolean {
  if (value == null) {
    return false
  }

  if (value === true) {
    return true
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return Boolean(
      'dismissedAt' in value &&
        typeof value.dismissedAt === 'string' &&
        value.dismissedAt.trim(),
    )
  }

  return false
}

async function findOpsWelcomePreference(
  payload: Payload,
  userId: number,
): Promise<null | PayloadPreference> {
  const result = await payload.find({
    collection: PAYLOAD_PREFERENCES_COLLECTION,
    depth: 0,
    limit: 20,
    overrideAccess: true,
    pagination: false,
    where: {
      key: {
        equals: OPS_WELCOME_PREFERENCE_KEY,
      },
    },
  })

  return (
    (result.docs as PayloadPreference[]).find((preference) => preferenceUserId(preference) === userId) ??
    null
  )
}

export async function hasSeenOpsWelcome(payload: Payload, userId: number): Promise<boolean> {
  const preference = await findOpsWelcomePreference(payload, userId)
  return preference ? hasSeenValue(preference.value) : false
}

export async function markOpsWelcomeSeen(payload: Payload, userId: number): Promise<void> {
  const existing = await findOpsWelcomePreference(payload, userId)
  const value = {
    dismissedAt: new Date().toISOString(),
    seen: true,
  }

  if (existing) {
    await payload.update({
      collection: PAYLOAD_PREFERENCES_COLLECTION,
      id: existing.id,
      data: {
        key: OPS_WELCOME_PREFERENCE_KEY,
        user: {
          relationTo: 'users',
          value: userId,
        },
        value,
      },
      overrideAccess: true,
    })
    return
  }

  await payload.create({
    collection: PAYLOAD_PREFERENCES_COLLECTION,
    data: {
      key: OPS_WELCOME_PREFERENCE_KEY,
      user: {
        relationTo: 'users',
        value: userId,
      },
      value,
    },
    overrideAccess: true,
  })
}
