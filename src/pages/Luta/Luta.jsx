import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import {
  getPersonagens,
  getRmCampanhaLutaParticipantes,
  addRmCampanhaLutaParticipante,
  removeRmCampanhaLutaParticipante,
  updateRmCampanhaLutaParticipante,
} from 'service/storage';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import { ROUTE_PATHS } from 'common/constants/routes';
import { getTipoPersonagem } from 'common/utils/personagemTipo';
import { ehNpcDaCampanha } from 'pages/Npcs/npcUtils';
import { ehCriaturaDaCampanha } from 'pages/Criaturas/criaturaUtils';
import AdicionarParticipanteDialog from './AdicionarParticipanteDialog';
import {
  STATS_LUTA,
  extrairStatusBase,
  proximoNomeDuplicado,
} from './lutaUtils';

const cardSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2,
};

const statInputSx = {
  width: 60,
  '& input': { textAlign: 'center', padding: '6px 4px' },
};

// Tela para o mestre conduzir um combate: adiciona NPCs/Criaturas já
// vinculados a esta campanha como participantes (cada um com seu próprio
// estado de vida/fadiga/mana) e ajusta esses status ao vivo durante a luta.
// Diferente de NPCs/Criaturas (que espelham a ficha do Re-Dungeon), o
// participante de Luta é uma cópia independente — permite duplicar o mesmo
// personagem de origem várias vezes (ex.: 5 "Rato Gigante" na mesma luta).
const Luta = () => {
  const navigate = useNavigate();
  const { canCreate, canWrite } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const [personagens, setPersonagens] = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const [error, setError] = useState(null);
  const [dialogoAberto, setDialogoAberto] = useState(false);

  const carregarDados = useCallback(async () => {
    if (!campanhaAtiva) {
      setPersonagens([]);
      setParticipantes([]);
      setLoadingDados(false);
      return;
    }
    setLoadingDados(true);
    setError(null);
    try {
      const [todosPersonagens, participantesDaLuta] = await Promise.all([
        getPersonagens(),
        getRmCampanhaLutaParticipantes(campanhaAtiva.id),
      ]);
      setPersonagens(
        todosPersonagens.filter(
          p =>
            ehNpcDaCampanha(p, campanhaAtiva) ||
            ehCriaturaDaCampanha(p, campanhaAtiva),
        ),
      );
      setParticipantes(participantesDaLuta);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingDados(false);
    }
  }, [campanhaAtiva]);

  useEffect(() => {
    Promise.resolve().then(() => carregarDados());
  }, [carregarDados]);

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  if (!campanhaAtiva && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingDados;
  const podeEscrever = campanhaAtiva
    ? canWrite(campanhaAtiva.universoId)
    : false;

  const handleAdicionar = async (personagem, quantidade) => {
    const novos = [];
    for (let i = 0; i < quantidade; i += 1) {
      novos.push({
        origemPersonagemId: personagem.id,
        origemTipo: getTipoPersonagem(personagem),
        nomeBase: personagem.nome,
        nome: proximoNomeDuplicado(personagem.nome, [
          ...participantes,
          ...novos,
        ]),
        linkImagem: personagem.linkImagem ?? '',
        ...extrairStatusBase(personagem),
        universoId: campanhaAtiva.universoId,
        mestreId: campanhaAtiva.mestreId,
      });
    }
    await Promise.all(
      novos.map(participante =>
        addRmCampanhaLutaParticipante(campanhaAtiva.id, participante),
      ),
    );
    await carregarDados();
  };

  const handleDuplicar = async participante => {
    await addRmCampanhaLutaParticipante(campanhaAtiva.id, {
      origemPersonagemId: participante.origemPersonagemId,
      origemTipo: participante.origemTipo,
      nomeBase: participante.nomeBase,
      nome: proximoNomeDuplicado(participante.nomeBase, participantes),
      linkImagem: participante.linkImagem,
      vidaAtual: participante.vidaMaxima,
      vidaMaxima: participante.vidaMaxima,
      fadigaAtual: participante.fadigaMaxima,
      fadigaMaxima: participante.fadigaMaxima,
      manaAtual: participante.manaMaxima,
      manaMaxima: participante.manaMaxima,
      universoId: campanhaAtiva.universoId,
      mestreId: campanhaAtiva.mestreId,
    });
    await carregarDados();
  };

  const handleRemover = async participante => {
    await removeRmCampanhaLutaParticipante(campanhaAtiva.id, participante.id);
    setParticipantes(prev => prev.filter(p => p.id !== participante.id));
  };

  // Digitar só atualiza o estado local (evita gravar a cada tecla); o commit
  // no Firestore acontece ao sair do campo ou nos botões +/- (ação discreta).
  const handleStatInputChange = (participante, campo, valorBruto) => {
    setParticipantes(prev =>
      prev.map(p =>
        p.id === participante.id ? { ...p, [campo]: valorBruto } : p,
      ),
    );
  };

  const commitStat = async (participante, campo, valor) => {
    const numero = Math.max(0, Number(valor) || 0);
    setParticipantes(prev =>
      prev.map(p => (p.id === participante.id ? { ...p, [campo]: numero } : p)),
    );
    await updateRmCampanhaLutaParticipante(campanhaAtiva.id, participante.id, {
      [campo]: numero,
    });
  };

  const handleStatInputBlur = (participante, campo) => {
    commitStat(participante, campo, participante[campo]);
  };

  const handleAjustarStat = (participante, campo, delta) => {
    commitStat(participante, campo, (Number(participante[campo]) || 0) + delta);
  };

  return (
    <Box className="page-container">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.5 }}
          >
            Luta — {campanhaAtiva?.nome}
          </Typography>
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Controle a vida, fadiga e mana dos NPCs e Criaturas em combate.
          </Typography>
        </Box>
        {canCreate() && podeEscrever && (
          <Button
            variant="contained"
            onClick={() => setDialogoAberto(true)}
            sx={{
              background: 'var(--color-primary)',
              '&:hover': { background: '#5a2090' },
            }}
          >
            + Adicionar Participante
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : error ? (
        <ListLoadError
          mensagem="Erro ao carregar a luta."
          onRetry={carregarDados}
        />
      ) : participantes.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">⚔️</span>
          <p>Nenhum participante na luta</p>
          <small>
            Adicione NPCs e Criaturas vinculados a esta campanha para começar o
            combate.
          </small>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(300px, 1fr))',
            },
            gap: 2,
          }}
        >
          {participantes.map(participante => (
            <Paper key={participante.id} elevation={0} sx={cardSx}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 1.5,
                }}
              >
                {participante.linkImagem && (
                  <Box
                    component="img"
                    src={participante.linkImagem}
                    alt={participante.nome}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1.5,
                      objectFit: 'cover',
                      border: '1px solid var(--border-primary)',
                      flexShrink: 0,
                    }}
                    onError={e => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'var(--text-primary)',
                      fontWeight: 600,
                      lineHeight: 1.2,
                    }}
                  >
                    {participante.nome}
                  </Typography>
                  <Chip
                    label={participante.origemTipo}
                    size="small"
                    sx={{
                      mt: 0.25,
                      background:
                        participante.origemTipo === 'NPC'
                          ? 'var(--color-primary)'
                          : '#0e7490',
                      color: '#fff',
                    }}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  mb: 1.5,
                }}
              >
                {STATS_LUTA.map(stat => {
                  const campoAtual = `${stat.chave}Atual`;
                  const campoMaximo = `${stat.chave}Maxima`;
                  return (
                    <Box
                      key={stat.chave}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          width: 48,
                          color: stat.cor,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {stat.label}
                      </Typography>
                      <IconButton
                        size="small"
                        disabled={!podeEscrever}
                        onClick={() =>
                          handleAjustarStat(participante, campoAtual, -1)
                        }
                        sx={{ color: 'var(--text-secondary)' }}
                        aria-label={`Diminuir ${stat.label} de ${participante.nome}`}
                      >
                        <RemoveIcon fontSize="inherit" />
                      </IconButton>
                      <TextField
                        type="number"
                        size="small"
                        value={participante[campoAtual] ?? 0}
                        disabled={!podeEscrever}
                        onChange={e =>
                          handleStatInputChange(
                            participante,
                            campoAtual,
                            e.target.value,
                          )
                        }
                        onBlur={() =>
                          handleStatInputBlur(participante, campoAtual)
                        }
                        slotProps={{
                          htmlInput: {
                            'aria-label': `${stat.label} atual de ${participante.nome}`,
                          },
                        }}
                        sx={statInputSx}
                      />
                      <IconButton
                        size="small"
                        disabled={!podeEscrever}
                        onClick={() =>
                          handleAjustarStat(participante, campoAtual, 1)
                        }
                        sx={{ color: 'var(--text-secondary)' }}
                        aria-label={`Aumentar ${stat.label} de ${participante.nome}`}
                      >
                        <AddIcon fontSize="inherit" />
                      </IconButton>
                      <Typography sx={{ color: 'var(--text-muted)', px: 0.25 }}>
                        /
                      </Typography>
                      <TextField
                        type="number"
                        size="small"
                        value={participante[campoMaximo] ?? 0}
                        disabled={!podeEscrever}
                        onChange={e =>
                          handleStatInputChange(
                            participante,
                            campoMaximo,
                            e.target.value,
                          )
                        }
                        onBlur={() =>
                          handleStatInputBlur(participante, campoMaximo)
                        }
                        slotProps={{
                          htmlInput: {
                            'aria-label': `${stat.label} máxima de ${participante.nome}`,
                          },
                        }}
                        sx={statInputSx}
                      />
                    </Box>
                  );
                })}
              </Box>

              {podeEscrever && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<ContentCopyOutlinedIcon fontSize="small" />}
                    onClick={() => handleDuplicar(participante)}
                    sx={{ color: 'var(--color-accent)' }}
                  >
                    Duplicar
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DeleteOutlineIcon fontSize="small" />}
                    onClick={() => handleRemover(participante)}
                    sx={{ color: '#ef4444' }}
                  >
                    Remover
                  </Button>
                </Box>
              )}
            </Paper>
          ))}
        </Box>
      )}

      <AdicionarParticipanteDialog
        open={dialogoAberto}
        onClose={() => setDialogoAberto(false)}
        personagens={personagens}
        onAdicionar={handleAdicionar}
      />
    </Box>
  );
};

export default Luta;
