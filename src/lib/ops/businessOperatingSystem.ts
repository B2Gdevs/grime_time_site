export const businessScorecard = [
  {
    formula: 'Closed revenue for the month.',
    name: 'Revenue',
    target: 'Start with a monthly floor, then raise it every 90 days.',
  },
  {
    formula: 'Average monthly revenue from recurring maintenance plans.',
    name: 'MRR',
    target: 'Track separately from one-off jobs so maintenance growth is visible.',
  },
  {
    formula: 'Revenue minus direct labor, chemicals, fuel, processing, and subcontractor costs.',
    name: 'Gross profit',
    target: 'Protect this before adding new overhead.',
  },
  {
    formula: 'Gross profit divided by revenue.',
    name: 'Gross margin',
    target: 'Watch this by service line, not only company-wide.',
  },
  {
    formula: 'Accepted quotes divided by sent quotes.',
    name: 'Quote win rate',
    target: 'Improve with faster follow-up, clearer scopes, and better photo proof.',
  },
  {
    formula: 'Revenue divided by labor hours sold.',
    name: 'Revenue per labor hour',
    target: 'Use this to price bigger jobs and compare crews.',
  },
  {
    formula: 'Repeat customers divided by total active customers.',
    name: 'Repeat rate',
    target: 'This is the base for route density and MRR.',
  },
  {
    formula: 'Open quotes weighted by close probability.',
    name: 'Projected revenue',
    target: 'Keep a 2-4 week forward view so hiring and equipment decisions are not reactive.',
  },
] as const

export const liabilityChecklist = [
  'Sales tax collected but not yet remitted',
  'Credit-card processing fees and refunds',
  'Debt or financing tied to equipment, vehicle, or trailer purchases',
  'Chemical, fuel, and repair bills not yet paid',
  'Warranty callbacks, rework time, and damage claims reserve',
  'Payroll tax and contractor payment obligations',
] as const

export const operatingRhythm = {
  daily: [
    '7:30-8:00: review weather, route, jobs, leads, and unpaid quotes.',
    '8:00-9:30: outbound calls, text follow-ups, quote revisions, review requests, and CRM cleanup unless a job is already staged and time-sensitive.',
    '9:30-12:30: first field block. Favor production jobs that benefit from cooler temperatures, better driveway access, or homeowner availability.',
    '12:30-1:00: lunch plus quick status update. Confirm the afternoon arrival window with the next customer.',
    '1:00-4:30: second field block. Stack nearby jobs together; avoid long deadhead gaps.',
    '4:30-5:15: before/after photo upload, invoices, payment collection, route notes, tomorrow confirmations.',
  ],
  monthly: [
    'Review scorecard, tax reserve, cash buffer, and asset readiness on the first business day.',
    'Raise or lower pricing only after reviewing win rate, close speed, and margin by service line.',
    'Promote one maintenance-plan offer and one seasonal upsell every month.',
  ],
  weekly: [
    'Monday: review pipeline, schedule, and job board.',
    'Wednesday: quote review and pricing calibration.',
    'Friday: collect reviews, send maintenance reminders, and close the week with bookkeeping.',
  ],
} as const

export const growthMilestones = [
  {
    milestone: 'Milestone 1: Reliable base',
    trigger: '0-8 jobs per month',
    winCondition: 'Consistent quoting, before/after photos, follow-up discipline, and same-week bookkeeping.',
  },
  {
    milestone: 'Milestone 2: Route density',
    trigger: '8-20 jobs per month',
    winCondition: 'Group jobs by geography, push maintenance plans, and reduce windshield time.',
  },
  {
    milestone: 'Milestone 3: Systemized sales',
    trigger: '20-35 jobs per month',
    winCondition: 'Quotes go out same day, follow-ups are templated, and repeat customers are marketed to automatically.',
  },
  {
    milestone: 'Milestone 4: Crew leverage',
    trigger: '35+ jobs per month or owner schedule bottleneck',
    winCondition: 'Owner is not the only closer or field operator; SOPs and training exist.',
  },
] as const

export const assetLadder = [
  {
    category: 'Low-cost speed upgrades',
    buy: 'Downstream injector, extra hose, spare tips, better wand/gun setup, jobsite cones and signs',
    why: 'Cheap upgrades reduce setup friction and let the current washer earn more before a big capital purchase.',
  },
  {
    category: 'Flatwork production',
    buy: '20-inch commercial surface cleaner and 150-200 ft hose reel',
    why: 'Large flat areas become faster, more uniform, and easier to quote confidently.',
  },
  {
    category: 'Water independence',
    buy: '300-325 gallon buffer tank and trailer or truck-bed mounting plan',
    why: 'Remote properties and larger sites stop being limited by weak spigots or awkward access.',
  },
  {
    category: 'Commercial throughput',
    buy: 'Truck- or trailer-mount unit in the 8+ GPM class once demand justifies it',
    why: 'Higher GPM increases production on large concrete, parking, and commercial jobs much more than chasing PSI alone.',
  },
  {
    category: 'Premium service mix',
    buy: 'Hot-water capability and dedicated soft-wash / chemical workflow when grease, gum, and specialty work are common',
    why: 'This opens higher-ticket work, but only after lead flow and operator discipline are already stable.',
  },
] as const

export const toolRecommendations = [
  {
    category: 'FSM / quoting',
    recommendation: 'Jobber is the cleanest next step if you want quoting, scheduling, approvals, and a client portal in one tool.',
  },
  {
    category: 'Photo documentation',
    recommendation: 'CompanyCam is a strong fit if before/after proof and field accountability need to become routine.',
  },
  {
    category: 'Accounting',
    recommendation: 'QuickBooks with job costing is the simplest path to revenue, margin, and project profitability tracking.',
  },
] as const
