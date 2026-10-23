import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './Notas.css';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import {
  getRmNotasPorCampanha,
  removeRmNota,
  getRmCenas,
  getRmTiposEntidadePorUniverso,
} from 'service/storage';
import useEntityCRUD from 'hooks/useEntityCRUD';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import { ROUTE_PATHS } from 'common/constants/routes';
import {
  getEntityTypeOptions,
  getNotaCapa,
  matchEntityType,
} from './notaUtils';

const parseTimestamp = valor => {
  if (!valor) return 0;
  if (valor instanceof Date) return valor.getTime();
  if (typeof valor.toDate === 'function') return valor.toDate().getTime();
  if (typeof valor.toMillis === 'function') return valor.toMillis();
  if (typeof valor === 'string') {
    const data = new Date(valor);
    return Number.isNaN(data.getTime()) ? 0 : data.getTime();
  }
  if (typeof valor === 'number') return valor;
  return 0;
};

const formatarAtualizacao = valor => {
  const timestamp = parseTimestamp(valor);
  if (!timestamp) return 'Sem atualização recente';
  const data = new Date(timestamp);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(data);
};

const normalizarTipo = valor => (typeof valor === 'string' ? valor.trim() : '');

const pluralizarTipo = valor => {
  const tipo = normalizarTipo(valor);
  if (!tipo) return 'Outros';

  const sinonimos = {
    Conceito: 'Conceitos',
    Criatura: 'Criaturas',
    Divindade: 'Divindades',
    Evento: 'Eventos',
    Item: 'Itens',
    Local: 'Locais',
    Organização: 'Organizações',
    Personagem: 'Personagens',
    Raça: 'Raças',
    Rota: 'Rotas',
    Outro: 'Outros',
  };

  return sinonimos[tipo] || `${tipo}s`;
};

const Notas = () => {
  const navigate = useNavigate();
  const { currentUser, isAdmin } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const getNotasDaCampanha = useCallback(() => {
    if (!campanhaAtiva) return Promise.resolve([]);
    return getRmNotasPorCampanha(
      campanhaAtiva.id,
      campanhaAtiva.universoId,
      campanhaAtiva.mestreId,
    );
  }, [campanhaAtiva]);

  const {
    items: notas,
    loading: loadingNotas,
    error: errorNotas,
    reload: reloadNotas,
    remove: handleRemoveNota,
  } = useEntityCRUD({ getAll: getNotasDaCampanha, remove: removeRmNota });

  const [cenas, setCenas] = useState([]);
  const [tiposDisponiveis, setTiposDisponiveis] = useState([]);
  const [notaVisualizada, setNotaVisualizada] = useState(null);
  const [pesquisa, setPesquisa] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [ordem, setOrdem] = useState('atualizacao');

  useEffect(() => {
    if (!campanhaAtiva) return;
    Promise.resolve().then(() =>
      getRmCenas(
        campanhaAtiva.id,
        campanhaAtiva.universoId,
        campanhaAtiva.mestreId,
      )
        .then(setCenas)
        .catch(() => {}),
    );
  }, [campanhaAtiva]);

  useEffect(() => {
    if (!campanhaAtiva?.universoId || !campanhaAtiva?.mestreId) return;

    let isMounted = true;
    Promise.resolve()
      .then(() =>
        getRmTiposEntidadePorUniverso(
          campanhaAtiva.universoId,
          campanhaAtiva.mestreId,
        ),
      )
      .then(itens => {
        if (isMounted) {
          setTiposDisponiveis(Array.isArray(itens) ? itens : []);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTiposDisponiveis([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [campanhaAtiva]);

  useEffect(() => {
    if (!loadingCampanhas && !campanhaAtiva) navigate(ROUTE_PATHS.CAMPANHA);
  }, [loadingCampanhas, campanhaAtiva, navigate]);

  const categorias = useMemo(() => {
    const tiposBase = getEntityTypeOptions(tiposDisponiveis, notas);

    const total = notas.length;
    const porTipo = tiposBase
      .map(tipo => ({
        value: tipo,
        label: pluralizarTipo(tipo),
        count: notas.filter(nota => {
          const tipoNota = normalizarTipo(nota.tipo);
          const tipoSelecionado = normalizarTipo(tipo);
          return tipoNota && tipoSelecionado && matchEntityType(tipoNota, tipoSelecionado);
        }).length,
      }))
      .filter(item => item.count > 0 || item.value === 'todos');

    return [{ value: 'todos', label: 'Todos', count: total }, ...porTipo];
  }, [notas, tiposDisponiveis]);

  const notasFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    const filtradas = notas.filter(nota => {
      const cenaVinculada = cenas.find(cena => cena.id === nota.cenaId);
      const textoBusca = [nota.titulo, nota.conteudo, cenaVinculada?.titulo]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (termo && !textoBusca.includes(termo)) return false;
      if (categoria !== 'todos' && !matchEntityType(nota.tipo ?? '', categoria)) {
        return false;
      }

      return true;
    });

    return [...filtradas].sort((a, b) => {
      if (ordem === 'alfabetica') {
        return (a.titulo || '').localeCompare(b.titulo || '', 'pt-BR');
      }

      const dataA = parseTimestamp(a.updatedAt ?? a.createdAt);
      const dataB = parseTimestamp(b.updatedAt ?? b.createdAt);
      return dataB - dataA;
    });
  }, [categoria, cenas, notas, ordem, pesquisa]);

  if (!campanhaAtiva && !loadingCampanhas) return null;

  const loading = loadingCampanhas || loadingNotas;
  const podeEscrever = campanhaAtiva
    ? isAdmin || campanhaAtiva.mestreId === currentUser.uid
    : false;

  const abrirNotaVisualizacao = nota => {
    navigate(ROUTE_PATHS.NOTA_DETALHES.replace(':notaId', nota.id));
  };
  const fecharNotaVisualizacao = () => setNotaVisualizada(null);

  return (
    <Box className="page-container universe-page">
      <Box className="universo-header">
        <Box className="universo-header__content">
          <span className="universo-kicker">Enciclopédia do mundo</span>
          <Typography component="h1" variant="h3" className="universo-title">
            Universo
          </Typography>
          <Typography variant="body1" className="universo-subtitle">
            Organize personagens, lugares, histórias e tudo que define seu
            universo.
          </Typography>
          <Box className="universo-meta">
            <span>{notas.length} entidades no compêndio</span>
            <span>{campanhaAtiva?.nome}</span>
          </Box>
        </Box>

        {podeEscrever && (
          <Button
            variant="contained"
            onClick={() => navigate(ROUTE_PATHS.NOVA_NOTA)}
            className="universo-primary-button"
            sx={{
              background: 'linear-gradient(135deg, #7f3db8 0%, #4f1d7c 100%)',
              color: '#f5f3ff',
              '&:hover': { background: 'linear-gradient(135deg, #8c4ad0 0%, #5a228b 100%)' },
            }}
          >
            Nova entidade
          </Button>
        )}
      </Box>

      <Box className="universo-toolbar">
        <TextField
          value={pesquisa}
          onChange={event => setPesquisa(event.target.value)}
          placeholder="Buscar por nome ou conteúdo"
          className="universo-search"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          aria-label="Buscar entidades"
        />

        <FormControl className="universo-select" size="small">
          <InputLabel id="universo-filter-label">Categoria</InputLabel>
          <Select
            labelId="universo-filter-label"
            value={categoria}
            label="Categoria"
            onChange={event => setCategoria(event.target.value)}
          >
            {categorias.map(item => (
              <MenuItem key={item.value} value={item.value}>
                {item.label} ({item.count})
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl className="universo-select" size="small">
          <InputLabel id="universo-order-label">Ordenar</InputLabel>
          <Select
            labelId="universo-order-label"
            value={ordem}
            label="Ordenar"
            onChange={event => setOrdem(event.target.value)}
          >
            <MenuItem value="atualizacao">Atualização</MenuItem>
            <MenuItem value="alfabetica">Alfabética</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box className="universo-filters">
        {categorias.map(item => (
          <button
            key={item.value}
            type="button"
            className={`universo-chip ${categoria === item.value ? 'is-active' : ''}`}
            onClick={() => setCategoria(item.value)}
          >
            {item.label}
            {' '}
            <span>{item.count}</span>
          </button>
        ))}
      </Box>

      {loading ? (
        <Box className="universo-loading">
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : errorNotas ? (
        <ListLoadError mensagem="Erro ao carregar o universo." onRetry={reloadNotas} />
      ) : notas.length === 0 ? (
        <Box className="empty-state universo-empty">
          <span className="empty-state-icon">🗂️</span>
          <p>Nenhuma nota cadastrada</p>
          <small>Registre ideias, improvisos e lembretes rápidos.</small>
          {podeEscrever && (
            <Button
              variant="contained"
              onClick={() => navigate(ROUTE_PATHS.NOVA_NOTA)}
              sx={{ mt: 2, background: 'linear-gradient(135deg, #7f3db8 0%, #4f1d7c 100%)' }}
            >
              Nova entidade
            </Button>
          )}
        </Box>
      ) : notasFiltradas.length === 0 ? (
        <Box className="empty-state universo-empty">
          <span className="empty-state-icon">✦</span>
          <p>Nenhuma entidade corresponde aos filtros atuais.</p>
          <small>
            Ajuste a busca ou remova os filtros para continuar a exploração.
          </small>
          <Button
            variant="outlined"
            onClick={() => {
              setPesquisa('');
              setCategoria('todos');
            }}
            sx={{
              mt: 2,
              color: 'var(--text-primary)',
              borderColor: 'var(--border-primary)',
            }}
          >
            Limpar filtros
          </Button>
        </Box>
      ) : (
        <Box className="universo-grid">
          {notasFiltradas.map(nota => {
            const cenaVinculada = cenas.find(cena => cena.id === nota.cenaId);
            const capa = getNotaCapa(nota) || getNotaCapa(cenaVinculada);
            const resumo = (nota.conteudo || '').replace(/\s+/g, ' ').trim();
            const categoriaLabel = nota.cenaId ? 'Cena vinculada' : 'Nota rápida';

            return (
              <Paper key={nota.id} elevation={0} className="universo-card">
                <Box className="universo-card__cover" sx={capa ? { backgroundImage: `linear-gradient(180deg, rgba(9,11,16,0.15), rgba(9,11,16,0.8)), url(${capa})` } : undefined}>
                  {!capa && (
                    <Box className="universo-card__placeholder">
                      <span>✦</span>
                      <Typography variant="caption">{categoriaLabel}</Typography>
                    </Box>
                  )}

                  <Box className="universo-card__actions">
                    <Tooltip title="Visualizar" arrow>
                      <IconButton
                        size="small"
                        onClick={() => abrirNotaVisualizacao(nota)}
                        className="universo-card__action"
                        aria-label={`Visualizar nota ${nota.titulo}`}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {podeEscrever && (
                      <Tooltip title="Editar" arrow>
                        <IconButton
                          size="small"
                          onClick={() => navigate(ROUTE_PATHS.NOTA_EDITAR.replace(':notaId', nota.id))}
                          className="universo-card__action universo-card__action--edit"
                          aria-label={`Editar nota ${nota.titulo}`}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {podeEscrever && (
                      <Tooltip title="Excluir" arrow>
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveNota(nota.id)}
                          className="universo-card__action universo-card__action--delete"
                          aria-label={`Remover nota ${nota.titulo}`}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <Box className="universo-card__meta-overlay">
                    <Typography variant="caption" className="universo-card__eyebrow">
                      <span className="universo-card__eyebrow-dot" />
                      {nota.tipo || (cenaVinculada ? 'Cena' : 'Entidade')}
                    </Typography>
                    <Typography variant="h6" className="universo-card__title">
                      {nota.titulo}
                    </Typography>
                  </Box>

                  <Box className="universo-card__badge">
                    {cenaVinculada ? `Cena: ${cenaVinculada.titulo}` : categoriaLabel}
                  </Box>
                </Box>

                <Box className="universo-card__content">
                  <Typography variant="body2" className="universo-card__summary">
                    {resumo || 'Nenhum resumo disponível para esta entidade.'}
                  </Typography>

                  <Box className="universo-card__meta">
                    <span>{formatarAtualizacao(nota.updatedAt ?? nota.createdAt)}</span>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      <Dialog
        open={Boolean(notaVisualizada)}
        onClose={fecharNotaVisualizacao}
        fullWidth
        maxWidth="md"
        slotProps={{
          backdrop: {
            sx: { backgroundColor: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)' },
          },
          paper: {
            sx: {
              bgcolor: 'rgba(8,10,16,0.98)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 42px 120px rgba(0,0,0,0.55)',
              borderRadius: 4,
              mx: { xs: 1, sm: 2 },
            },
          },
        }}
        className="nota-dialog"
      >
        <DialogTitle component="div" className="nota-dialog-title">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ color: 'var(--text-primary)', fontWeight: 800, mb: 0.5 }}>
                {notaVisualizada?.titulo}
              </Typography>
              <Typography variant="caption" sx={{ color: 'var(--text-secondary)', display: 'block', mt: 0.5 }}>
                {notaVisualizada?.cenaId
                  ? `Cena vinculada: ${cenas.find(cena => cena.id === notaVisualizada.cenaId)?.titulo ?? 'Desconhecida'}`
                  : 'Nota rápida'}
              </Typography>
            </Box>
            <IconButton
              onClick={fecharNotaVisualizacao}
              sx={{
                color: 'var(--text-secondary)',
                bgcolor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.08)' },
              }}
              aria-label="Fechar visualização da entidade"
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent className="nota-dialog-content">
          <Box className="nota-dialog-panel">
            <Typography variant="body2" className="nota-dialog-body">
              {notaVisualizada?.conteudo || 'Sem conteúdo para exibir.'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ background: 'rgba(15,17,25,0.98)', px: 3, py: 2 }}>
          <Button
            onClick={fecharNotaVisualizacao}
            sx={{
              color: 'var(--text-primary)',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              '&:hover': { background: 'rgba(255,255,255,0.08)' },
            }}
          >
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Notas;
