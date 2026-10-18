import { useEffect, useState } from 'react';
import { useSnackbar } from 'context/SnackbarContext';
import {
  getPersonagens,
  getPersonagensJogaveis,
  getRmCampanhaCriaturas,
  getRmCampanhaJogadores,
  getRmCampanhaNpcs,
} from 'service/storage';
import { montarJogadoresDaMesa, montarPersonasDoMestre } from './chatPersonas';

const FONTES_VAZIAS = {
  campanhaId: null,
  npcs: [],
  criaturas: [],
  jogadores: [],
};

/**
 * NPCs, Criaturas (e, com `incluirJogadores`, os personagens jogáveis) da
 * campanha — mesma fonte das telas de NPCs/Criaturas/Jogadores (personagens
 * do Universo + clones da campanha). Usado pelo "Falando como" do Chat e pelo
 * "Adicionar token" do Grid. Falha aqui só avisa: o chat continua funcionando
 * com o mestre falando como "Mestre".
 */
const useFontesDaMesa = (campanha, { incluirJogadores = false } = {}) => {
  const { notifyError } = useSnackbar();
  const [carregadas, setCarregadas] = useState(FONTES_VAZIAS);

  useEffect(() => {
    if (!campanha) return undefined;
    let active = true;
    const { id, universoId, mestreId } = campanha;
    Promise.all([
      getPersonagens(),
      getRmCampanhaNpcs(id, universoId, mestreId),
      getRmCampanhaCriaturas(id, universoId, mestreId),
      incluirJogadores ? getPersonagensJogaveis() : [],
      incluirJogadores ? getRmCampanhaJogadores(id, universoId, mestreId) : [],
    ])
      .then(
        ([personagens, npcClones, criaturaClones, jogaveis, jogadorClones]) => {
          if (!active) return;
          setCarregadas({
            campanhaId: id,
            ...montarPersonasDoMestre({
              personagens,
              npcClones,
              criaturaClones,
              campanha,
            }),
            jogadores: montarJogadoresDaMesa({
              personagens: jogaveis,
              clones: jogadorClones,
              campanha,
            }),
          });
        },
      )
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao carregar NPCs/Criaturas da mesa:', error);
        if (!active) return;
        notifyError(
          incluirJogadores
            ? 'Não foi possível carregar os Jogadores, NPCs e Criaturas da mesa.'
            : 'Não foi possível carregar os NPCs e Criaturas da mesa.',
        );
      });
    return () => {
      active = false;
    };
  }, [campanha, incluirJogadores, notifyError]);

  return carregadas.campanhaId === campanha?.id ? carregadas : FONTES_VAZIAS;
};

export default useFontesDaMesa;
