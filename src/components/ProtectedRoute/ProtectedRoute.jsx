import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { useAuth } from 'context/AuthContext';
import LoginModal from 'components/LoginModal/LoginModal';

const PageLoadingFallback = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      flex: 1,
      height: '100%',
    }}
  >
    <CircularProgress sx={{ color: 'var(--color-primary)' }} />
  </Box>
);

const ProtectedRoute = () => {
  const { currentUser, loading, loadingPermissions, canCreate, logout } =
    useAuth();

  if (loading || loadingPermissions) {
    return <PageLoadingFallback />;
  }

  if (!currentUser) {
    return <LoginModal open onClose={() => {}} />;
  }

  if (!canCreate()) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          textAlign: 'center',
          background: 'var(--bg-primary)',
          px: 3,
        }}
      >
        <Typography variant="h4" sx={{ color: 'var(--text-primary)', fontWeight: 800 }}>
          Acesso não autorizado
        </Typography>
        <Typography sx={{ color: 'var(--text-secondary)', maxWidth: 420 }}>
          Sua conta está autenticada, mas não possui autorização para acessar este
          conteúdo do Re.
        </Typography>
        <Button
          variant="outlined"
          onClick={() => logout()}
          sx={{
            borderColor: 'rgba(248, 113, 113, 0.4)',
            color: 'var(--text-primary)',
            borderRadius: '12px',
          }}
        >
          Sair
        </Button>
      </Box>
    );
  }

  return (
    <Suspense fallback={<PageLoadingFallback />}>
      <Outlet />
    </Suspense>
  );
};

export default ProtectedRoute;
