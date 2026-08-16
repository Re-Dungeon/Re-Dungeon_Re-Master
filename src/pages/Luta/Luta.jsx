import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Chip from '@mui/material/Chip';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import { useSnackbar } from 'context/SnackbarContext';
import {
  getPersonagens,
  getCondicoes,
  getRmCampanhaLutaParticipantes,
  addRmCampanhaLutaParticipante,
  removeRmCampanhaLutaParticipante,
  updateRmCampanhaLutaParticipante,
} from 'service/storage';
import useAsyncEffect from 'hooks/useAsyncEffect';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import PersonagemFichaDialog from 'components/PersonagemFichaDialog/PersonagemFichaDialog';
import { ROUTE_PATHS } from 'common/constants/routes';
import { getTipoPersonagem } from 'common/utils/personagemTipo';
import {
  TIPO_EVENTO_SESSAO,
  registrarEventoSessao,
} from 'common/utils/sessaoLog';
import { ehNpcDaCampanha } from 'pages/Npcs/npcUtils';
import { ehCriaturaDaCampanha } from 'pages/Criaturas/criaturaUtils';
import AdicionarParticipanteDialog from './AdicionarParticipanteDialog';
import {
  STATS_LUTA,
  extrairStatusBase,
  proximoNomeDuplicado,
} from './lutaUtils';

const cardSx = {
  p: 1.25,
  background: 'rgba(12, 15, 23, 0.86)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(239, 68, 68, 0.18)',
  borderRadius: 3,
  boxShadow: '0 20px 50px rgba(0, 0, 0, 0.22)',
  maxWidth: 340,
  width: '100%',
  transition: 'transform 200ms ease, box-shadow 200ms ease, border-color 200ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    boxShadow: '0 24px 68px rgba(0, 0, 0, 0.28)',
  },
};

const statInputSx = {
  width: 70,
  '& input': {
    textAlign: 'center',
    padding: '8px 6px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(255,255,255,0.08)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(239,68,68,0.24)',
  },
};

const statButtonSx = {
  minWidth: 40,
  width: 40,
  height: 40,
  borderRadius: 1,
  border: '1px solid rgba(255,255,255,0.08)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text-primary)',
  boxShadow: '0 6px 14px rgba(0, 0, 0, 0.12)',
  transition: 'all 200ms ease',
  '&:hover': {
    background: 'rgba(239, 68, 68, 0.14)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
};

const progressTrackSx = {
  height: 10,
  borderRadius: 2,
  background: 'rgba(255,255,255,0.08)',
  overflow: 'hidden',
};

const progressFillBase = {
  height: '100%',
  transition: 'width 250ms ease',
};

const badgeColors = {
  NPC: 'rgba(239, 68, 68, 0.12)',
  Jogador: 'rgba(34, 197, 94, 0.16)',
  Invocação: 'rgba(59, 130, 246, 0.16)',
  Companheiro: 'rgba(168, 85, 247, 0.16)',
};

const badgeTextColors = {
  NPC: '#fda4af',
  Jogador: '#86efac',
  Invocação: '#93c5fd',
  Companheiro: '#c4b5fd',
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
  const { notifyError } = useSnackbar();

  const [personagens, setPersonagens] = useState([]);
  const [participantes, setParticipantes] = useState([]);
  const [condicoesDisponiveis, setCondicoesDisponiveis] = useState([]);
  const [loadingDados, setLoadingDados] = useState(true);
  const [error, setError] = useState(null);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [personagemVisualizado, setPersonagemVisualizado] = useState(null);
  const [menuAncorado, setMenuAncorado] = useState(null);
  const [menuAlvo, setMenuAlvo] = useState(null);

  const carregarDados = useCallback(async () => {
    if (!campanhaAtiva) {
      setPersonagens([]);
      setParticipantes([]);
      setCondicoesDisponiveis([]);
      setLoadingDados(false);
      return;
    }
    setLoadingDados(true);
    setError(null);
    try {
      const [todosPersonagens, participantesDaLuta, todasCondicoes] =
        await Promise.all([
          getPersonagens(),
          getRmCampanhaLutaParticipantes(
            campanhaAtiva.id,
            campanhaAtiva.universoId,
            campanhaAtiva.mestreId,
          ),
          getCondicoes(campanhaAtiva.universoId),
        ]);
      setPersonagens(
        todosPersonagens.filter(
          p =>
            ehNpcDaCampanha(p, campanhaAtiva) ||
            ehCriaturaDaCampanha(p, campanhaAtiva),
        ),
      );
      setParticipantes(participantesDaLuta);
      setCondicoesDisponiveis(todasCondicoes);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingDados(false);
    }
  }, [campanhaAtiva]);

  useAsyncEffect(carregarDados, [carregarDados]);

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  if (!campanhaAtiva && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingDados;
  const podeEscrever = campanhaAtiva
    ? canWrite(campanhaAtiva.universoId)
    : false;

  // A ficha completa (habilidades, atributos etc.) não é copiada para o
  // participante — só os status de combate. Para "Ver ficha" resolve de volta
  // para o personagem de origem em `personagens` (mesma lista usada por
  // NPCs/Criaturas); se ele foi desvinculado da campanha depois de entrar na
  // luta, o botão fica desabilitado.
  const personagemDe = origemPersonagemId =>
    personagens.find(p => p.id === origemPersonagemId) ?? null;

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
    try {
      await Promise.all(
        novos.map(participante =>
          addRmCampanhaLutaParticipante(campanhaAtiva.id, participante),
        ),
      );
      await carregarDados();
      registrarEventoSessao(
        campanhaAtiva,
        TIPO_EVENTO_SESSAO.PARTICIPANTE_LUTA,
        quantidade > 1
          ? `${quantidade}x "${personagem.nome}" entrou na Luta`
          : `"${personagem.nome}" entrou na Luta`,
      );
    } catch {
      notifyError('Não foi possível adicionar o participante à luta.');
    }
  };

  const handleDuplicar = async participante => {
    try {
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
    } catch {
      notifyError('Não foi possível duplicar o participante.');
    }
  };

  const handleRemover = async participante => {
    try {
      await removeRmCampanhaLutaParticipante(campanhaAtiva.id, participante.id);
      setParticipantes(prev => prev.filter(p => p.id !== participante.id));
    } catch {
      notifyError('Não foi possível remover o participante.');
    }
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
    const valorAnterior = participante[campo];
    const numero = Math.max(0, Number(valor) || 0);
    setParticipantes(prev =>
      prev.map(p => (p.id === participante.id ? { ...p, [campo]: numero } : p)),
    );
    try {
      await updateRmCampanhaLutaParticipante(
        campanhaAtiva.id,
        participante.id,
        {
          [campo]: numero,
        },
      );
    } catch {
      // Reverte o valor otimista — sem isso a tela ficaria mostrando um
      // número que nunca foi salvo no Firestore, sem nenhum aviso ao mestre.
      setParticipantes(prev =>
        prev.map(p =>
          p.id === participante.id ? { ...p, [campo]: valorAnterior } : p,
        ),
      );
      notifyError('Não foi possível salvar o status do participante.');
    }
  };

  const handleStatInputBlur = (participante, campo) => {
    commitStat(participante, campo, participante[campo]);
  };

  const handleAjustarStat = (participante, campo, delta) => {
    commitStat(participante, campo, (Number(participante[campo]) || 0) + delta);
  };

  const handleMenuOpen = (event, participante) => {
    setMenuAncorado(event.currentTarget);
    setMenuAlvo(participante);
  };

  const handleMenuClose = () => {
    setMenuAncorado(null);
    setMenuAlvo(null);
  };

  const handleMenuVerFicha = () => {
    if (menuAlvo) {
      setPersonagemVisualizado(
        personagemDe(menuAlvo.origemPersonagemId),
      );
    }
    handleMenuClose();
  };

  const handleMenuDuplicar = () => {
    if (menuAlvo) {
      handleDuplicar(menuAlvo);
    }
    handleMenuClose();
  };

  const handleMenuRemover = () => {
    if (menuAlvo) {
      handleRemover(menuAlvo);
    }
    handleMenuClose();
  };

  // Atalho de teclado para o campo "atual" de cada stat: "+"/"-" ajustam em
  // 1 sem precisar mirar no botão — Tab entre os cards já funciona de graça
  // (ordem natural do DOM entre os campos/botões focáveis), então só esse
  // atalho precisa de código próprio. preventDefault evita digitar o
  // caractere "+"/"-" dentro do campo numérico.
  const handleStatKeyDown = (participante, campo, event) => {
    if (event.key === '+') {
      event.preventDefault();
      handleAjustarStat(participante, campo, 1);
    } else if (event.key === '-') {
      event.preventDefault();
      handleAjustarStat(participante, campo, -1);
    }
  };

  // Condições aplicadas ficam denormalizadas ({id, nome}) no próprio
  // participante — evita reconsultar `condicoesDisponiveis` (que pode mudar
  // no Re-Dungeon) só para exibir o rótulo de uma condição já aplicada.
  const commitCondicoes = async (participante, condicoes) => {
    const condicoesAnteriores = participante.condicoes ?? [];
    setParticipantes(prev =>
      prev.map(p => (p.id === participante.id ? { ...p, condicoes } : p)),
    );
    try {
      await updateRmCampanhaLutaParticipante(
        campanhaAtiva.id,
        participante.id,
        {
          condicoes,
        },
      );
    } catch {
      setParticipantes(prev =>
        prev.map(p =>
          p.id === participante.id
            ? { ...p, condicoes: condicoesAnteriores }
            : p,
        ),
      );
      notifyError('Não foi possível salvar as condições do participante.');
    }
  };

  const handleAdicionarCondicao = (participante, condicaoId) => {
    if (!condicaoId) return;
    const condicao = condicoesDisponiveis.find(c => c.id === condicaoId);
    if (!condicao) return;
    const atuais = participante.condicoes ?? [];
    if (atuais.some(c => c.id === condicaoId)) return;
    commitCondicoes(participante, [
      ...atuais,
      { id: condicao.id, nome: condicao.nome },
    ]);
  };

  const handleRemoverCondicao = (participante, condicaoId) => {
    commitCondicoes(
      participante,
      (participante.condicoes ?? []).filter(c => c.id !== condicaoId),
    );
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
              '&:hover': { background: 'var(--color-primary-dark)' },
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
              sm: 'repeat(auto-fit, minmax(280px, 1fr))',
            },
            gap: 1.5,
          }}
        >
          {participantes.map(participante => (
            <Paper
              key={participante.id}
              elevation={0}
              sx={cardSx}
              role="group"
              aria-label={`Participante ${participante.nome}`}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: 0 }}>
                  {participante.linkImagem ? (
                    <Box
                      component="img"
                      src={participante.linkImagem}
                      alt={participante.nome}
                      loading="lazy"
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 2,
                        objectFit: 'cover',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
                        flexShrink: 0,
                      }}
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        borderRadius: 2,
                        background: 'rgba(255,255,255,0.04)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        flexShrink: 0,
                      }}
                    >
                      ?
                    </Box>
                  )}
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'var(--text-primary)',
                        fontWeight: 700,
                        fontSize: 18,
                        lineHeight: 1.15,
                        mb: 0.5,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {participante.nome}
                    </Typography>
                    <Chip
                      label={participante.origemTipo}
                      size="small"
                      sx={{
                        px: 1.25,
                        py: 0.5,
                        borderRadius: 1.5,
                        fontSize: 12,
                        fontWeight: 700,
                        background:
                          badgeColors[participante.origemTipo] ||
                          'rgba(255,255,255,0.06)',
                        color:
                          badgeTextColors[participante.origemTipo] ||
                          'var(--text-secondary)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <IconButton
                    size="small"
                    onClick={e => handleMenuOpen(e, participante)}
                    sx={{
                      color: 'var(--text-secondary)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.04)',
                      '&:hover': {
                        background: 'rgba(239,68,68,0.14)',
                        color: '#fff',
                      },
                    }}
                    aria-label={`Ações de ${participante.nome}`}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 1.25 }}>
                {STATS_LUTA.map(stat => {
                  const campoAtual = `${stat.chave}Atual`;
                  const campoMaximo = `${stat.chave}Maxima`;
                  const atual = Number(participante[campoAtual] ?? 0);
                  const maximo = Number(participante[campoMaximo] ?? 0);
                  const porcentagem = maximo > 0 ? Math.min(100, Math.max(0, (atual / maximo) * 100)) : 0;
                  return (
                    <Box key={stat.chave}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mb: 1,
                          gap: 1,
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            color: stat.cor,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                          }}
                        >
                          {stat.label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'var(--text-primary)',
                            fontWeight: 700,
                          }}
                        >
                          {atual} /{' '}
                          <Typography
                            component="span"
                            sx={{ color: 'var(--text-muted)', fontWeight: 500 }}
                          >
                            {maximo}
                          </Typography>
                        </Typography>
                      </Box>
                      <Box sx={progressTrackSx}>
                        <Box
                          sx={{
                            ...progressFillBase,
                            width: `${porcentagem}%`,
                            background: stat.cor,
                          }}
                        />
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mt: 0.5,
                          gap: 0.5,
                        }}
                      >
                        <IconButton
                          size="small"
                          disabled={!podeEscrever}
                          onClick={() =>
                            handleAjustarStat(participante, campoAtual, -1)
                          }
                          sx={statButtonSx}
                          aria-label={`Diminuir ${stat.label} de ${participante.nome}`}
                        >
                          <RemoveIcon fontSize="small" />
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
                          onKeyDown={e =>
                            handleStatKeyDown(participante, campoAtual, e)
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
                          sx={statButtonSx}
                          aria-label={`Aumentar ${stat.label} de ${participante.nome}`}
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  );
                })}
              </Box>

              <Box sx={{ mb: 1.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: 'var(--text-secondary)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: 0.8,
                    mb: 1,
                  }}
                >
                  Condições
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    mb: 1,
                  }}
                >
                  {(participante.condicoes ?? []).map(condicao => (
                    <Chip
                      key={condicao.id}
                      label={condicao.nome}
                      size="small"
                      onDelete={
                        podeEscrever
                          ? () => handleRemoverCondicao(participante, condicao.id)
                          : undefined
                      }
                      sx={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#fce7f3',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        fontWeight: 700,
                      }}
                    />
                  ))}
                </Box>
                {podeEscrever && condicoesDisponiveis.length > 0 && (
                  <Select
                    size="small"
                    displayEmpty
                    value=""
                    onChange={e =>
                      handleAdicionarCondicao(participante, e.target.value)
                    }
                    renderValue={() => '+ Adicionar Condição'}
                    sx={{
                      minWidth: 160,
                      color: 'var(--text-primary)',
                      background: 'rgba(255,255,255,0.04)',
                      borderRadius: 1.5,
                      border: '1px solid rgba(255,255,255,0.08)',
                      '& .MuiSelect-select': { py: 1 },
                    }}
                    slotProps={{
                      input: {
                        'aria-label': `Adicionar condição a ${participante.nome}`,
                      },
                    }}
                  >
                    {condicoesDisponiveis
                      .filter(
                        c =>
                          !(participante.condicoes ?? []).some(
                            aplicada => aplicada.id === c.id,
                          ),
                      )
                      .map(condicao => (
                        <MenuItem key={condicao.id} value={condicao.id}>
                          {condicao.nome}
                        </MenuItem>
                      ))}
                  </Select>
                )}
              </Box>

              <Box
                sx={{
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  pt: 1.25,
                  display: 'flex',
                  gap: 0.75,
                  flexWrap: 'wrap',
                }}
              >
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                  disabled={!personagemDe(participante.origemPersonagemId)}
                  onClick={() =>
                    setPersonagemVisualizado(
                      personagemDe(participante.origemPersonagemId),
                    )
                  }
                  sx={{
                    color: 'var(--text-primary)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    '&:hover': {
                      borderColor: 'rgba(239,68,68,0.32)',
                      background: 'rgba(239,68,68,0.08)',
                    },
                  }}
                >
                  Ver ficha
                </Button>
                {podeEscrever && (
                  <>
                    <Button
                      fullWidth
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopyOutlinedIcon fontSize="small" />}
                      onClick={() => handleDuplicar(participante)}
                      sx={{
                        color: 'var(--text-accent)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        '&:hover': {
                          borderColor: 'rgba(59, 130, 246, 0.32)',
                          background: 'rgba(59, 130, 246, 0.08)',
                        },
                      }}
                    >
                      Duplicar
                    </Button>
                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      startIcon={<DeleteOutlineIcon fontSize="small" />}
                      onClick={() => handleRemover(participante)}
                      sx={{
                        background: '#991b1b',
                        color: '#fff',
                        '&:hover': { background: '#dc2626' },
                      }}
                    >
                      Remover
                    </Button>
                  </>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Menu
        anchorEl={menuAncorado}
        open={Boolean(menuAncorado)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              background: 'rgba(18, 22, 32, 0.95)',
              color: 'var(--text-primary)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 18px 40px rgba(0,0,0,0.25)',
            },
          },
        }}
      >
        <MenuItem
          onClick={handleMenuVerFicha}
          disabled={!menuAlvo || !personagemDe(menuAlvo.origemPersonagemId)}
        >
          Ver ficha
        </MenuItem>
        <MenuItem onClick={handleMenuDuplicar} disabled={!menuAlvo}>
          Duplicar
        </MenuItem>
        <MenuItem onClick={handleMenuRemover} disabled={!menuAlvo}>
          Remover
        </MenuItem>
      </Menu>

      <AdicionarParticipanteDialog
        open={dialogoAberto}
        onClose={() => setDialogoAberto(false)}
        personagens={personagens}
        onAdicionar={handleAdicionar}
      />

      <PersonagemFichaDialog
        open={Boolean(personagemVisualizado)}
        onClose={() => setPersonagemVisualizado(null)}
        personagem={personagemVisualizado}
      />
    </Box>
  );
};

export default Luta;
