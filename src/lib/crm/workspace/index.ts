export { createCrmActivityNote } from './activity'
export {
  advanceOpportunityStage,
  assignCrmRecordOwner,
  isOwnerAssignableKind,
  updateCrmTaskStatus,
  updateLeadStatus,
} from './actions'
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
  CrmWorkspaceOwnerScope,
  CrmWorkspaceQuickAction,
  CrmWorkspaceQueue,
  CrmWorkspaceQueueItem,
  CrmWorkspaceQueueKey,
} from './types'
