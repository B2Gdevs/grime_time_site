import config from '@payload-config'
import { getPayload } from 'payload'

import { buildCustomerOwnershipWhere } from '@/lib/customers/access'
import { getCurrentCustomerAccount } from '@/lib/customers/getCurrentCustomerAccount'
import { buildSuggestedVisitDates } from '@/lib/services/subscriptionMath'
import type {
  Account,
  Invoice,
  Quote,
  ServiceAppointment,
  ServicePlan,
  ServicePlanSetting,
  User,
} from '@/payload-types'

export type CustomerEstimateSummary = {
  address: string
  id: string
  serviceSummary: string
  status: string
  title: string
  total: number
  validUntil: string | null
}

export type CustomerInvoiceSummary = {
  balanceDue: number
  collectionMethod: null | string
  deliveryStatus: null | string
  dueDate: string | null
  id: string
  invoiceNumber: string
  paidAt: null | string
  paymentUrl: string | null
  paymentSource: null | string
  status: string
  title: string
  total: number
}

export type CustomerServicePlanSummary = {
  annualPlanAmount: number
  cadenceMonths: number
  discountPercent: number
  id: string
  installmentAmount: number
  preferredWindow: string | null
  serviceSummary: string
  status: string
  suggestedVisits: string[]
  title: string
  visitsPerYear: number
}

export type CustomerAppointmentSummary = {
  arrivalWindow: string | null
  id: string
  requestedDate: string | null
  scheduledStart: string | null
  status: string
  title: string
}

export type CustomerPortalSnapshot = {
  activation: {
    /** First ~two weeks after the Payload user row was created — show a light welcome banner. */
    showWelcomeBanner: boolean
    /** Prompt to finish phone, email, or service address. */
    suggestProfileCompletion: boolean
  }
  appointments: CustomerAppointmentSummary[]
  billing: {
    accountName: null | string
    billingMode: null | string
    billingRollupMode: null | string
    billingTermsDays: number
    canManageInStripe: boolean
    portalAccessMode: null | string
  }
  estimates: CustomerEstimateSummary[]
  invoices: CustomerInvoiceSummary[]
  plans: CustomerServicePlanSummary[]
  profileCompleteness: {
    addressReady: boolean
    contactReady: boolean
  }
  servicePlanDefaults: {
    billingInstallmentsPerYear: number
    customerSummary: string
    defaultCadenceMonths: number
    discountPercentOffSingleJob: number
    minimumVisitsPerYear: number
  }
}

function addressFromParts(parts: Array<null | string | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(', ')
}

function serviceAddressLabel(address: Quote['serviceAddress'] | Invoice['serviceAddress'] | ServicePlan['serviceAddress'] | ServiceAppointment['serviceAddress'] | null | undefined): string {
  if (!address) return 'Address not set'

  return (
    addressFromParts([
      address.street1,
      address.street2,
      address.city,
      address.state,
      address.postalCode,
    ]) || 'Address not set'
  )
}

function buildBillingSummary(account: Account | null): CustomerPortalSnapshot['billing'] {
  return {
    accountName: account?.name || null,
    billingMode: account?.billingMode || null,
    billingRollupMode: account?.billingRollupMode || null,
    billingTermsDays: typeof account?.billingTermsDays === 'number' ? account.billingTermsDays : 0,
    canManageInStripe: Boolean(account?.portalAccessMode && account.portalAccessMode !== 'none'),
    portalAccessMode: account?.portalAccessMode || null,
  }
}

export async function getCustomerPortalData(user: User): Promise<CustomerPortalSnapshot> {
  const payload = await getPayload({ config })
  const ownWhere = buildCustomerOwnershipWhere(user)

  if (!ownWhere || ownWhere === true) {
    return {
      activation: {
        showWelcomeBanner: false,
        suggestProfileCompletion: true,
      },
      appointments: [],
      billing: {
        accountName: null,
        billingMode: null,
        billingRollupMode: null,
        billingTermsDays: 0,
        canManageInStripe: false,
        portalAccessMode: null,
      },
      estimates: [],
      invoices: [],
      plans: [],
      profileCompleteness: {
        addressReady: false,
        contactReady: false,
      },
      servicePlanDefaults: {
        billingInstallmentsPerYear: 12,
        customerSummary:
          'Recurring plans default to two visits per year at a 20% discount from normal one-off pricing, billed in equal installments across the year.',
        defaultCadenceMonths: 6,
        discountPercentOffSingleJob: 20,
        minimumVisitsPerYear: 2,
      },
    }
  }

  const [quotes, invoices, plans, appointments, planSettings] = await Promise.all([
    payload.find({
      collection: 'quotes',
      depth: 0,
      limit: 100,
      overrideAccess: false,
      sort: '-updatedAt',
      user,
      where: ownWhere,
    }),
    payload.find({
      collection: 'invoices',
      depth: 0,
      limit: 100,
      overrideAccess: false,
      sort: '-updatedAt',
      user,
      where: ownWhere,
    }),
    payload.find({
      collection: 'service-plans',
      depth: 0,
      limit: 50,
      overrideAccess: false,
      sort: '-updatedAt',
      user,
      where: ownWhere,
    }),
    payload.find({
      collection: 'service-appointments',
      depth: 0,
      limit: 100,
      overrideAccess: false,
      sort: 'scheduledStart',
      user,
      where: ownWhere,
    }),
    payload.findGlobal({
      slug: 'servicePlanSettings',
      depth: 0,
      overrideAccess: false,
      user,
    }) as Promise<ServicePlanSetting>,
  ])
  const account = await getCurrentCustomerAccount({
    payload,
    user,
  })

  const createdMs = user.createdAt ? new Date(user.createdAt).getTime() : 0
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000
  const contactReady = Boolean(user.name?.trim() && user.email?.trim() && user.phone?.trim())
  const addressReady = Boolean(
    user.serviceAddress?.street1 &&
      user.serviceAddress?.city &&
      user.serviceAddress?.state &&
      user.serviceAddress?.postalCode,
  )

  return {
    activation: {
      showWelcomeBanner: createdMs > 0 && Date.now() - createdMs < fourteenDaysMs,
      suggestProfileCompletion: !contactReady || !addressReady,
    },
    appointments: (appointments.docs as ServiceAppointment[]).map((appointment) => ({
      arrivalWindow: appointment.arrivalWindow ?? null,
      id: String(appointment.id),
      requestedDate: appointment.requestedDate ?? null,
      scheduledStart: appointment.scheduledStart ?? null,
      status: appointment.status,
      title: appointment.title,
    })),
    billing: buildBillingSummary(account),
    estimates: (quotes.docs as Quote[]).map((quote) => ({
      address: serviceAddressLabel(quote.serviceAddress),
      id: String(quote.id),
      serviceSummary:
        quote.serviceLines?.map((line) => line.description).filter(Boolean).join(', ') ||
        quote.surfaceDescription ||
        'Estimate ready to review',
      status: quote.status ?? 'draft',
      title: quote.title,
      total: quote.pricing?.total ?? 0,
      validUntil: quote.validUntil ?? null,
    })),
    invoices: (invoices.docs as Invoice[]).map((invoice) => ({
      balanceDue: invoice.balanceDue ?? 0,
      collectionMethod: invoice.paymentCollectionMethod ?? null,
      deliveryStatus: invoice.deliveryStatus ?? null,
      dueDate: invoice.dueDate ?? null,
      id: String(invoice.id),
      invoiceNumber: invoice.invoiceNumber,
      paidAt: invoice.paidAt ?? null,
      paymentSource: invoice.paymentSource ?? null,
      paymentUrl: invoice.stripeHostedInvoiceURL ?? invoice.paymentUrl ?? null,
      status: invoice.status,
      title: invoice.title,
      total: invoice.total ?? 0,
    })),
    plans: (plans.docs as ServicePlan[]).map((plan) => ({
      annualPlanAmount: plan.annualPlanAmount ?? 0,
      cadenceMonths: plan.cadenceMonths ?? 6,
      discountPercent: plan.discountPercent ?? 20,
      id: String(plan.id),
      installmentAmount: plan.installmentAmount ?? 0,
      preferredWindow: plan.preferredWindow ?? null,
      serviceSummary:
        plan.serviceSummary?.trim() || `${serviceAddressLabel(plan.serviceAddress)} recurring service`,
      status: plan.status,
      suggestedVisits: buildSuggestedVisitDates({
        anchorDate: plan.anchorDate ?? null,
        visitsPerYear: plan.visitsPerYear ?? planSettings.minimumVisitsPerYear ?? 2,
      }),
      title: plan.title,
      visitsPerYear: plan.visitsPerYear ?? planSettings.minimumVisitsPerYear ?? 2,
    })),
    profileCompleteness: {
      addressReady,
      contactReady,
    },
    servicePlanDefaults: {
      billingInstallmentsPerYear: planSettings.billingInstallmentsPerYear ?? 12,
      customerSummary:
        planSettings.customerSummary?.trim() ||
        'Recurring plans default to two visits per year at a 20% discount from normal one-off pricing, billed in equal installments across the year.',
      defaultCadenceMonths: planSettings.defaultCadenceMonths ?? 6,
      discountPercentOffSingleJob: planSettings.discountPercentOffSingleJob ?? 20,
      minimumVisitsPerYear: planSettings.minimumVisitsPerYear ?? 2,
    },
  }
}
