function addMilliseconds(date: Date, milliseconds: number) {
  return new Date(date.getTime() + milliseconds)
}

function unitToMilliseconds(amount: number, unit: null | string | undefined) {
  switch (unit) {
    case 'minutes':
      return amount * 60 * 1000
    case 'hours':
      return amount * 60 * 60 * 1000
    case 'weeks':
      return amount * 7 * 24 * 60 * 60 * 1000
    case 'days':
    default:
      return amount * 24 * 60 * 60 * 1000
  }
}

function isWeekend(date: Date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

export function computeSequenceRunDate(args: {
  amount: number
  businessDaysOnly?: boolean | null
  from?: Date
  sendWindowEndHour?: number | null
  sendWindowStartHour?: number | null
  unit?: null | string
}) {
  const from = args.from ?? new Date()
  const date = addMilliseconds(from, unitToMilliseconds(args.amount, args.unit))

  if (typeof args.sendWindowStartHour === 'number' && date.getHours() < args.sendWindowStartHour) {
    date.setHours(args.sendWindowStartHour, 0, 0, 0)
  }

  if (typeof args.sendWindowEndHour === 'number' && date.getHours() >= args.sendWindowEndHour) {
    date.setDate(date.getDate() + 1)
    date.setHours(args.sendWindowStartHour ?? 8, 0, 0, 0)
  }

  if (args.businessDaysOnly) {
    while (isWeekend(date)) {
      date.setDate(date.getDate() + 1)
      date.setHours(args.sendWindowStartHour ?? 8, 0, 0, 0)
    }
  }

  return date
}
