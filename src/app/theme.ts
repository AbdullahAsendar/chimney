import { createTheme, ThemeOptions } from '@mui/material/styles';

const baseTheme: ThemeOptions = {
  palette: {
    primary: { main: '#006635' },
    secondary: { main: '#4A90E2' },
    background: { default: '#f3f3f8', paper: '#fff' },
    text: { primary: '#2c332f', secondary: '#4A4A4A' },
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  shape: { borderRadius: 3 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          fontWeight: 700,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 3,
        },
      },
    },
  },
};

export const getTheme = (mode: 'light' | 'dark') =>
  createTheme({
    ...baseTheme,
    palette: {
      ...baseTheme.palette,
      mode,
      ...(mode === 'dark'
        ? {
            background: { default: '#181c1f', paper: '#23272a' },
            text: { primary: '#fff', secondary: '#b0b0b0' },
          }
        : {}),
    },
  }); 