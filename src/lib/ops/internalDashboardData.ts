export const opsTrendData = [
  {
    grossMargin: 42,
    month: 'Jan',
    mrr: 400,
    projectedRevenue: 6200,
    revenue: 4800,
  },
  {
    grossMargin: 44,
    month: 'Feb',
    mrr: 650,
    projectedRevenue: 7600,
    revenue: 5900,
  },
  {
    grossMargin: 46,
    month: 'Mar',
    mrr: 900,
    projectedRevenue: 8800,
    revenue: 7100,
  },
  {
    grossMargin: 47,
    month: 'Apr',
    mrr: 1150,
    projectedRevenue: 10300,
    revenue: 8500,
  },
  {
    grossMargin: 49,
    month: 'May',
    mrr: 1500,
    projectedRevenue: 11900,
    revenue: 9600,
  },
  {
    grossMargin: 51,
    month: 'Jun',
    mrr: 1800,
    projectedRevenue: 13600,
    revenue: 10800,
  },
] as const

export const todayOpsBoard = [
  {
    focus: 'Review weather, route, unpaid invoices, and open quotes.',
    success: 'No surprises in the field block.',
    time: '7:30-8:00',
  },
  {
    focus: 'Calls, texts, quote follow-up, and CRM cleanup.',
    success: 'Every warm lead gets a same-day touch.',
    time: '8:00-9:30',
  },
  {
    focus: 'First production block for staged jobs and cooler-temperature work.',
    success: 'High-value work gets done before the day fragments.',
    time: '9:30-12:30',
  },
  {
    focus: 'Confirm arrival windows and group nearby afternoon jobs.',
    success: 'No dead miles and fewer customer surprises.',
    time: '12:30-1:00',
  },
  {
    focus: 'Second production block.',
    success: 'Finish route density before admin work returns.',
    time: '1:00-4:30',
  },
  {
    focus: 'Upload photos, send invoices, log notes, and lock tomorrow.',
    success: 'Work closes clean and the next day starts prepared.',
    time: '4:30-5:15',
  },
] as const

export const weeklyOpsBoard = [
  {
    checkpoint: 'Pipeline review, quote backlog cleanup, and schedule balance.',
    day: 'Monday',
  },
  {
    checkpoint: 'Pricing review, callback review, and route-density check.',
    day: 'Wednesday',
  },
  {
    checkpoint: 'Bookkeeping, review requests, and maintenance follow-up.',
    day: 'Friday',
  },
] as const

export const commandCenterNotes = [
  'Payload admin stores the records. The portal should answer: what matters today, what unlocks growth next, and what is drifting.',
  'Keep actual financials in accounting later. Until then, use targets and review rhythm so the business still behaves like a system.',
] as const
