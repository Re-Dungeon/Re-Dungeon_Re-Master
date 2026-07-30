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
    primary: { main: '#6f2da8' },
    secondary: { main: '#00d9ff' },
    background: { default: '#050816', paper: '#10182b' },
    text: { primary: '#f8fafc', secondary: '#94a3b8' },
  },
  typography: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', borderRadius: 8 },
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
