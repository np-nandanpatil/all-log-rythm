import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'indigo',
  fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  headings: {
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontWeight: '600',
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
  colors: {
    // Custom modern indigo palette
    indigo: [
      '#e0e7ff', // 0
      '#c7d2fe', // 1
      '#a5b4fc', // 2
      '#818cf8', // 3
      '#6366f1', // 4
      '#4f46e5', // 5 (Primary - standard)
      '#4338ca', // 6
      '#3730a3', // 7
      '#312e81', // 8
      '#1e1b4b', // 9
    ],
  },
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
        fw: 500,
      },
      styles: {
        root: {
          transition: 'transform 0.1s ease, box-shadow 0.15s ease',
          '&:hover': {
             transform: 'translateY(-1px)',
          }
        },
      },
    },
    Card: {
      defaultProps: {
        radius: 'lg',
        shadow: 'sm',
        withBorder: true,
      },
      styles: () => ({
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(12px)',
          borderColor: 'rgba(255, 255, 255, 0.4)',
          transition: 'all 0.2s ease-out',
        },
      }),
    },
    Paper: {
      defaultProps: {
        radius: 'lg',
      },
    },
    TextInput: {
      defaultProps: {
        radius: 'md',
        size: 'md',
      },
    },
  },
});
