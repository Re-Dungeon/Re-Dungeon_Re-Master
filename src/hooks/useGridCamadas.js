import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { setGridCamada, subscribeGridCamadas } from 'service/storage';
import {
  ACOES_CAMADA,
  CAMADAS,
  TRECHOS_TEXTO_MAX,
  aplicarCelulas,
  chaveDaCelula,
  codificarTrechos,
  normalizarNevoa,
  normalizarParedes,
} from 'common/utils/gridCamadas';

// Paredes e névoa de uma cena do grid em tempo real (cópia nos dois sites —
// mudou um, mude o outro): docs gridCenas/{cenaId}/camadas/{paredes|nevoa}
// (common/utils/gridCamadas.js). Todos leem; só o mestre grava. Cada edição
// parte do último estado conhecido (`ultimoRef`, também atualizado ao gravar),
// aplica as células e regrava o doc inteiro — escritas seguidas não se perdem
// mesmo antes do snapshot voltar. Estouro de TRECHOS_TEXTO_MAX não grava.
const PAREDES_VAZIAS = new Set();
const NEVOA_VAZIA = { ativa: false, reveladas: new Set() };
const RECEBIDO_VAZIO = { chave: null, paredes: null, nevoa: null };

const todasAsCelulas = limites => {
  const celulas = new Set();
  for (let lin = 0; lin < limites.linhas; lin += 1) {
    for (let col = 0; col < limites.colunas; col += 1) {
      celulas.add(chaveDaCelula(col, lin));
    }
  }
  return celulas;
};

const foraDoMundo = (limites, { col, lin }) =>
  Boolean(limites) &&
  (col < 0 || lin < 0 || col >= limites.colunas || lin >= limites.linhas);

const camadaValida = camada => Object.values(CAMADAS).includes(camada);

const useGridCamadas = (
  campanhaId,
  cenaId,
  { ativo = true, veTudo = false, onErro } = {},
) => {
  const chave = ativo && campanhaId && cenaId ? `${campanhaId}/${cenaId}` : null;
  const [recebido, setRecebido] = useState(RECEBIDO_VAZIO);
  // Último estado conhecido da cena `chave` (snapshot ou escrita minha).
  const ultimoRef = useRef({ paredes: PAREDES_VAZIAS, nevoa: NEVOA_VAZIA });

  useEffect(() => {
    if (!chave) return undefined;
    ultimoRef.current = { paredes: PAREDES_VAZIAS, nevoa: NEVOA_VAZIA };
    return subscribeGridCamadas(
      campanhaId,
      cenaId,
      ({ paredes, nevoa } = {}) => {
        ultimoRef.current = {
          paredes: normalizarParedes(paredes),
          nevoa: normalizarNevoa(nevoa),
        };
        setRecebido({ chave, paredes: paredes ?? null, nevoa: nevoa ?? null });
      },
      error => {
        // eslint-disable-next-line no-console
        console.error('Falha ao ouvir as camadas do grid:', error);
        // Jogador numa cena que acabou de deixar de ser a ativa: a escuta vai
        // ser trocada, não é erro.
        if (veTudo || error?.code !== 'permission-denied') {
          onErro?.('Não foi possível carregar as paredes e a névoa da cena.');
        }
        setRecebido({ chave, paredes: null, nevoa: null });
      },
    );
  }, [campanhaId, cenaId, chave, veTudo, onErro]);

  const docParedes = chave && recebido.chave === chave ? recebido.paredes : null;
  const docNevoa = chave && recebido.chave === chave ? recebido.nevoa : null;
  const bloqueadas = useMemo(
    () => (docParedes ? normalizarParedes(docParedes) : PAREDES_VAZIAS),
    [docParedes],
  );
  const nevoa = useMemo(
    () => (docNevoa ? normalizarNevoa(docNevoa) : NEVOA_VAZIA),
    [docNevoa],
  );

  // Grava a camada e já lembra o novo estado; se falhar, volta ao anterior.
  const gravar = useCallback(
    async (camada, novo) => {
      const anterior = ultimoRef.current;
      const celulas = camada === CAMADAS.NEVOA ? novo.reveladas : novo;
      const trechos = codificarTrechos(celulas);
      if (trechos.length > TRECHOS_TEXTO_MAX) {
        onErro?.('Muitas áreas separadas para salvar.');
        return false;
      }
      const dados =
        camada === CAMADAS.NEVOA ? { ativa: novo.ativa, trechos } : { trechos };
      const atualizado =
        camada === CAMADAS.NEVOA
          ? { ...anterior, nevoa: novo }
          : { ...anterior, paredes: novo };
      ultimoRef.current = atualizado;
      try {
        await setGridCamada(campanhaId, cenaId, camada, dados);
        return true;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Falha ao gravar a camada do grid:', error);
        if (ultimoRef.current === atualizado) ultimoRef.current = anterior;
        onErro?.('Não foi possível salvar as alterações do mapa.');
        return false;
      }
    },
    [campanhaId, cenaId, onErro],
  );

  // Adiciona/remove células de uma camada. Na névoa, adicionar = revelar.
  const editarCamada = useCallback(
    (camada, acao, celulas, limites = null) => {
      if (!chave || !veTudo || !camadaValida(camada)) return Promise.resolve(false);
      const dentro = celulas.filter(celula => !foraDoMundo(limites, celula));
      const atual = ultimoRef.current;
      if (camada === CAMADAS.NEVOA) {
        const reveladas = aplicarCelulas(atual.nevoa.reveladas, dentro, acao);
        return gravar(camada, { ativa: atual.nevoa.ativa, reveladas });
      }
      return gravar(camada, aplicarCelulas(atual.paredes, dentro, acao));
    },
    [chave, gravar, veTudo],
  );

  const definirNevoaAtiva = useCallback(
    ativa => {
      if (!chave || !veTudo) return Promise.resolve(false);
      return gravar(CAMADAS.NEVOA, {
        ativa: Boolean(ativa),
        reveladas: ultimoRef.current.nevoa.reveladas,
      });
    },
    [chave, gravar, veTudo],
  );

  // Cobrir tudo / Revelar tudo (névoa) e Limpar paredes: adicionar preenche o
  // mundo (`limites`), remover esvazia.
  const preencherCamada = useCallback(
    (camada, acao, limites) => {
      if (!chave || !veTudo || !camadaValida(camada)) return Promise.resolve(false);
      const novas =
        acao === ACOES_CAMADA.ADICIONAR && limites ? todasAsCelulas(limites) : new Set();
      if (camada === CAMADAS.NEVOA) {
        return gravar(camada, { ativa: ultimoRef.current.nevoa.ativa, reveladas: novas });
      }
      return gravar(camada, novas);
    },
    [chave, gravar, veTudo],
  );

  return { bloqueadas, nevoa, editarCamada, definirNevoaAtiva, preencherCamada };
};

export default useGridCamadas;
