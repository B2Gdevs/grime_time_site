import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { nestedDocsPlugin } from '@payloadcms/plugin-nested-docs'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { Plugin } from 'payload'
import { revalidateRedirects } from '@/hooks/revalidateRedirects'
import { GenerateTitle, GenerateURL } from '@payloadcms/plugin-seo/types'
import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from '@payloadcms/richtext-lexical'
import { searchFields } from '@/search/fieldOverrides'
import { beforeSyncWithSearch } from '@/search/beforeSync'
import { beforeFormSubmissionCrm } from '@/hooks/beforeFormSubmissionCrm'
import { beforeFormSubmissionNormalize } from '@/hooks/beforeFormSubmissionNormalize'

import { Page, Post } from '@/payload-types'
import { getServerSideURL } from '@/utilities/getURL'

const generateTitle: GenerateTitle<Post | Page> = ({ doc }) => {
  return doc?.title ? `${doc.title} | Grime Time` : 'Grime Time'
}

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL()

  return doc?.slug ? `${url}/${doc.slug}` : url
}

export const plugins: Plugin[] = [
  redirectsPlugin({
    collections: ['pages', 'posts'],
    overrides: {
      // @ts-expect-error - This is a valid override, mapped fields don't resolve to the same type
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'from') {
            return {
              ...field,
              admin: {
                description: 'You will need to rebuild the website when changing this field.',
              },
            }
          }
          return field
        })
      },
      hooks: {
        afterChange: [revalidateRedirects],
      },
    },
  }),
  nestedDocsPlugin({
    collections: ['categories'],
    generateURL: (docs) => docs.reduce((url, doc) => `${url}/${doc.slug}`, ''),
  }),
  seoPlugin({
    generateTitle,
    generateURL,
  }),
  formBuilderPlugin({
    fields: {
      payment: false,
    },
    formSubmissionOverrides: {
      admin: {
        group: 'Leads',
        defaultColumns: ['form', 'leadEmail', 'leadName', 'crmSyncStatus', 'createdAt'],
        description:
          'Website form posts. Lead columns are derived from field names (email, name, etc.). CRM columns reflect provider sync.',
      },
      fields: ({ defaultFields }) => [
        ...defaultFields,
        {
          type: 'row',
          fields: [
            {
              name: 'leadEmail',
              type: 'email',
              admin: {
                readOnly: true,
                width: '50%',
                description: 'Auto-filled from submission row named email (or similar).',
              },
            },
            {
              name: 'leadName',
              type: 'text',
              admin: {
                readOnly: true,
                width: '50%',
                description: 'Auto-filled from name / fullName / firstName rows.',
              },
            },
          ],
        },
        {
          name: 'crmSyncStatus',
          type: 'select',
          admin: {
            readOnly: true,
            position: 'sidebar',
            description: 'Internal follow-up sync result (server-set).',
          },
          options: [
            { label: 'OK', value: 'ok' },
            { label: 'OK (note warning)', value: 'ok_note_warning' },
            { label: 'Failed', value: 'failed' },
            { label: 'Failed (contact)', value: 'failed_contact' },
            { label: 'Skipped — no API key', value: 'skipped_no_api_key' },
            { label: 'Skipped — sync off', value: 'skipped_sync_disabled' },
            { label: 'Skipped — no email', value: 'skipped_no_email' },
            { label: 'Skipped — no rows', value: 'skipped_no_rows' },
          ],
        },
        {
          name: 'crmSyncedAt',
          type: 'text',
          admin: {
            readOnly: true,
            position: 'sidebar',
            description: 'ISO timestamp of last follow-up sync attempt.',
          },
        },
        {
          name: 'crmSyncDetail',
          type: 'textarea',
          admin: {
            readOnly: true,
            position: 'sidebar',
            rows: 4,
            description: 'Error or status detail from the sync step.',
          },
        },
      ],
      hooks: {
        beforeChange: [beforeFormSubmissionNormalize, beforeFormSubmissionCrm],
      },
    },
    formOverrides: {
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ('name' in field && field.name === 'confirmationMessage') {
            return {
              ...field,
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    FixedToolbarFeature(),
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                  ]
                },
              }),
            }
          }
          return field
        })
      },
    },
  }),
  searchPlugin({
    collections: ['posts'],
    beforeSync: beforeSyncWithSearch,
    searchOverrides: {
      fields: ({ defaultFields }) => {
        return [...defaultFields, ...searchFields]
      },
    },
  }),
]
