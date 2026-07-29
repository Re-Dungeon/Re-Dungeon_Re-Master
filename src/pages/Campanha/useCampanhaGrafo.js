import { useCallback, useEffect, useMemo, useState } from 'react';
import dagre from '@dagrejs/dagre';
import {
  getRmCenas,
  addRmCenaConexao,
  removeRmCenaConexao,
  getRmCenaConexoes,
  updateRmCena,
  removeRmCena,
} from 'service/storage';
import { ESTADO_CENA_OPCOES } from './cenaUtils';

const NODE_WIDTH = 240;
const NODE_HEIGHT = 120;

const calcularLayoutAutomatico = (cenas, conexoes) => {
  const grafo = new dagre.graphlib.Graph();
  grafo.setDefaultEdgeLabel(() => ({}));
  grafo.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 100 });

  cenas.forEach(cena => {
    grafo.setNode(cena.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  conexoes.forEach(conexao => {
    if (
      cenas.some(c => c.id === conexao.origemCenaId) &&
      cenas.some(c => c.id === conexao.destinoCenaId)
    ) {
      grafo.setEdge(conexao.origemCenaId, conexao.destinoCenaId);
    }
  });

  dagre.layout(grafo);

  const posicoes = {};
  cenas.forEach(cena => {
    const { x, y } = grafo.node(cena.id);
    posicoes[cena.id] = { x: x - NODE_WIDTH / 2, y: y - NODE_HEIGHT / 2 };
  });
  return posicoes;
};

/**
 * Busca as Cenas + Conexões da Campanha ativa e deriva nodes/edges no formato
 * do React Flow, calculando posição automática (Dagre) apenas para Cenas
 * sem `posicaoCanvas` salva — nunca reposiciona uma Cena já arrastada.
 */
const useCampanhaGrafo = campanha => {
  const campanhaId = campanha?.id ?? null;
  const [cenas, setCenas] = useState([]);
  const [conexoes, setConexoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCenaId, setSelectedCenaId] = useState(null);

  const carregar = useCallback(() => {
    if (!campanhaId) {
      setCenas([]);
      setConexoes([]);
      setLoading(false);
      return Promise.resolve();
    }
    setLoading(true);
    return Promise.all([getRmCenas(), getRmCenaConexoes()])
      .then(([todasCenas, todasConexoes]) => {
        setCenas(todasCenas.filter(c => c.campanhaId === campanhaId));
        setConexoes(todasConexoes.filter(c => c.campanhaId === campanhaId));
      })
      .finally(() => setLoading(false));
  }, [campanhaId]);

  useEffect(() => {
    Promise.resolve().then(() => carregar());
  }, [carregar]);

  const layoutAutomatico = useMemo(
    () => calcularLayoutAutomatico(cenas, conexoes),
    [cenas, conexoes],
  );

  const nodes = useMemo(
    () =>
      cenas.map(cena => {
        const estado = ESTADO_CENA_OPCOES.find(o => o.value === cena.estado);
        return {
          id: cena.id,
          type: 'cenaNode',
          position: cena.posicaoCanvas ?? layoutAutomatico[cena.id] ?? { x: 0, y: 0 },
          selected: cena.id === selectedCenaId,
          data: { cena, cor: estado?.cor ?? '#6b7280' },
        };
      }),
    [cenas, layoutAutomatico, selectedCenaId],
  );

  const edges = useMemo(
    () =>
      conexoes.map(conexao => ({
        id: conexao.id,
        source: conexao.origemCenaId,
        target: conexao.destinoCenaId,
        label: conexao.rotulo || undefined,
        style: { stroke: 'var(--color-accent)' },
        markerEnd: { type: 'arrowclosed', color: 'var(--color-accent)' },
      })),
    [conexoes],
  );

  const moveCenaLocal = useCallback((cenaId, posicao) => {
    setCenas(prev =>
      prev.map(c => (c.id === cenaId ? { ...c, posicaoCanvas: posicao } : c)),
    );
  }, []);

  const persistirPosicaoCena = useCallback(async (cenaId, posicao) => {
    await updateRmCena(cenaId, { posicaoCanvas: posicao });
  }, []);

  const createConexao = useCallback(
    async (origemCenaId, destinoCenaId) => {
      if (!campanha || origemCenaId === destinoCenaId) return;
      const jaExiste = conexoes.some(
        c => c.origemCenaId === origemCenaId && c.destinoCenaId === destinoCenaId,
      );
      if (jaExiste) return;
      await addRmCenaConexao({
        campanhaId: campanha.id,
        universoId: campanha.universoId,
        mestreId: campanha.mestreId,
        origemCenaId,
        destinoCenaId,
      });
      await carregar();
    },
    [campanha, conexoes, carregar],
  );

  const removeConexao = useCallback(
    async conexaoId => {
      await removeRmCenaConexao(conexaoId);
      await carregar();
    },
    [carregar],
  );

  const updateCena = useCallback(
    async (cenaId, values) => {
      await updateRmCena(cenaId, values);
      await carregar();
    },
    [carregar],
  );

  const removeCena = useCallback(
    async cenaId => {
      const conexoesLigadas = conexoes.filter(
        c => c.origemCenaId === cenaId || c.destinoCenaId === cenaId,
      );
      await Promise.all(conexoesLigadas.map(c => removeRmCenaConexao(c.id)));
      await removeRmCena(cenaId);
      setSelectedCenaId(prev => (prev === cenaId ? null : prev));
      await carregar();
    },
    [conexoes, carregar],
  );

  return {
    cenas,
    conexoes,
    nodes,
    edges,
    loading,
    selectedCenaId,
    setSelectedCenaId,
    moveCenaLocal,
    persistirPosicaoCena,
    createConexao,
    removeConexao,
    updateCena,
    removeCena,
    recarregar: carregar,
  };
};

export default useCampanhaGrafo;
