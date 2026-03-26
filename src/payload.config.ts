import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Categories } from './collections/Categories'
import { Accounts } from './collections/Accounts'
import { Contacts } from './collections/Contacts'
import { CrmActivities } from './collections/CrmActivities'
import { CrmSequences } from './collections/CrmSequences'
import { CrmTasks } from './collections/CrmTasks'
import { GrowthMilestones } from './collections/GrowthMilestones'
import { Invoices } from './collections/Invoices'
import { Leads } from './collections/Leads'
import { Media } from './collections/Media'
import { OpsAssetLadderItems } from './collections/OpsAssetLadderItems'
import { OpsLiabilityItems } from './collections/OpsLiabilityItems'
import { OpsScorecardRows } from './collections/OpsScorecardRows'
import { Opportunities } from './collections/Opportunities'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Quotes } from './collections/Quotes'
import { SequenceEnrollments } from './collections/SequenceEnrollments'
import { ServiceAppointments } from './collections/ServiceAppointments'
import { ServicePlans } from './collections/ServicePlans'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { InternalOpsSettings } from './globals/InternalOpsSettings/config'
import { Pricing } from './globals/Pricing/config'
import { QuoteSettings } from './globals/QuoteSettings/config'
import { ServicePlanSettings } from './globals/ServicePlanSettings/config'
import { migrations } from './migrations'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { s3Storage } from '@payloadcms/storage-s3'
import {
  getSupabasePublicObjectUrl,
  getSupabaseS3Endpoint,
  isSupabaseMediaStorageConfigured,
} from './utilities/supabaseS3Storage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const postgresUrl = process.env.POSTGRES_URL?.trim() || ''
/** Supabase (and many hosted PG providers) require TLS for non-local URLs. */
const supabaseOrRemoteSsl =
  postgresUrl && !postgresUrl.includes('localhost') && !postgresUrl.includes('127.0.0.1')
    ? { rejectUnauthorized: false }
    : false

const resendApiKey = process.env.RESEND_API_KEY?.trim()
const emailFrom = process.env.EMAIL_FROM?.trim() || 'onboarding@resend.dev'
const emailFromName = process.env.EMAIL_FROM_NAME?.trim() || 'Grime Time'
const payloadMcpEnabled = process.env.PAYLOAD_MCP_ENABLED === 'true'

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      afterNavLinks: ['@/components/AdminOpsDashboardLink'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: postgresUrl,
      max: 10,
      ...(supabaseOrRemoteSsl ? { ssl: supabaseOrRemoteSsl } : {}),
    },
    // Avoid dev `push` against hosted Postgres (Supabase): it runs a massive DDL sync and often fails.
    // Apply schema with `npm run payload migrate` (or `payload migrate`) instead.
    push: false,
    prodMigrations: migrations,
  }),
  collections: [
    Pages,
    Posts,
    Media,
    Categories,
    Quotes,
    Users,
    Accounts,
    Contacts,
    Leads,
    Opportunities,
    CrmActivities,
    CrmSequences,
    CrmTasks,
    SequenceEnrollments,
    Invoices,
    ServicePlans,
    ServiceAppointments,
    GrowthMilestones,
    OpsAssetLadderItems,
    OpsLiabilityItems,
    OpsScorecardRows,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  plugins: [
    ...plugins,
    ...(payloadMcpEnabled
      ? [
          mcpPlugin({
            collections: {
              categories: {
                description: 'Taxonomy for posts and content organization.',
                enabled: {
                  create: true,
                  delete: false,
                  find: true,
                  update: true,
                },
              },
              media: {
                description: 'Media library for marketing pages and proof assets.',
                enabled: {
                  create: true,
                  delete: false,
                  find: true,
                  update: true,
                },
              },
              pages: {
                description: 'Marketing pages and layout-builder content for the public site.',
                enabled: {
                  create: true,
                  delete: false,
                  find: true,
                  update: true,
                },
              },
              posts: {
                description: 'Blog and update content rendered on the public site.',
                enabled: {
                  create: true,
                  delete: false,
                  find: true,
                  update: true,
                },
              },
              quotes: {
                description: 'Internal quote records. Read-only over MCP until schema and sync work settle.',
                enabled: {
                  create: false,
                  delete: false,
                  find: true,
                  update: false,
                },
              },
            },
            globals: {
              footer: {
                description: 'Footer navigation and contact details for the public site.',
                enabled: {
                  find: true,
                  update: true,
                },
              },
              header: {
                description: 'Header navigation and primary site links.',
                enabled: {
                  find: true,
                  update: true,
                },
              },
              pricing: {
                description: 'Public pricing packages and marketing pricing language.',
                enabled: {
                  find: true,
                  update: true,
                },
              },
              quoteSettings: {
                description: 'Draftable instant-quote math and service toggles.',
                enabled: {
                  find: true,
                  update: true,
                },
              },
            },
            mcp: {
              handlerOptions: {
                verboseLogs: process.env.PAYLOAD_MCP_VERBOSE_LOGS === 'true',
              },
              serverOptions: {
                serverInfo: {
                  name: process.env.PAYLOAD_MCP_SERVER_NAME?.trim() || 'Grime Time Payload MCP',
                  version: '1.0.0',
                },
              },
            },
          }),
        ]
      : []),
    s3Storage({
      bucket: process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'media',
      collections: {
        media: {
          generateFileURL: ({ filename, prefix }) =>
            getSupabasePublicObjectUrl(filename, prefix),
        },
      },
      config: {
        credentials: {
          accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY || '',
        },
        endpoint: getSupabaseS3Endpoint(),
        forcePathStyle: true,
        region: process.env.SUPABASE_S3_REGION?.trim() || 'us-east-1',
      },
      enabled: isSupabaseMediaStorageConfigured(),
    }),
  ],
  globals: [Header, Footer, Pricing, InternalOpsSettings, QuoteSettings, ServicePlanSettings],
  secret: process.env.PAYLOAD_SECRET,
  ...(resendApiKey
    ? {
        email: resendAdapter({
          apiKey: resendApiKey,
          defaultFromAddress: emailFrom,
          defaultFromName: emailFromName,
        }),
      }
    : {}),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
