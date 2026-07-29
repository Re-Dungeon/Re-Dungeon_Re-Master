import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useCampanha } from 'context/CampanhaContext';
import { ROUTE_PATHS } from 'common/constants/routes';

const Dashboard = () => {
  const navigate = useNavigate();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  if (loadingCampanhas) return null;

  return (
    <Box className="page-container">
      <Box className="page-section">
        <Box className="page-header">
          <Box>
            <Typography variant="h3">Dashboard</Typography>
            <Typography variant="body2">
              {campanhaAtiva
                ? `Campanha ativa: ${campanhaAtiva.nome}`
                : 'Centro de comando da sessão — em construção.'}
            </Typography>
          </Box>
        </Box>
        {campanhaAtiva ? (
          <Box className="empty-state">
            <span className="empty-state-icon">🗺️</span>
            <p>Fluxograma de cenas em construção</p>
            <small>
              O restante do Dashboard (cena atual, NPCs, missões, notas
              rápidas) chega nos próximos módulos.
            </small>
          </Box>
        ) : (
          <Box className="empty-state">
            <span className="empty-state-icon">🏠</span>
            <p>Nenhuma campanha selecionada</p>
            <small>Crie ou selecione uma Campanha para começar a rodar sua sessão.</small>
            <Button
              variant="contained"
              onClick={() => navigate(ROUTE_PATHS.CAMPANHA)}
              sx={{
                mt: 2,
                background: 'var(--color-primary)',
                '&:hover': { background: '#5a2090' },
              }}
            >
              Ir para Campanha
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
