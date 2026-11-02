import { MantineProvider, createTheme } from '@mantine/core';
import type { PropsWithChildren } from 'react';

const theme = createTheme({
  primaryColor: 'violet',
  defaultRadius: 0,
  fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
  headings: { fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif' },
});

export function AppProviders({ children }: PropsWithChildren) {
  return <MantineProvider theme={theme}>{children}</MantineProvider>;
}
