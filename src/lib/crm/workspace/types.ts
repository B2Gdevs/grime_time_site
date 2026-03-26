export type CrmRecordKind =
  | 'account'
  | 'contact'
  | 'lead'
  | 'opportunity'
  | 'sequence-definition'
  | 'sequence-enrollment'
  | 'task'

export type CrmWorkspaceQueueKey = 'accounts' | 'attention' | 'automation' | 'pipeline' | 'tasks'
export type CrmWorkspaceActionKind = 'advance-opportunity' | 'complete-task' | 'set-task-in-progress'

export type CrmWorkspaceMetricTone = 'default' | 'positive' | 'warning'

export type CrmWorkspaceMetric = {
  description: string
  label: string
  tone: CrmWorkspaceMetricTone
  value: string
}

export type CrmWorkspaceQueueItem = {
  actions?: CrmWorkspaceQuickAction[]
  badgeLabel?: null | string
  href: string
  id: string
  kind: CrmRecordKind
  meta: string[]
  priorityLabel?: null | string
  priorityValue?: null | string
  stale: boolean
  statusLabel: string
  statusValue?: null | string
  subtitle: string
  title: string
}

export type CrmWorkspaceQuickAction = {
  kind: CrmWorkspaceActionKind
  label: string
  nextStage?: null | string
  nextStatus?: null | string
}

export type CrmWorkspaceQueue = {
  description: string
  emptyMessage: string
  items: CrmWorkspaceQueueItem[]
  key: CrmWorkspaceQueueKey
  label: string
}

export type CrmWorkspaceData = {
  generatedAt: string
  metrics: CrmWorkspaceMetric[]
  queues: CrmWorkspaceQueue[]
  searchQuery?: string
}

export type CrmRecordDetailRelatedItem = {
  id: string
  kind: CrmRecordKind
  meta: string
  title: string
}

export type CrmRecordDetailRelatedSection = {
  items: CrmRecordDetailRelatedItem[]
  label: string
}

export type CrmRecordDetailField = {
  label: string
  value: string
}

export type CrmRecordDetail = {
  badges: string[]
  description?: null | string
  fields: CrmRecordDetailField[]
  href?: string
  id: string
  kind: CrmRecordKind
  priorityLabel?: null | string
  relatedSections: CrmRecordDetailRelatedSection[]
  statusLabel: string
  subtitle: string
  title: string
}
