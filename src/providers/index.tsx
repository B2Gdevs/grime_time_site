import React from 'react'

import { AppQueryProvider } from './AppQueryProvider'
import { DemoModeProvider } from './DemoModeProvider'
import { HeaderThemeProvider } from './HeaderTheme'
import { ThemeProvider } from './Theme'

export const Providers: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  return (
    <ThemeProvider>
      <AppQueryProvider>
        <DemoModeProvider>
          <HeaderThemeProvider>{children}</HeaderThemeProvider>
        </DemoModeProvider>
      </AppQueryProvider>
    </ThemeProvider>
  )
}
