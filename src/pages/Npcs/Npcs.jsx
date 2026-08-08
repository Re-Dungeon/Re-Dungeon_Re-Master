import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import {
  getPersonagens,
  getRmCampanhaNpcs,
  removeRmCampanhaNpc,
} from 'service/storage';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import PersonagemFichaDialog from 'components/PersonagemFichaDialog/PersonagemFichaDialog';
import PersonagemCard from 'components/PersonagemCard/PersonagemCard';
import { ROUTE_PATHS } from 'common/constants/routes';
import {
  ATRIBUTOS_PRIMARIOS_PERSONAGEM,
  ATRIBUTOS_SECUNDARIOS_PERSONAGEM,
} from 'common/constants/atributosPersonagem';
import { ehNpcDaCampanha } from './npcUtils';

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

  const mergeVisualizacao = (personagem, clone) => ({
    ...personagem,
    ...clone,
    id: personagem.id,
    origemPersonagemId: clone?.origemPersonagemId ?? personagem.id,
  });

  const handleVisualizar = personagem => {
    const clone = cloneDe(personagem.id);
    setPersonagemVisualizado(clone ? mergeVisualizacao(personagem, clone) : personagem);
  };

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
          {npcsDoUniverso.map(personagem => (
            <PersonagemCard
              key={personagem.id}
              personagem={personagem}
              clone={cloneDe(personagem.id)}
              podeEscrever={podeEscrever}
              atributosPrimarios={ATRIBUTOS_PRIMARIOS_PERSONAGEM}
              atributosSecundarios={ATRIBUTOS_SECUNDARIOS_PERSONAGEM}
              onVisualizar={handleVisualizar}
              onEditarClone={handleEditarClone}
              onRemoverClone={handleRemoverClone}
              seloCloneTopo
            />
          ))}
        </Box>
      )}

      <PersonagemFichaDialog
        open={Boolean(personagemVisualizado)}
        onClose={() => setPersonagemVisualizado(null)}
        personagem={personagemVisualizado}
        clone={personagemVisualizado ? cloneDe(personagemVisualizado.id) : null}
      />
    </Box>
  );
};

export default Npcs;
