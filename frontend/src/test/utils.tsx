/* eslint-disable react-refresh/only-export-components */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, renderHook } from '@testing-library/react'
import type { ReactNode, ReactElement } from 'react'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
}

export function Wrapper({ children }: { children: ReactNode }) {
  const client = createTestQueryClient()
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

export function renderWithProviders(ui: ReactElement) {
  return render(ui, { wrapper: Wrapper })
}

export function renderHookWithProviders<T>(hook: () => T) {
  return renderHook(hook, { wrapper: Wrapper })
}
