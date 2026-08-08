import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App.jsx';
import { AuthProvider } from 'context/AuthContext';
import { CampanhaProvider } from 'context/CampanhaContext';
import { SnackbarProvider } from 'context/SnackbarContext';
import ErrorBoundary from 'components/ErrorBoundary/ErrorBoundary';
import 'common/styles/global.css';
import 'common/styles/sidebar.css';
import 'common/styles/pages.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#8F231C' },
    secondary: { main: '#A9B0BA' },
    background: { default: '#0A0C10', paper: '#171B22' },
    text: { primary: '#F3F4F6', secondary: '#A9B0BA' },
  },
  typography: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 14,
          transition: 'all 150ms ease-out',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #8F231C 0%, #C43A2F 100%)',
          color: '#F3F4F6',
          boxShadow: '0 14px 32px rgba(0, 0, 0, 0.28)',
        },
        outlined: {
          borderColor: 'rgba(255,255,255,0.12)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <HashRouter>
          <AuthProvider>
            <CampanhaProvider>
              <SnackbarProvider>
                <App />
              </SnackbarProvider>
            </CampanhaProvider>
          </AuthProvider>
        </HashRouter>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
