import type {
  CollectionBeforeChangeHook,
  CollectionConfig,
  FieldAccess,
  PayloadRequest,
} from 'payload'

import { adminOrSelf } from '@/access/adminOrSelf'
import { isAdmin } from '@/access/isAdmin'
import { PORTAL_INVITE_STATE_OPTIONS } from '@/lib/auth/portal-access/constants'
import { isAdminUser, USER_ROLE_OPTIONS } from '@/lib/auth/roles'
import { billingDiscountTypeOptions } from '@/lib/billing/discountPolicy'

/** Single source of truth for the auth collection slug (Payload admin user). */
export const USERS_COLLECTION_SLUG = 'users' as const satisfies CollectionConfig['slug']

const canCreateUser = async ({ req }: { req: PayloadRequest }): Promise<boolean> => {
  if (isAdminUser(req.user)) return true

  const existingUsers = await req.payload.find({
    collection: USERS_COLLECTION_SLUG,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
  })

  return existingUsers.totalDocs === 0
}

const isAdminField: FieldAccess = ({ req: { user } }) => isAdminUser(user)

const ensureBootstrapAdmin: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  if (operation !== 'create') return data

  const existingUsers = await req.payload.find({
    collection: USERS_COLLECTION_SLUG,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    req,
  })

  const roles =
    Array.isArray(data?.roles) && data.roles.length > 0
      ? Array.from(new Set(data.roles))
      : existingUsers.totalDocs === 0
        ? ['admin']
        : ['customer']

  return {
    ...data,
    email: typeof data?.email === 'string' ? data.email.trim().toLowerCase() : data?.email,
    roles,
  }
}

export const Users: CollectionConfig = {
  slug: USERS_COLLECTION_SLUG,
  access: {
    admin: ({ req: { user } }) => isAdminUser(user),
    create: canCreateUser,
    delete: isAdmin,
    read: adminOrSelf,
    update: adminOrSelf,
  },
  admin: {
    defaultColumns: ['name', 'email', 'account', 'roles'],
    useAsTitle: 'name',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
    },
    {
      name: 'phone',
      type: 'text',
    },
    {
      name: 'company',
      type: 'text',
    },
    {
      name: 'account',
      type: 'relationship',
      relationTo: 'accounts',
      admin: {
        description: 'Primary CRM account this user should view in the portal.',
        position: 'sidebar',
      },
      access: {
        create: isAdminField,
        read: ({ req: { user }, doc }) => {
          if (isAdminUser(user)) return true
          return user?.id === doc?.id
        },
        update: isAdminField,
      },
    },
    {
      name: 'billingAddress',
      type: 'group',
      fields: [
        {
          name: 'street1',
          type: 'text',
        },
        {
          name: 'street2',
          type: 'text',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'city',
              type: 'text',
              admin: {
                width: '40%',
              },
            },
            {
              name: 'state',
              type: 'text',
              defaultValue: 'TX',
              admin: {
                width: '20%',
              },
            },
            {
              name: 'postalCode',
              type: 'text',
              admin: {
                width: '40%',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'serviceAddress',
      type: 'group',
      fields: [
        {
          name: 'street1',
          type: 'text',
        },
        {
          name: 'street2',
          type: 'text',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'city',
              type: 'text',
              admin: {
                width: '40%',
              },
            },
            {
              name: 'state',
              type: 'text',
              defaultValue: 'TX',
              admin: {
                width: '20%',
              },
            },
            {
              name: 'postalCode',
              type: 'text',
              admin: {
                width: '40%',
              },
            },
          ],
        },
      ],
    },
    {
      name: 'roles',
      type: 'select',
      defaultValue: ['customer'],
      hasMany: true,
      options: USER_ROLE_OPTIONS.map((option) => ({ ...option })),
      required: true,
      saveToJWT: true,
      access: {
        create: isAdminField,
        update: isAdminField,
        read: ({ req: { user }, doc }) => {
          if (isAdminUser(user)) return true
          return user?.id === doc?.id
        },
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'billingDiscountType',
          type: 'select',
          defaultValue: 'none',
          options: billingDiscountTypeOptions.map((option) => ({ ...option })),
          admin: {
            description: 'Optional user-level billing override. This wins over account defaults.',
            width: '34%',
          },
          access: {
            create: isAdminField,
            read: isAdminField,
            update: isAdminField,
          },
        },
        {
          name: 'billingDiscountValue',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: {
            step: 0.01,
            width: '33%',
          },
          access: {
            create: isAdminField,
            read: isAdminField,
            update: isAdminField,
          },
        },
        {
          name: 'billingDiscountNote',
          type: 'text',
          admin: {
            width: '33%',
          },
          access: {
            create: isAdminField,
            read: isAdminField,
            update: isAdminField,
          },
        },
      ],
    },
    {
      name: 'supabaseAuthUserID',
      type: 'text',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: isAdminField,
        read: isAdminField,
        update: isAdminField,
      },
    },
    {
      name: 'emailVerifiedAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: isAdminField,
        read: isAdminField,
        update: isAdminField,
      },
    },
    {
      name: 'lastPortalLoginAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: isAdminField,
        read: isAdminField,
        update: isAdminField,
      },
    },
    {
      name: 'portalInviteState',
      type: 'select',
      defaultValue: 'none',
      options: PORTAL_INVITE_STATE_OPTIONS.map((option) => ({ ...option })),
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: isAdminField,
        read: isAdminField,
        update: isAdminField,
      },
    },
    {
      name: 'portalInviteTokenHash',
      type: 'text',
      admin: {
        hidden: true,
      },
      access: {
        create: isAdminField,
        read: isAdminField,
        update: isAdminField,
      },
    },
    {
      name: 'portalInviteExpiresAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: isAdminField,
        read: isAdminField,
        update: isAdminField,
      },
    },
    {
      name: 'portalInviteSentAt',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
      access: {
        create: isAdminField,
        read: isAdminField,
        update: isAdminField,
      },
    },
  ],
  hooks: {
    beforeChange: [ensureBootstrapAdmin],
  },
  timestamps: true,
}
