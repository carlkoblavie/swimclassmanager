import { Card, createTheme } from '@mantine/core'

// Pool-water blue: the app's aquatic primary ramp (index 6 is the primary shade).
const aqua = [
  '#e6f4fc',
  '#d0e9f7',
  '#a1d2ef',
  '#6fbae7',
  '#48a6e0',
  '#3299dc',
  '#2492db',
  '#157ec4',
  '#0470b0',
  '#00619c',
] as const

export const theme = createTheme({
  colors: { aqua },
  primaryColor: 'aqua',
  defaultRadius: 'md',
  fontFamily: 'system-ui, sans-serif',
  headings: {
    fontFamily: 'system-ui, sans-serif',
    fontWeight: '600',
  },
  components: {
    Card: Card.extend({
      defaultProps: {
        withBorder: true,
        radius: 'md',
        shadow: 'xs',
        padding: 'lg',
      },
    }),
  },
})
