import { processSequenceEnrollmentTask } from '@/jobs/processSequenceEnrollmentTask'
import { scanOverdueInvoicesTask } from '@/jobs/scanOverdueInvoicesTask'
import { sendCustomerNotificationTask } from '@/jobs/sendCustomerNotificationTask'

export const payloadJobs = [
  sendCustomerNotificationTask,
  processSequenceEnrollmentTask,
  scanOverdueInvoicesTask,
]
