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

  // O efeito depende só do que a leitura usa (id/universo/mestre), não do
  // objeto `campanha`: ele ganha identidade nova a cada `recarregarCampanhas`
  // e refazia as leituras à toa. Os filtros de `chatPersonas` só olham
  // `id`/`universoId`.
  const id = campanha?.id;
  const universoId = campanha?.universoId;
  const mestreId = campanha?.mestreId;

  useEffect(() => {
    if (!id) return undefined;
    let active = true;
    const campanhaDaLeitura = { id, universoId, mestreId };
    // "Recarregar fontes" (versão > 0) ignora o cache de personagens/clones.
    const forcar = versao > 0;
    const opcoes = { forcar };
    Promise.all([
      getPersonagens(universoId, opcoes),
      getRmCampanhaNpcs(id, universoId, mestreId, opcoes),
      getRmCampanhaCriaturas(id, universoId, mestreId, opcoes),
      incluirJogadores ? getPersonagensJogaveis(universoId, opcoes) : [],
      incluirJogadores
        ? getRmCampanhaJogadores(id, universoId, mestreId, opcoes)
        : [],
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
              campanha: campanhaDaLeitura,
            }),
            jogadores: montarJogadoresDaMesa({
              personagens: jogaveis,
              clones: jogadorClones,
              campanha: campanhaDaLeitura,
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
  }, [id, universoId, mestreId, incluirJogadores, notifyError, versao]);

  const fontes = carregadas.campanhaId === id ? carregadas : FONTES_VAZIAS;
  return useMemo(() => ({ ...fontes, recarregar }), [fontes, recarregar]);
};

export default useFontesDaMesa;
