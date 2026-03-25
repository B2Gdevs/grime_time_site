'use client'

import * as React from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, getDefaultClassNames } from 'react-day-picker'

import { cn } from '@/utilities/ui'
import { buttonVariants } from '@/components/ui/button'

import 'react-day-picker/style.css'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('rounded-lg border bg-card p-3 shadow-sm', className)}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        months: cn('relative flex flex-col gap-4 sm:flex-row', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-4', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 px-1',
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'size-8 select-none p-0 aria-disabled:opacity-40',
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'size-8 select-none p-0 aria-disabled:opacity-40',
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          'flex h-8 w-full items-center justify-center px-10',
          defaultClassNames.month_caption,
        ),
        caption_label: cn('text-sm font-medium', defaultClassNames.caption_label),
        month_grid: cn('mx-auto w-full border-collapse', defaultClassNames.month_grid),
        weekdays: cn('flex', defaultClassNames.weekdays),
        weekday: cn(
          'text-muted-foreground flex-1 select-none text-center text-[0.8rem] font-normal',
          defaultClassNames.weekday,
        ),
        week: cn('mt-2 flex w-full', defaultClassNames.week),
        day: cn(
          'group/day relative flex aspect-square h-full w-full items-center justify-center p-0 text-center text-sm',
          defaultClassNames.day,
        ),
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'size-9 p-0 font-normal data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground',
          defaultClassNames.day_button,
        ),
        selected: cn('rounded-md', defaultClassNames.selected),
        today: cn('rounded-md bg-accent text-accent-foreground', defaultClassNames.today),
        outside: cn('text-muted-foreground opacity-50', defaultClassNames.outside),
        disabled: cn('text-muted-foreground opacity-40', defaultClassNames.disabled),
        hidden: cn('invisible', defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="size-4" aria-hidden />
          ) : (
            <ChevronRight className="size-4" aria-hidden />
          ),
      }}
      {...props}
    />
  )
}

export { Calendar }
