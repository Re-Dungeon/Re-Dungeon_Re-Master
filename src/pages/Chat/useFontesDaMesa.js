import { useCallback, useEffect, useMemo, useState } from 'react';
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
 *
 * Devolve `{ npcs, criaturas, jogadores, campanhaId, recarregar }`:
 * `recarregar()` busca tudo de novo (para quando o mestre criou/vinculou
 * personagens com a tela já aberta) mantendo a lista atual até a resposta.
 */
const useFontesDaMesa = (campanha, { incluirJogadores = false } = {}) => {
  const { notifyError } = useSnackbar();
  const [carregadas, setCarregadas] = useState(FONTES_VAZIAS);
  const [versao, setVersao] = useState(0);

  const recarregar = useCallback(() => setVersao(atual => atual + 1), []);

  useEffect(() => {
    if (!campanha) return undefined;
    let active = true;
    const { id, universoId, mestreId } = campanha;
    // "Recarregar fontes" (versão > 0) ignora o cache de personagens.
    const forcar = versao > 0;
    Promise.all([
      getPersonagens(universoId, { forcar }),
      getRmCampanhaNpcs(id, universoId, mestreId),
      getRmCampanhaCriaturas(id, universoId, mestreId),
      incluirJogadores ? getPersonagensJogaveis(universoId, { forcar }) : [],
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
  }, [campanha, incluirJogadores, notifyError, versao]);

  const fontes =
    carregadas.campanhaId === campanha?.id ? carregadas : FONTES_VAZIAS;
  return useMemo(() => ({ ...fontes, recarregar }), [fontes, recarregar]);
};

export default useFontesDaMesa;
