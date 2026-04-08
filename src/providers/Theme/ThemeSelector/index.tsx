'use client'

import { Check, Palette } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/utilities/ui'

import { useTheme } from '..'
import { themeIsValid } from '../types'
import { themeLocalStorageKey } from './types'

const MODES = ['auto', 'light', 'dark'] as const
type Mode = (typeof MODES)[number]

const LABELS: Record<Mode, string> = {
  auto: 'Auto',
  dark: 'Dark',
  light: 'Light',
}

function readInitialMode(): Mode {
  if (typeof window === 'undefined') return 'auto'
  const preference = window.localStorage.getItem(themeLocalStorageKey)
  return themeIsValid(preference) ? preference : 'auto'
}

export function ThemeSelector() {
  const { setTheme } = useTheme()
  const [value, setValue] = useState<Mode>(readInitialMode)

  const onThemeChange = (themeToSet: Mode) => {
    if (themeToSet === 'auto') {
      setTheme(null)
      setValue('auto')
    } else {
      setTheme(themeToSet)
      setValue(themeToSet)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          aria-label="Theme"
        >
          <Palette className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {MODES.map((mode) => (
          <DropdownMenuItem
            key={mode}
            className="gap-2"
            onClick={() => onThemeChange(mode)}
          >
            <span className="flex size-4 items-center justify-center">
              <Check className={cn('size-4', value === mode ? 'opacity-100' : 'opacity-0')} />
            </span>
            {LABELS[mode]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

