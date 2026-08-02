import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import { useCampanha } from 'context/CampanhaContext';
import {
  getRmCampanhaNpcs,
  getRmCampanhaCriaturas,
  getRmCenas,
  getRmMapasPorCampanha,
  getRmMissoesPorCampanha,
  getRmNotasPorCampanha,
} from 'service/storage';
import {
  montarItensBuscaveis,
  filtrarItensBuscaveis,
} from './buscaGlobalUtils';

const TIPO_COR = {
  NPC: 'var(--color-primary)',
  Criatura: '#0e7490',
  Cena: 'var(--color-accent)',
  Mapa: '#a855f7',
  Missão: '#f59e0b',
  Nota: '#64748b',
};

// Busca cross-entidade (Header, disponível em qualquer tela): acha um NPC,
// Cena, Mapa, Missão ou Nota pelo nome/título sem o mestre precisar lembrar
// em qual tela ele está. Carrega as listas da campanha ativa uma vez na
// primeira abertura (não a cada tecla) e filtra em memória — a campanha
// inteira cabe tranquilamente em memória e evita gastar leituras do
// Firestore a cada caractere digitado.
const BuscaGlobal = () => {
  const navigate = useNavigate();
  const { campanhaAtiva } = useCampanha();
  const [anchorEl, setAnchorEl] = useState(null);
  const [termo, setTermo] = useState('');
  const [itens, setItens] = useState(null);
  const [carregando, setCarregando] = useState(false);

  const handleAbrir = async event => {
    setAnchorEl(event.currentTarget);
    if (itens !== null || !campanhaAtiva) return;
    setCarregando(true);
    try {
      const { id: campanhaId, universoId, mestreId } = campanhaAtiva;
      const [npcs, criaturas, cenas, mapas, missoes, notas] = await Promise.all(
        [
          getRmCampanhaNpcs(campanhaId, universoId, mestreId),
          getRmCampanhaCriaturas(campanhaId, universoId, mestreId),
          getRmCenas(campanhaId, universoId, mestreId),
          getRmMapasPorCampanha(campanhaId, universoId, mestreId),
          getRmMissoesPorCampanha(campanhaId, universoId, mestreId),
          getRmNotasPorCampanha(campanhaId, universoId, mestreId),
        ],
      );
      setItens(
        montarItensBuscaveis({ npcs, criaturas, cenas, mapas, missoes, notas }),
      );
    } finally {
      setCarregando(false);
    }
  };

  const handleFechar = () => {
    setAnchorEl(null);
    setTermo('');
  };

  const handleSelecionar = item => {
    navigate(item.rota, item.state ? { state: item.state } : undefined);
    handleFechar();
  };

  if (!campanhaAtiva) return null;

  const resultados = filtrarItensBuscaveis(termo, itens ?? []);

  return (
    <>
      <IconButton
        onClick={handleAbrir}
        sx={{ color: 'var(--text-secondary)' }}
        aria-label="Buscar na campanha"
      >
        <SearchIcon />
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleFechar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ p: 2, width: 320, background: 'var(--bg-card)' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Buscar NPCs, Cenas, Mapas..."
            value={termo}
            onChange={e => setTermo(e.target.value)}
            slotProps={{ htmlInput: { 'aria-label': 'Termo de busca' } }}
          />
          <Box sx={{ mt: 1.5, maxHeight: 320, overflowY: 'auto' }}>
            {carregando ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress
                  size={22}
                  sx={{ color: 'var(--color-accent)' }}
                />
              </Box>
            ) : termo.trim().length < 2 ? (
              <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                Digite ao menos 2 caracteres para buscar.
              </Typography>
            ) : resultados.length === 0 ? (
              <Typography variant="caption" sx={{ color: 'var(--text-muted)' }}>
                Nenhum resultado para &quot;{termo}&quot;.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {resultados.map(item => (
                  <Button
                    key={`${item.tipo}-${item.id}`}
                    onClick={() => handleSelecionar(item)}
                    sx={{
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-secondary)',
                      '&:hover': {
                        background: 'var(--bg-secondary)',
                        opacity: 0.8,
                      },
                    }}
                  >
                    <Typography variant="body2" noWrap sx={{ mr: 1 }}>
                      {item.titulo}
                    </Typography>
                    <Chip
                      label={item.tipo}
                      size="small"
                      sx={{
                        background: TIPO_COR[item.tipo] ?? 'var(--bg-card)',
                        color: '#fff',
                        flexShrink: 0,
                      }}
                    />
                  </Button>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Popover>
    </>
  );
};

export default BuscaGlobal;
