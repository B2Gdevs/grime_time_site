export { createCrmActivityNote } from './activity'
export { advanceOpportunityStage, updateCrmTaskStatus } from './actions'
export { loadCrmRecordDetail } from './detail'
export { loadCrmWorkspace } from './queries'
export type {
  CrmRecordDetail,
  CrmRecordDetailField,
  CrmRecordKind,
  CrmRecordDetailRelatedSection,
  CrmWorkspaceActionKind,
  CrmWorkspaceData,
  CrmWorkspaceMetric,
  CrmWorkspaceQuickAction,
  CrmWorkspaceQueue,
  CrmWorkspaceQueueItem,
  CrmWorkspaceQueueKey,
} from './types'
