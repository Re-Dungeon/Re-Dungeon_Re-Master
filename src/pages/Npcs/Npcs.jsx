import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import FitnessCenterOutlinedIcon from '@mui/icons-material/FitnessCenterOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import DirectionsRunOutlinedIcon from '@mui/icons-material/DirectionsRunOutlined';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import {
  getPersonagens,
  getRmCampanhaNpcs,
  removeRmCampanhaNpc,
} from 'service/storage';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import PersonagemFichaDialog from 'components/PersonagemFichaDialog/PersonagemFichaDialog';
import { ROUTE_PATHS } from 'common/constants/routes';
import { ehNpcDaCampanha } from './npcUtils';

const cardSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2.5,
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  transition:
    'transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: 'var(--border-hover)',
    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.24)',
  },
};

const ATRIBUTOS_NPC = [
  { label: 'FOR', chave: 'forca', aliases: ['forca', 'for', 'forcaBase'], icon: FitnessCenterOutlinedIcon },
  { label: 'VIT', chave: 'vitalidade', aliases: ['vitalidade', 'vit', 'vitalidadeBase'], icon: FavoriteBorderOutlinedIcon },
  { label: 'AGI', chave: 'agilidade', aliases: ['agilidade', 'agi', 'agilidadeBase'], icon: DirectionsRunOutlinedIcon },
  { label: 'INT', chave: 'inteligencia', aliases: ['inteligencia', 'int', 'inteligenciaBase'], icon: PsychologyOutlinedIcon },
  { label: 'PER', chave: 'percepcao', aliases: ['percepcao', 'per', 'percepcaoBase'], icon: VisibilityOutlinedIcon },
  { label: 'SOR', chave: 'sorte', aliases: ['sorte', 'sor', 'sorteBase'], icon: AutoAwesomeOutlinedIcon },
];

const ATRIBUTOS_SECUNDARIOS = [
  { label: 'PronT', aliases: ['prontidao', 'prontidaoBase', 'prontidaoBonus'] },
  { label: 'AtK', aliases: ['ataque', 'ataqueBase', 'ataqueBonus'] },
  { label: 'DeF', aliases: ['defesa', 'defesaBase', 'defesaBonus'] },
  { label: 'PreC', aliases: ['precisao', 'precisaoBase', 'precisaoBonus'] },
  { label: 'ReA', aliases: ['reacao', 'reacaoBase', 'reacaoBonus'] },
  { label: 'EvA', aliases: ['evasao', 'evasaoBase', 'evasaoBonus'] },
];

const ehValorPrimitivo = valor =>
  typeof valor === 'string' || typeof valor === 'number' || typeof valor === 'boolean';

const resolverValorAtributo = (personagem, aliases) => {
  const candidatos = aliases.flatMap(alias => {
    const valores = [];
    const rawValues = [
      personagem?.[alias],
      personagem?.atributosBase?.[alias],
      personagem?.atributos?.[alias],
      personagem?.secundariosTotais?.[alias],
      personagem?.totais?.[alias],
    ];

    rawValues.forEach(valor => {
      if (valor !== undefined && valor !== null && valor !== '') {
        valores.push(valor);
      }
    });

    return valores;
  });

  const valorPrimitivo = candidatos.find(ehValorPrimitivo);
  return valorPrimitivo !== undefined ? String(valorPrimitivo) : '—';
};

const resolverValorAtributoSecundario = (personagem, aliases) => {
  const temValorSecundario = aliases.some(alias =>
    personagem?.secundariosTotais?.[alias] !== undefined ||
    personagem?.totais?.[alias] !== undefined ||
    personagem?.secundariosBase?.[alias] !== undefined ||
    personagem?.atributosBonus?.[alias] !== undefined,
  );

  const total = aliases.reduce((soma, alias) => {
    const totalDireto =
      personagem?.secundariosTotais?.[alias] ?? personagem?.totais?.[alias];
    if (typeof totalDireto === 'number') {
      return soma + totalDireto;
    }

    const base = personagem?.secundariosBase?.[alias];
    const bonus = personagem?.atributosBonus?.[alias];
    return (
      soma +
      (typeof base === 'number' ? base : 0) +
      (typeof bonus === 'number' ? bonus : 0)
    );
  }, 0);

  if (temValorSecundario) {
    return String(total);
  }

  return resolverValorAtributo(personagem, aliases);
};

// A lista vem sempre de `personagens` (Re-Dungeon), filtrada por
// tipo/universo/vínculo com a campanha — não existe mais criação de NPC "do
// zero" aqui. `clones` (rmCampanhas/{id}/npcs) guarda só os campos extras que
// o mestre preencheu para esta campanha, indexados por origemPersonagemId.
const Npcs = () => {
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const { campanhaAtiva, loadingCampanhas } = useCampanha();

  const [npcsDoUniverso, setNpcsDoUniverso] = useState([]);
  const [clones, setClones] = useState([]);
  const [loadingNpcs, setLoadingNpcs] = useState(true);
  const [errorNpcs, setErrorNpcs] = useState(null);
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
      setLoadingNpcs(true);
      setErrorNpcs(null);
      Promise.all([
        getPersonagens(),
        getRmCampanhaNpcs(
          campanhaAtiva.id,
          campanhaAtiva.universoId,
          campanhaAtiva.mestreId,
        ),
      ])
        .then(([personagens, npcsClonados]) => {
          if (!active) return;
          setNpcsDoUniverso(
            personagens.filter(p => ehNpcDaCampanha(p, campanhaAtiva)),
          );
          setClones(npcsClonados);
        })
        .catch(err => {
          if (active) setErrorNpcs(err);
        })
        .finally(() => {
          if (active) setLoadingNpcs(false);
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

  const loading = loadingCampanhas || loadingNpcs;
  const podeEscrever = campanhaAtiva
    ? canWrite(campanhaAtiva.universoId)
    : false;

  const cloneDe = personagemId =>
    clones.find(clone => clone.origemPersonagemId === personagemId) ?? null;

  const handleEditarClone = (personagem, clone) => {
    navigate(ROUTE_PATHS.NPC_CLONE, { state: { personagem, clone } });
  };

  const handleRemoverClone = async clone => {
    await removeRmCampanhaNpc(campanhaAtiva.id, clone.id);
    setClones(prev => prev.filter(c => c.id !== clone.id));
  };

  return (
    <Box className="page-container">
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h5"
          sx={{ color: 'var(--text-primary)', fontWeight: 700, mb: 0.5 }}
        >
          NPCs — {campanhaAtiva?.nome}
        </Typography>
        <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
          Personagens do tipo NPC do Universo vinculados a esta campanha. Clone
          um NPC para adicionar informações específicas da sua mesa, sem alterar
          a ficha original.
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: 'var(--color-accent)' }} />
        </Box>
      ) : errorNpcs ? (
        <ListLoadError mensagem="Erro ao carregar os NPCs." onRetry={reload} />
      ) : npcsDoUniverso.length === 0 ? (
        <Box className="empty-state">
          <span className="empty-state-icon">🧑</span>
          <p>Nenhum NPC vinculado a esta campanha</p>
          <small>
            No Universo desta campanha, vincule um personagem do tipo NPC a esta
            campanha para que ele apareça aqui.
          </small>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(auto-fill, minmax(340px, 1fr))',
            },
            gap: 2,
          }}
        >
          {npcsDoUniverso.map(personagem => {
            const clone = cloneDe(personagem.id);
            return (
              <Paper key={personagem.id} elevation={0} sx={cardSx}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    mb: 1.5,
                    gap: 1,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{ color: 'var(--text-primary)', fontWeight: 700 }}
                  >
                    {personagem.nome}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <IconButton
                      size="small"
                      onClick={() => setPersonagemVisualizado(personagem)}
                      sx={{ color: 'var(--color-accent)' }}
                      aria-label={`Ver ficha de ${personagem.nome}`}
                    >
                      <VisibilityOutlinedIcon fontSize="small" />
                    </IconButton>
                    {podeEscrever && clone && (
                      <>
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
                      </>
                    )}
                  </Box>
                </Box>

                {clone && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'var(--color-accent)',
                      display: 'block',
                      mb: 1,
                      fontWeight: 600,
                    }}
                  >
                    Clonado nesta campanha
                  </Typography>
                )}

                <Box
                  sx={{
                    width: '100%',
                    height: 180,
                    borderRadius: 2,
                    border: '1px solid var(--border-primary)',
                    background: 'var(--bg-secondary)',
                    overflow: 'hidden',
                    mb: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {personagem.linkImagem ? (
                    <Box
                      component="img"
                      src={personagem.linkImagem}
                      alt={personagem.nome}
                      loading="lazy"
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                      onError={e => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.75,
                        color: 'var(--text-muted)',
                      }}
                    >
                      <ImageOutlinedIcon sx={{ fontSize: 30 }} />
                      <Typography variant="caption">Sem imagem</Typography>
                    </Box>
                  )}
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(3, minmax(0, 1fr))',
                      md: 'repeat(6, minmax(0, 1fr))',
                    },
                    gap: 0.75,
                    mb: 2,
                  }}
                >
                  {ATRIBUTOS_NPC.map(({ label, aliases, icon: Icon }) => {
                    const valor = resolverValorAtributo(personagem, aliases);
                    return (
                      <Box
                        key={label}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.25,
                          alignItems: 'center',
                          p: 0.9,
                          borderRadius: 1.5,
                          background: 'rgba(111, 45, 168, 0.14)',
                          border: '1px solid rgba(111, 45, 168, 0.2)',
                        }}
                      >
                        <Icon sx={{ fontSize: 16, color: 'var(--color-accent)' }} />
                        <Typography
                          variant="caption"
                          sx={{ color: 'var(--text-muted)', fontWeight: 700 }}
                        >
                          {label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: 'var(--text-primary)', fontWeight: 700 }}
                        >
                          {valor}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: 'repeat(3, minmax(0, 1fr))',
                      md: 'repeat(6, minmax(0, 1fr))',
                    },
                    gap: 0.75,
                    mb: 2,
                  }}
                >
                  {ATRIBUTOS_SECUNDARIOS.map(({ label, aliases }) => {
                    const valor = resolverValorAtributoSecundario(personagem, aliases);
                    return (
                      <Box
                        key={label}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.25,
                          alignItems: 'center',
                          p: 0.9,
                          borderRadius: 1.5,
                          background: 'rgba(111, 45, 168, 0.14)',
                          border: '1px solid rgba(111, 45, 168, 0.2)',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ color: 'var(--text-muted)', fontWeight: 700 }}
                        >
                          {label}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: 'var(--text-primary)', fontWeight: 700 }}
                        >
                          {valor}
                        </Typography>
                      </Box>
                    );
                  })}
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

export default Npcs;
