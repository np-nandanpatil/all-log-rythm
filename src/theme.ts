import { createTheme, rem } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'indigo',
  fontFamily: 'Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
  headings: {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: rem(32) },
      h2: { fontSize: rem(24) },
      h3: { fontSize: rem(20) },
    },
  },
  defaultRadius: 'md',
  shadows: {
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
  components: {
    Card: {
      defaultProps: {
        shadow: 'sm',
        withBorder: true,
      },
      styles: (theme) => ({
        root: {
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        },
      }),
    },
    Button: {
      defaultProps: {
        fw: 500,
      },
      styles: {
        root: {
          transition: 'transform 0.1s ease',
        },
      },
    },
    Badge: {
      defaultProps: {
        fw: 600,
        radius: 'sm',
      }
    }
  },
});
