import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { useAuth } from 'context/AuthContext';
import { useCampanha } from 'context/CampanhaContext';
import {
  getPersonagensJogaveis,
  getRmCampanhaJogadores,
  removeRmCampanhaJogador,
} from 'service/storage';
import ListLoadError from 'components/ListLoadError/ListLoadError';
import PersonagemFichaDialog from 'components/PersonagemFichaDialog/PersonagemFichaDialog';
import PersonagemCard from 'components/PersonagemCard/PersonagemCard';
import { ROUTE_PATHS } from 'common/constants/routes';
import {
  ATRIBUTOS_PRIMARIOS_PERSONAGEM,
  ATRIBUTOS_SECUNDARIOS_PERSONAGEM,
} from 'common/constants/atributosPersonagem';
import { ehJogadorDaCampanha } from './jogadoresUtils';

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
        getRmCampanhaJogadores(
          campanhaAtiva.id,
          campanhaAtiva.universoId,
          campanhaAtiva.mestreId,
        ),
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
              sm: 'repeat(auto-fill, minmax(340px, 1fr))',
            },
            gap: 2,
          }}
        >
          {jogadoresDoUniverso.map(personagem => (
            <PersonagemCard
              key={personagem.id}
              personagem={personagem}
              clone={cloneDe(personagem.id)}
              podeEscrever={podeEscrever}
              atributosPrimarios={ATRIBUTOS_PRIMARIOS_PERSONAGEM}
              atributosSecundarios={ATRIBUTOS_SECUNDARIOS_PERSONAGEM}
              onVisualizar={setPersonagemVisualizado}
              onClonar={handleClonar}
              onEditarClone={handleEditarClone}
              onRemoverClone={handleRemoverClone}
              exibirDescricao
              seloCloneBadge
              seloCloneRodape
            />
          ))}
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
