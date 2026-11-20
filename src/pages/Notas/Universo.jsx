import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Paper from '@mui/material/Paper';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import ListOutlinedIcon from '@mui/icons-material/ListOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { ROUTE_PATHS } from 'common/constants/routes';
import useUniversos from 'hooks/useUniversos';
import { useCampanha } from 'context/CampanhaContext';
import { useAuth } from 'context/AuthContext';
import {
  getRmNotasPorCampanha,
  getRmTiposEntidadePorUniverso,
} from 'service/storage';
import { normalizarNotaEntidade, normalizeEntityTypeValue } from './notaUtils';

const Notas = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { campanhaAtiva } = useCampanha();
  const { universos, loadingUniversos } = useUniversos();
  const [entidades, setEntidades] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [pesquisa, setPesquisa] = useState('');
  const [tipoAtivo, setTipoAtivo] = useState('Todos');
  const [modoVisualizacao, setModoVisualizacao] = useState('grid');

  const universoAtivo = useMemo(() => {
    if (!campanhaAtiva?.universoId) return null;
    return (
      universos.find(universo => universo.id === campanhaAtiva.universoId) ??
      null
    );
  }, [campanhaAtiva, universos]);

  useEffect(() => {
    let ativo = true;

    const carregarDadosAntigos = async () => {
      const mestreId = currentUser?.uid;
      const universoId = campanhaAtiva?.universoId;
      const campanhaId = campanhaAtiva?.id;

      if (!mestreId || !universoId || !campanhaId) {
        if (ativo) {
          setEntidades([]);
          setTipos([]);
          setErro(null);
          setCarregando(false);
        }
        return;
      }

      setCarregando(true);
      setErro(null);

      try {
        const [notas, tiposSalvos] = await Promise.all([
          getRmNotasPorCampanha(campanhaId, universoId, mestreId),
          getRmTiposEntidadePorUniverso(universoId, mestreId),
        ]);

        if (!ativo) return;
        setEntidades(
          (Array.isArray(notas) ? notas : [])
            .map(normalizarEntidade)
            .filter(Boolean),
        );
        setTipos(Array.isArray(tiposSalvos) ? tiposSalvos : []);
      } catch (erroCarregamento) {
        if (!ativo) return;
        setEntidades([]);
        setTipos([]);
        setErro(erroCarregamento);
      } finally {
        if (ativo) setCarregando(false);
      }
    };

    carregarDadosAntigos();
    return () => {
      ativo = false;
    };
  }, [campanhaAtiva?.id, campanhaAtiva?.universoId, currentUser?.uid]);

  const tiposDisponiveis = useMemo(() => {
    const nomes = new Set();
    tipos.forEach(tipo => {
      const nome = normalizeEntityTypeValue(
        tipo?.name ?? tipo?.nome ?? tipo?.Nome,
      );
      if (nome) nomes.add(nome);
    });
    entidades.forEach(entidade => nomes.add(entidade.tipo));
    return ['Todos', ...[...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [entidades, tipos]);

  const entidadesFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    return entidades
      .filter(entidade => tipoAtivo === 'Todos' || entidade.tipo === tipoAtivo)
      .filter(entidade => {
        if (!termo) return true;
        const texto =
          `${entidade.nome} ${entidade.resumo} ${entidade.tipo} ${entidade.tags.join(' ')}`.toLowerCase();
        return texto.includes(termo);
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [entidades, pesquisa, tipoAtivo]);

  const nomeUniverso =
    primeiroValorUniverso(universoAtivo, [
      'Nome',
      'nome',
      'titulo',
      'Titulo',
    ]) ||
    primeiroValorUniverso(campanhaAtiva, ['universoNome', 'nomeUniverso']) ||
    'Universo';

  const descricaoUniverso = primeiroValorUniverso(universoAtivo, [
    'descricao',
    'descrição',
    'resumo',
    'apresentacao',
    'apresentação',
  ]);

  const imagemUniverso = primeiroValorUniverso(universoAtivo, [
    'capa',
    'imagemCapa',
    'imagemUrl',
    'linkImagem',
    'foto',
  ]);

  const monograma = monogramaUniverso(nomeUniverso);

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}
    >
      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          isolation: 'isolate',
          minHeight: { xs: 150, md: 168 },
          overflow: 'hidden',
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.075)',
          background:
            'radial-gradient(circle at 50% 30%, rgba(177,53,53,0.09), transparent 38%), linear-gradient(180deg, rgba(18,22,31,0.98), rgba(10,13,19,0.96))',
          boxShadow: '0 18px 36px rgba(0,0,0,0.16)',
        }}
      >
        {imagemUniverso && (
          <Box
            component="img"
            src={imagemUniverso}
            alt=""
            sx={{
              position: 'absolute',
              inset: 0,
              zIndex: -2,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center 42%',
              opacity: 0.16,
            }}
          />
        )}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: -1,
            background:
              'linear-gradient(90deg, rgba(8,10,15,0.94), rgba(8,10,15,0.42) 50%, rgba(8,10,15,0.94)), linear-gradient(180deg, rgba(8,10,15,0.08), rgba(8,10,15,0.72))',
          }}
        />

        <Box
          sx={{
            minHeight: { xs: 150, md: 168 },
            display: 'grid',
            gridTemplateColumns: {
              xs: '56px minmax(0,1fr)',
              md: '64px minmax(0,1fr) 150px',
            },
            alignItems: 'center',
            gap: { xs: 1.25, md: 2 },
            px: { xs: 2, md: 3 },
            py: 2,
          }}
        >
          <Box
            sx={{
              width: { xs: 56, md: 64 },
              height: { xs: 56, md: 64 },
              borderRadius: '16px',
              display: 'grid',
              placeItems: 'center',
              border: '1px solid rgba(239,187,187,0.28)',
              background:
                'linear-gradient(145deg, rgba(177,53,53,0.30), rgba(255,255,255,0.035) 58%, rgba(177,53,53,0.12))',
              boxShadow:
                'inset 0 1px rgba(255,255,255,0.06), 0 12px 26px rgba(0,0,0,0.26)',
              color: '#f3d1d1',
              fontFamily: 'Georgia, serif',
              fontSize: { xs: '1rem', md: '1.12rem' },
              fontWeight: 800,
              letterSpacing: '0.10em',
            }}
          >
            {monograma}
          </Box>

          <Box sx={{ minWidth: 0, maxWidth: 780 }}>
            <Typography
              component="h1"
              sx={{
                color: 'var(--text-primary)',
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.35rem' },
                lineHeight: 1.05,
                fontWeight: 650,
                letterSpacing: '-0.035em',
                overflowWrap: 'anywhere',
                textShadow: '0 3px 18px rgba(0,0,0,0.48)',
              }}
            >
              {nomeUniverso}
            </Typography>

            {descricaoUniverso && (
              <Typography
                variant="body2"
                sx={{
                  maxWidth: 680,
                  mt: 0.9,
                  color: 'rgba(229,232,238,0.68)',
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {descricaoUniverso}
              </Typography>
            )}
          </Box>

          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              justifySelf: 'end',
              alignItems: 'stretch',
              gap: 1,
              borderLeft: '1px solid rgba(255,255,255,0.07)',
              pl: 2,
            }}
          >
            <Box sx={{ minWidth: 64, textAlign: 'right' }}>
              <Typography
                sx={{
                  color: 'var(--text-primary)',
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  lineHeight: 1,
                }}
              >
                {entidades.length}
              </Typography>
              <Typography
                variant="caption"
                sx={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}
              >
                entidades
              </Typography>
            </Box>
            {tiposDisponiveis.length > 1 && (
              <Box sx={{ minWidth: 64, textAlign: 'right' }}>
                <Typography
                  sx={{
                    color: 'var(--text-primary)',
                    fontSize: '1.2rem',
                    fontWeight: 800,
                    lineHeight: 1,
                  }}
                >
                  {tiposDisponiveis.length - 1}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}
                >
                  categorias
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(17,20,27,0.82)',
          p: 1.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <OutlinedInput
            value={pesquisa}
            onChange={event => setPesquisa(event.target.value)}
            size="small"
            placeholder="Pesquisar entidade"
            startAdornment={
              <InputAdornment position="start">
                <SearchOutlinedIcon
                  fontSize="small"
                  sx={{ color: 'var(--text-secondary)' }}
                />
              </InputAdornment>
            }
            sx={{
              flex: '1 1 280px',
              minWidth: 220,
              height: 40,
              borderRadius: '10px',
              background: 'rgba(255,255,255,0.02)',
              color: 'var(--text-primary)',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.14)' },
              '&.Mui-focused fieldset': { borderColor: 'rgba(177,53,53,0.68)' },
            }}
          />

          <Button
            variant="contained"
            startIcon={<AddOutlinedIcon />}
            onClick={() => navigate(ROUTE_PATHS.UNIVERSO_NOVA_ENTIDADE)}
            sx={{
              height: 38,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #b84444 0%, #8f2f35 100%)',
              color: '#fff',
              textTransform: 'none',
              fontWeight: 750,
              letterSpacing: '-0.01em',
              px: 1.75,
              whiteSpace: 'nowrap',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow:
                '0 8px 18px rgba(177,53,53,0.22), inset 0 1px rgba(255,255,255,0.12)',
              '&:hover': {
                background: 'linear-gradient(135deg, #c74b4b 0%, #9a3439 100%)',
                boxShadow:
                  '0 10px 22px rgba(177,53,53,0.28), inset 0 1px rgba(255,255,255,0.14)',
              },
            }}
          >
            Nova entidade
          </Button>

          <Box sx={{ ml: 'auto', display: 'flex', gap: 0.75 }}>
            <IconButton
              size="small"
              aria-label="Visualização em cards"
              onClick={() => setModoVisualizacao('grid')}
              sx={{
                border: '1px solid rgba(255,255,255,0.08)',
                background:
                  modoVisualizacao === 'grid'
                    ? 'rgba(177,53,53,0.14)'
                    : 'rgba(255,255,255,0.02)',
                color:
                  modoVisualizacao === 'grid'
                    ? '#ffb0b0'
                    : 'var(--text-secondary)',
              }}
            >
              <GridViewOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label="Visualização em lista"
              onClick={() => setModoVisualizacao('list')}
              sx={{
                border: '1px solid rgba(255,255,255,0.08)',
                background:
                  modoVisualizacao === 'list'
                    ? 'rgba(177,53,53,0.14)'
                    : 'rgba(255,255,255,0.02)',
                color:
                  modoVisualizacao === 'list'
                    ? '#ffb0b0'
                    : 'var(--text-secondary)',
              }}
            >
              <ListOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {tiposDisponiveis.length > 1 && (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {tiposDisponiveis.map(tipo => (
            <Chip
              key={tipo}
              label={tipo}
              onClick={() => setTipoAtivo(tipo)}
              variant={tipoAtivo === tipo ? 'filled' : 'outlined'}
              sx={{
                borderRadius: '999px',
                background:
                  tipoAtivo === tipo
                    ? 'rgba(177,53,53,0.16)'
                    : 'rgba(255,255,255,0.01)',
                color: tipoAtivo === tipo ? '#f4dada' : 'var(--text-secondary)',
                borderColor: 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </Box>
      )}

      {loadingUniversos || carregando ? (
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 180 }}>
          <CircularProgress size={28} />
        </Box>
      ) : erro ? (
        <Typography
          variant="body2"
          sx={{ color: 'var(--text-secondary)', px: 1 }}
        >
          Não foi possível carregar as entidades antigas deste universo.
        </Typography>
      ) : entidadesFiltradas.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            borderRadius: 3,
            border: '1px solid rgba(255,255,255,0.06)',
            p: 3,
            background: 'rgba(15,18,24,0.78)',
          }}
        >
          <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
            Nenhuma entidade encontrada.
          </Typography>
        </Paper>
      ) : modoVisualizacao === 'grid' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: 2,
            alignItems: 'stretch',
            '@media (max-width: 1599px)': {
              gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))',
            },
            '@media (max-width: 1200px)': {
              gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
            },
            '@media (max-width: 980px)': {
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
            },
            '@media (max-width: 760px)': {
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            },
            '@media (max-width: 600px)': {
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            },
            '@media (max-width: 380px)': {
              gridTemplateColumns: '1fr',
            },
          }}
        >
          {entidadesFiltradas.map(entidade => (
            <Paper
              key={entidade.id}
              elevation={0}
              sx={{
                position: 'relative',
                aspectRatio: '3 / 4',
                overflow: 'hidden',
                borderRadius: '14px',
                border: '1px solid rgba(255,255,255,0.11)',
                background: '#111827',
                boxShadow: '0 14px 28px rgba(0,0,0,0.28)',
                cursor: 'pointer',
                transition:
                  'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  borderColor: 'rgba(235,181,181,0.38)',
                  boxShadow: '0 18px 34px rgba(0,0,0,0.38)',
                },
              }}
              role="button"
              tabIndex={0}
              aria-label={`Abrir entidade ${entidade.nome}`}
              onDoubleClick={() => navigate(`/universo/${entidade.id}`)}
              onClick={() => {
                if (window.matchMedia('(pointer: coarse)').matches) {
                  navigate(`/universo/${entidade.id}`);
                }
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/universo/${entidade.id}`);
                }
              }}
            >
              {entidade.imagem ? (
                <Box
                  component="img"
                  src={entidade.imagem}
                  alt={entidade.nome}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center',
                    display: 'block',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    background:
                      'linear-gradient(135deg, rgba(177,53,53,0.28), rgba(23,29,43,0.96))',
                  }}
                />
              )}

              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(4,7,12,0.02) 30%, rgba(4,7,12,0.18) 55%, rgba(4,7,12,0.88) 100%)',
                  pointerEvents: 'none',
                }}
              />

              <Box
                sx={{
                  position: 'absolute',
                  left: 12,
                  right: 12,
                  bottom: 12,
                  zIndex: 1,
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    mb: 0.55,
                  }}
                >
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      flexShrink: 0,
                      bgcolor: '#efaaa2',
                      boxShadow: '0 0 10px rgba(239,170,162,0.72)',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#efbcbc',
                      fontWeight: 750,
                      lineHeight: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {entidade.tipo}
                  </Typography>
                </Box>

                <Typography
                  variant="subtitle1"
                  sx={{
                    color: '#fff',
                    fontWeight: 800,
                    lineHeight: 1.16,
                    letterSpacing: '-0.025em',
                    textShadow: '0 2px 12px rgba(0,0,0,0.72)',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {entidade.nome}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {entidadesFiltradas.map(entidade => (
            <Paper
              key={entidade.id}
              elevation={0}
              role="button"
              tabIndex={0}
              aria-label={`Abrir entidade ${entidade.nome}`}
              onDoubleClick={() => navigate(`/universo/${entidade.id}`)}
              onClick={() => {
                if (window.matchMedia('(pointer: coarse)').matches) {
                  navigate(`/universo/${entidade.id}`);
                }
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  navigate(`/universo/${entidade.id}`);
                }
              }}
              sx={{
                p: 1.25,
                borderRadius: 2.5,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(15,18,24,0.9)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
              }}
            >
              {entidade.imagem ? (
                <Box
                  component="img"
                  src={entidade.imagem}
                  alt=""
                  sx={{
                    width: 54,
                    height: 54,
                    flexShrink: 0,
                    borderRadius: '10px',
                    objectFit: 'cover',
                    border: '1px solid rgba(255,255,255,0.10)',
                    background: '#111827',
                  }}
                />
              ) : (
                <Box
                  sx={{
                    width: 54,
                    height: 54,
                    flexShrink: 0,
                    borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background:
                      'linear-gradient(135deg, rgba(177,53,53,0.28), rgba(23,29,43,0.96))',
                  }}
                />
              )}
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  sx={{ color: '#e4b7b7', fontWeight: 700 }}
                >
                  {entidade.tipo}
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{ color: 'var(--text-primary)', fontWeight: 700 }}
                >
                  {entidade.nome}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

const primeiroValorUniverso = (objeto, campos) => {
  for (const campo of campos) {
    if (typeof objeto?.[campo] === 'string' && objeto[campo].trim()) {
      return objeto[campo].trim();
    }
  }
  return '';
};

const monogramaUniverso = nome => {
  const palavras = String(nome ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!palavras.length) return 'U';
  if (palavras.length === 1) return palavras[0].slice(0, 2).toUpperCase();
  return `${palavras[0][0] ?? ''}${palavras[1][0] ?? ''}`.toUpperCase();
};

const normalizarEntidade = entidade => {
  const normalizada = normalizarNotaEntidade(entidade);
  if (!normalizada) return null;

  return {
    id: normalizada.id,
    nome: normalizada.nome,
    resumo: normalizada.resumo || normalizada.conteudo,
    tipo: normalizada.tipo,
    tags: normalizada.tags,
    imagem: normalizada.imagem,
  };
};

export default Notas;
