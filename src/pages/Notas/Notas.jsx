import React, { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import GridViewOutlinedIcon from '@mui/icons-material/GridViewOutlined';
import ListOutlinedIcon from '@mui/icons-material/ListOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';

const universoMock = {
  nome: 'Reino de Arandor',
};

const entidadesMock = [];

const columnOptions = [5, 6, 8];
const visibleFieldOptions = [
  { key: 'tipo', label: 'Tipo' },
  { key: 'descricao', label: 'Resumo' },
  { key: 'tags', label: 'Tags' },
];

const sortOptions = [
  { value: 'az', label: 'A–Z' },
  { value: 'za', label: 'Z–A' },
  { value: 'recentes', label: 'Mais recentes' },
  { value: 'antigos', label: 'Mais antigos' },
  { value: 'edicao', label: 'Última edição' },
  { value: 'tipo', label: 'Por tipo' },
];

const formatDate = value => {
  const date = new Date(value);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const comparador = (a, b, ordenacao) => {
  switch (ordenacao) {
    case 'za':
      return b.nome.localeCompare(a.nome, 'pt-BR');
    case 'recentes':
      return new Date(b.ultimoAcesso) - new Date(a.ultimoAcesso);
    case 'antigos':
      return new Date(a.ultimoAcesso) - new Date(b.ultimoAcesso);
    case 'edicao':
      return b.id.localeCompare(a.id);
    case 'tipo':
      return (
        a.tipo.localeCompare(b.tipo, 'pt-BR') ||
        a.nome.localeCompare(b.nome, 'pt-BR')
      );
    case 'az':
    default:
      return a.nome.localeCompare(b.nome, 'pt-BR');
  }
};

const Notas = () => {
  const [pesquisa, setPesquisa] = useState('');
  const [categoriaAtiva, setCategoriaAtiva] = useState('Todos');
  const [ordem, setOrdem] = useState('az');
  const [modoVisualizacao, setModoVisualizacao] = useState('grid');
  const [colunas, setColunas] = useState(5);
  const [visibleFields, setVisibleFields] = useState({
    tipo: true,
    descricao: true,
    tags: true,
  });

  const [configMenuAnchor, setConfigMenuAnchor] = useState(null);

  const categorias = useMemo(() => {
    const counts = entidadesMock.reduce((acc, entidade) => {
      acc[entidade.tipo] = (acc[entidade.tipo] ?? 0) + 1;
      return acc;
    }, {});

    const tipos = Object.keys(counts).sort((a, b) => a.localeCompare(b));
    return [
      { label: 'Todos', value: 'Todos', count: entidadesMock.length },
      ...tipos.map(tipo => ({ label: tipo, value: tipo, count: counts[tipo] })),
    ];
  }, []);

  const entidadesFiltradas = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();
    const lista = entidadesMock.filter(entidade => {
      const matchTipo =
        categoriaAtiva === 'Todos' || entidade.tipo === categoriaAtiva;
      if (!matchTipo) return false;

      const digest =
        `${entidade.nome} ${entidade.descricao} ${entidade.tags.join(' ')}`.toLowerCase();
      if (termo && !digest.includes(termo)) return false;

      return true;
    });

    return [...lista].sort((a, b) => comparador(a, b, ordem));
  }, [categoriaAtiva, ordem, pesquisa]);

  const toggleField = field => {
    setVisibleFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const totalEntidades = entidadesMock.length;

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, width: '100%' }}
    >
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          border: '1px solid rgba(255,255,255,0.07)',
          background:
            'linear-gradient(180deg, rgba(16,18,24,0.95), rgba(10,12,17,0.94))',
          p: { xs: 2.25, md: 3 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{
                color: '#d5a6a6',
                letterSpacing: 1.5,
                display: 'inline-block',
              }}
            >
              Wiki
            </Typography>
            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                alignItems: 'baseline',
                flexWrap: 'wrap',
                mt: 0.5,
              }}
            >
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.04em',
                }}
              >
                Enciclopédia
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: 'var(--text-secondary)' }}
              >
                • {universoMock.nome}
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{ color: 'var(--text-secondary)', mt: 0.75 }}
            >
              {totalEntidades} entidades cadastradas
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="text"
              size="small"
              startIcon={<DownloadOutlinedIcon fontSize="small" />}
              sx={{
                color: 'var(--text-secondary)',
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              Exportar
            </Button>
            <Button
              variant="text"
              size="small"
              startIcon={<ShareOutlinedIcon fontSize="small" />}
              sx={{
                color: 'var(--text-secondary)',
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              Compartilhar
            </Button>
            <Button
              variant="contained"
              size="small"
              disabled
              sx={{
                borderRadius: 2,
                background: '#b13535',
                color: '#ffffff',
                textTransform: 'none',
                px: 2,
                '&.Mui-disabled': {
                  background: 'rgba(177,53,53,0.35)',
                  color: 'rgba(255,255,255,0.6)',
                },
              }}
            >
              Nova entidade
            </Button>
          </Box>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(17,20,27,0.82)',
          p: { xs: 1.5, md: 1.8 },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 1.25,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <TextField
            value={pesquisa}
            onChange={event => setPesquisa(event.target.value)}
            size="small"
            placeholder="Pesquisar entidade"
            sx={{
              flex: '1 1 300px',
              minWidth: 220,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text-primary)',
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Button
            size="small"
            startIcon={<FilterListOutlinedIcon fontSize="small" />}
            sx={{
              color: 'var(--text-primary)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              background: 'rgba(255,255,255,0.02)',
              textTransform: 'none',
            }}
          >
            Tags
          </Button>

          <FormControl size="small" sx={{ minWidth: 170 }}>
            <Select
              value={ordem}
              onChange={event => setOrdem(event.target.value)}
              displayEmpty
              sx={{
                borderRadius: 2,
                background: 'rgba(255,255,255,0.02)',
                color: 'var(--text-primary)',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.08)',
                },
              }}
            >
              {sortOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            size="small"
            startIcon={<TuneOutlinedIcon fontSize="small" />}
            onClick={event => setConfigMenuAnchor(event.currentTarget)}
            sx={{
              color: 'var(--text-primary)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
              background: 'rgba(255,255,255,0.02)',
              textTransform: 'none',
            }}
          >
            Exibição
          </Button>

          <Box sx={{ ml: 'auto', display: 'flex', gap: 0.75 }}>
            <IconButton
              size="small"
              onClick={() => setModoVisualizacao('grid')}
              sx={{
                background:
                  modoVisualizacao === 'grid'
                    ? 'rgba(177,53,53,0.12)'
                    : 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                color:
                  modoVisualizacao === 'grid'
                    ? '#ff9d9d'
                    : 'var(--text-secondary)',
              }}
            >
              <GridViewOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setModoVisualizacao('list')}
              sx={{
                background:
                  modoVisualizacao === 'list'
                    ? 'rgba(177,53,53,0.12)'
                    : 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                color:
                  modoVisualizacao === 'list'
                    ? '#ff9d9d'
                    : 'var(--text-secondary)',
              }}
            >
              <ListOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {categorias.map(categoria => (
          <Chip
            key={categoria.value}
            label={`${categoria.label} (${categoria.count})`}
            variant={categoriaAtiva === categoria.value ? 'filled' : 'outlined'}
            onClick={() => setCategoriaAtiva(categoria.value)}
            sx={{
              borderRadius: '999px',
              borderColor: 'rgba(255,255,255,0.1)',
              background:
                categoriaAtiva === categoria.value
                  ? 'rgba(177,53,53,0.14)'
                  : 'rgba(255,255,255,0.01)',
              color:
                categoriaAtiva === categoria.value
                  ? '#f4dada'
                  : 'var(--text-secondary)',
              fontWeight: 600,
            }}
          />
        ))}
      </Box>

      {modoVisualizacao === 'grid' ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))`,
            gap: 2,
            alignItems: 'stretch',
            '@media (max-width: 1200px)': {
              gridTemplateColumns: `repeat(${Math.min(colunas, 6)}, minmax(0, 1fr))`,
            },
            '@media (max-width: 900px)': {
              gridTemplateColumns: `repeat(${Math.min(colunas, 4)}, minmax(0, 1fr))`,
            },
            '@media (max-width: 640px)': {
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            },
            '@media (max-width: 440px)': { gridTemplateColumns: '1fr' },
          }}
        >
          {entidadesFiltradas.map(entidade => (
            <Paper
              key={entidade.id}
              elevation={0}
              sx={{
                overflow: 'hidden',
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(15,18,24,0.9)',
                transition:
                  'border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  borderColor: 'rgba(177,53,53,0.55)',
                  boxShadow: '0 20px 30px rgba(0,0,0,0.22)',
                },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  aspectRatio: '5 / 6',
                  backgroundColor: '#110d16',
                }}
              >
                <Box
                  component="img"
                  src={entidade.capa}
                  alt={entidade.nome}
                  sx={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(180deg, rgba(10,12,18,0.08), rgba(10,12,18,0.72))',
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    left: 12,
                    top: 12,
                    display: 'flex',
                    gap: 0.5,
                    alignItems: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#cb7c7c',
                      boxShadow: '0 0 14px rgba(203,124,124,0.7)',
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#f7dadb',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {entidade.tipo}
                  </Typography>
                </Box>
                <Box
                  sx={{ position: 'absolute', left: 12, right: 12, bottom: 12 }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontSize: '1rem',
                      lineHeight: 1.2,
                      color: '#fff',
                      fontWeight: 700,
                      letterSpacing: '-0.03em',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {entidade.nome}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.2,
                }}
              >
                {visibleFields.tipo && (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ color: 'var(--text-secondary)' }}
                    >
                      Categoria
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: '#f0cece', fontWeight: 700 }}
                    >
                      {entidade.tipo}
                    </Typography>
                  </Box>
                )}

                {visibleFields.descricao && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {entidade.descricao}
                  </Typography>
                )}

                {visibleFields.tags && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                    {entidade.tags.slice(0, 2).map(tag => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        sx={{
                          height: 22,
                          borderRadius: '999px',
                          background: 'rgba(255,255,255,0.04)',
                          color: 'var(--text-secondary)',
                          fontSize: '0.68rem',
                          border: '1px solid rgba(255,255,255,0.05)',
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.3 }}>
          {entidadesFiltradas.map(entidade => (
            <Paper
              key={entidade.id}
              elevation={0}
              sx={{
                display: 'grid',
                gridTemplateColumns: '112px 1.3fr 1fr 150px',
                gap: 1.5,
                alignItems: 'center',
                p: 1.25,
                borderRadius: 3,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(15,18,24,0.9)',
              }}
            >
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  aspectRatio: '1 / 1',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <Box
                  component="img"
                  src={entidade.capa}
                  alt={entidade.nome}
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              <Box>
                <Typography
                  variant="subtitle1"
                  sx={{ color: 'var(--text-primary)', fontWeight: 700 }}
                >
                  {entidade.nome}
                </Typography>
                {visibleFields.descricao && (
                  <Typography
                    variant="body2"
                    sx={{
                      color: 'var(--text-secondary)',
                      mt: 0.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {entidade.descricao}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                {visibleFields.tags &&
                  entidade.tags.map(tag => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-secondary)',
                        borderRadius: '999px',
                      }}
                    />
                  ))}
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ color: '#f0cece', fontWeight: 700 }}
                >
                  {entidade.tipo}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'var(--text-secondary)' }}
                >
                  {formatDate(entidade.ultimoAcesso)}
                </Typography>
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      <Menu
        anchorEl={configMenuAnchor}
        open={Boolean(configMenuAnchor)}
        onClose={() => setConfigMenuAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              minWidth: 260,
              borderRadius: 2,
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#10151d',
            },
          },
        }}
      >
        <Box sx={{ p: 1.5, minWidth: 230 }}>
          <Typography
            variant="subtitle2"
            sx={{ color: 'var(--text-primary)', mb: 1.25, fontWeight: 700 }}
          >
            Exibição
          </Typography>

          <Typography
            variant="caption"
            sx={{ color: 'var(--text-secondary)', display: 'block', mb: 0.75 }}
          >
            Colunas
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
            {columnOptions.map(value => (
              <Button
                key={value}
                size="small"
                variant={colunas === value ? 'contained' : 'outlined'}
                onClick={() => {
                  setColunas(value);
                  setConfigMenuAnchor(null);
                }}
                sx={{
                  minWidth: 0,
                  px: 1.25,
                  borderRadius: 2,
                  background: colunas === value ? '#b13535' : 'transparent',
                  color: colunas === value ? '#fff' : 'var(--text-primary)',
                  borderColor: 'rgba(255,255,255,0.08)',
                  textTransform: 'none',
                }}
              >
                {value}
              </Button>
            ))}
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1 }} />

          <Typography
            variant="caption"
            sx={{ color: 'var(--text-secondary)', display: 'block', mb: 0.75 }}
          >
            Atributos
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
            {visibleFieldOptions.map(field => (
              <Button
                key={field.key}
                size="small"
                variant={visibleFields[field.key] ? 'contained' : 'outlined'}
                onClick={() => {
                  toggleField(field.key);
                }}
                sx={{
                  justifyContent: 'space-between',
                  borderRadius: 2,
                  background: visibleFields[field.key]
                    ? 'rgba(177,53,53,0.16)'
                    : 'transparent',
                  borderColor: 'rgba(255,255,255,0.08)',
                  color: 'var(--text-primary)',
                  textTransform: 'none',
                }}
              >
                {field.label}
              </Button>
            ))}
          </Box>
        </Box>
      </Menu>
    </Box>
  );
};

export default Notas;
