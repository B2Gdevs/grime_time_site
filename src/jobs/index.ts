import { processSequenceEnrollmentTask } from '@/jobs/processSequenceEnrollmentTask'
import { scanOverdueInvoicesTask } from '@/jobs/scanOverdueInvoicesTask'
import { sendCustomerNotificationTask } from '@/jobs/sendCustomerNotificationTask'
import { sendEmployeeNotificationTask } from '@/jobs/sendEmployeeNotificationTask'

export const payloadJobs = [
  sendCustomerNotificationTask,
  sendEmployeeNotificationTask,
  processSequenceEnrollmentTask,
  scanOverdueInvoicesTask,
]
