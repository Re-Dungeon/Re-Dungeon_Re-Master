import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100%',
            gap: 2,
            textAlign: 'center',
            padding: 4,
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-muted)',
          }}
        >
          <Typography variant="h1" sx={{ fontSize: '3rem', lineHeight: 1 }}>
            ⚠️
          </Typography>
          <Typography
            variant="h6"
            sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}
          >
            Algo deu errado
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: 'var(--text-muted)', maxWidth: 360 }}
          >
            Ocorreu um erro inesperado ao carregar esta página. Tente recarregar
            — se o problema persistir, entre em contato com o responsável pelo
            projeto.
          </Typography>
          <Button
            variant="contained"
            onClick={this.handleReload}
            sx={{
              mt: 1,
              backgroundColor: 'var(--color-accent)',
              color: 'var(--bg-primary)',
              '&:hover': {
                backgroundColor: 'var(--color-accent)',
                opacity: 0.85,
              },
            }}
          >
            Recarregar
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
