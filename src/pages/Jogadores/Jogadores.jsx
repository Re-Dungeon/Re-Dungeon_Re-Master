import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import {
  getPersonagensJogaveis,
  getRmCampanhaJogadores,
  removeRmCampanhaJogador,
} from 'service/storage';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import PersonagemFichaDialog from 'components/PersonagemFichaDialog/PersonagemFichaDialog';
import { ROUTE_PATHS } from 'common/constants/routes';
import { ehJogadorDaCampanha } from './jogadoresUtils';

const cardSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

// Mesmo padrão de pages/Npcs/Npcs.jsx: a lista vem sempre de `personagens`
// (Re-Dungeon), filtrada por tipo/universo/vínculo com a campanha. `clones`
// (rmCampanhas/{id}/jogadores) guarda só os campos extras que o mestre
// preencheu para esta campanha, indexados por origemPersonagemId.
const Jogadores = () => {
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const [jogadoresDoUniverso, setJogadoresDoUniverso] = useState([]);
  const [clones, setClones] = useState([]);
  const [loadingJogadores, setLoadingJogadores] = useState(true);
  const [errorJogadores, setErrorJogadores] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [personagemVisualizado, setPersonagemVisualizado] = useState(null);

  const reload = useCallback(() => setReloadToken(token => token + 1), []);

  useEffect(() => {
    // Sem campanha ativa a tela retorna null mais abaixo antes de renderizar
    // o estado de loading, então não há necessidade de mexer nele aqui.
    if (!campanhaAtiva) return undefined;
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setLoadingJogadores(true);
      setErrorJogadores(null);
      Promise.all([
        getPersonagensJogaveis(),
        getRmCampanhaJogadores(campanhaAtiva.id),
      ])
        .then(([personagens, jogadoresClonados]) => {
          if (!active) return;
          setJogadoresDoUniverso(
            personagens.filter(p => ehJogadorDaCampanha(p, campanhaAtiva)),
          );
          setClones(jogadoresClonados);
        })
        .catch(err => {
          if (active) setErrorJogadores(err);
        })
        .finally(() => {
          if (active) setLoadingJogadores(false);
        });
    });
    return () => {
      active = false;
    };
  }, [campanhaAtiva, reloadToken]);

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  if (!campanhaAtiva && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingJogadores;
  const podeEscrever = campanhaAtiva
    ? canWrite(campanhaAtiva.universoId)
    : false;

  const cloneDe = personagemId =>
    clones.find(clone => clone.origemPersonagemId === personagemId) ?? null;

  const handleClonar = personagem => {
    navigate(ROUTE_PATHS.JOGADOR_CLONE, { state: { personagem } });
  };

  const handleEditarClone = (personagem, clone) => {
    navigate(ROUTE_PATHS.JOGADOR_CLONE, { state: { personagem, clone } });
  };

  const handleRemoverClone = async clone => {
    await removeRmCampanhaJogador(campanhaAtiva.id, clone.id);
    setClones(prev => prev.filter(c => c.id !== clone.id));
  };

  return (
    <Box className="page-container">
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.5 }}
        >
          Jogadores — {campanhaAtiva?.nome}
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
          Personagens jogáveis do Universo vinculados a esta campanha. Clone um
          jogador para adicionar informações específicas da sua mesa, sem
          alterar a ficha original.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : errorJogadores ? (
        <ListLoadError
          mensagem="Erro ao carregar os jogadores."
          onRetry={reload}
        />
      ) : jogadoresDoUniverso.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">🧑‍🤝‍🧑</span>
          <p>Nenhum jogador vinculado a esta campanha</p>
          <small>
            No Universo desta campanha, vincule um personagem jogável a esta
            campanha para que ele apareça aqui.
          </small>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(280px, 1fr))',
            },
            gap: 2,
          }}
        >
          {jogadoresDoUniverso.map(personagem => {
            const clone = cloneDe(personagem.id);
            return (
              <Paper key={personagem.id} elevation={0} sx={cardSx}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: 'var(--text-primary)', fontWeight: 600 }}
                  >
                    {personagem.nome}
                  </Typography>
                  {podeEscrever && clone && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEditarClone(personagem, clone)}
                        sx={{ color: 'var(--color-accent)' }}
                        aria-label={`Editar clone de ${personagem.nome}`}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoverClone(clone)}
                        sx={{ color: '#ef4444' }}
                        aria-label={`Remover clone de ${personagem.nome}`}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {personagem.linkImagem && (
                  <Box
                    component="img"
                    src={personagem.linkImagem}
                    alt={personagem.nome}
                    sx={{
                      width: '100%',
                      height: 160,
                      borderRadius: 2,
                      objectFit: 'cover',
                      display: 'block',
                      border: '1px solid var(--border-primary)',
                      mb: 1.5,
                    }}
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}

                {personagem.descricao && (
                  <Typography
                    variant="body2"
                    sx={{ color: 'var(--text-secondary)', mb: 1.5 }}
                  >
                    {personagem.descricao}
                  </Typography>
                )}

                {clone && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'var(--color-accent)',
                      display: 'block',
                      mb: 1.5,
                    }}
                  >
                    Clonado nesta campanha
                  </Typography>
                )}

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button
                    size="small"
                    startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                    onClick={() => setPersonagemVisualizado(personagem)}
                    sx={{ color: 'var(--text-secondary)' }}
                  >
                    Ver ficha
                  </Button>
                  {podeEscrever && !clone && (
                    <Button
                      size="small"
                      startIcon={<ContentCopyOutlinedIcon fontSize="small" />}
                      onClick={() => handleClonar(personagem)}
                      sx={{ color: 'var(--color-accent)' }}
                    >
                      Clonar
                    </Button>
                  )}
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      <PersonagemFichaDialog
        open={Boolean(personagemVisualizado)}
        onClose={() => setPersonagemVisualizado(null)}
        personagem={personagemVisualizado}
      />
    </Box>
  );
};

export default Jogadores;
