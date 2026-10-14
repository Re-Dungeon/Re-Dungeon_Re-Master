import React, { Suspense, useState } from 'react';
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
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  if (loading || loadingPermissions) {
    return <PageLoadingFallback />;
  }

  if (!currentUser) {
    return (
      <>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
            minHeight: '100vh',
            gap: 2,
            color: 'var(--text-muted)',
            background: 'radial-gradient(circle at top, rgba(127, 29, 29, 0.22), transparent 42%), var(--bg-primary)',
            px: 3,
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              width: 72,
              height: 72,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '18px',
              background: 'rgba(127, 29, 29, 0.12)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              fontSize: '2.5rem',
            }}
            aria-hidden="true"
          >
            🔒
          </Box>

          <Typography
            variant="h4"
            sx={{
              color: 'var(--text-primary)',
              fontWeight: 800,
              letterSpacing: '-0.04em',
            }}
          >
            Acesso Restrito
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'var(--text-secondary)',
              maxWidth: 420,
              lineHeight: 1.6,
            }}
          >
            Faça login com sua conta para acessar o painel do Re:Master e o
            conteúdo da sua campanha.
          </Typography>

          <Button
            variant="contained"
            onClick={() => setLoginModalOpen(true)}
            sx={{
              mt: 1,
              px: 3,
              py: 1,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)',
              color: '#fff',
              fontWeight: 700,
              '&:hover': {
                background: 'linear-gradient(135deg, #991b1b 0%, #be123c 100%)',
              },
            }}
          >
            Entrar
          </Button>
        </Box>

        <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      </>
    );
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
