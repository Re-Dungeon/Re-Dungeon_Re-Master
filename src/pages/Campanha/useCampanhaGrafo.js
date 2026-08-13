import { useCallback, useMemo, useState } from 'react';
import dagre from '@dagrejs/dagre';
import {
  getRmCenas,
  addRmCenaConexao,
  removeRmCenaConexao,
  getRmCenaConexoes,
  updateRmCena,
  removeRmCena,
} from 'service/storage';
import useAsyncEffect from 'hooks/useAsyncEffect';
import { useSnackbar } from 'context/SnackbarContext';
import { ESTADO_CENA_OPCOES } from './cenaUtils';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 160;

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
  const { notifyError } = useSnackbar();
  const campanhaId = campanha?.id ?? null;
  const [cenas, setCenas] = useState([]);
  const [conexoes, setConexoes] = useState([]);
  const [layoutAutomatico, setLayoutAutomatico] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCenaId, setSelectedCenaId] = useState(null);

  const carregar = useCallback(() => {
    if (!campanhaId) {
      setCenas([]);
      setConexoes([]);
      setLayoutAutomatico({});
      setLoading(false);
      setError(null);
      return Promise.resolve();
    }
    setLoading(true);
    setError(null);
    return Promise.all([
      getRmCenas(campanhaId, campanha.universoId, campanha.mestreId),
      getRmCenaConexoes(campanhaId, campanha.universoId, campanha.mestreId),
    ])
      .then(([cenasDaCampanha, conexoesDaCampanha]) => {
        setCenas(cenasDaCampanha);
        setConexoes(conexoesDaCampanha);
        setLayoutAutomatico(
          calcularLayoutAutomatico(cenasDaCampanha, conexoesDaCampanha),
        );
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false));
  }, [campanhaId, campanha]);

  useAsyncEffect(carregar, [carregar]);

  const nodes = useMemo(
    () =>
      cenas.map(cena => {
        const estado = ESTADO_CENA_OPCOES.find(o => o.value === cena.estado);
        return {
          id: cena.id,
          type: 'cenaNode',
          position: cena.posicaoCanvas ??
            layoutAutomatico[cena.id] ?? { x: 0, y: 0 },
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
        sourceHandle: conexao.origemHandle || undefined,
        targetHandle: conexao.destinoHandle || undefined,
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

  // onNodeDragStop (CenaFlowCanvas) chama persistirPosicaoCena sem await/catch
  // — se a escrita falhar (regra de segurança, sessão expirada, rede), a
  // posição arrastada fica só no estado local (já movida por moveCenaLocal)
  // sem nenhum aviso ao mestre. O catch aqui é o único ponto que detecta
  // isso; as demais ações (conectar/editar/remover Cena) seguem o mesmo
  // padrão pelo mesmo motivo.
  const persistirPosicaoCena = useCallback(
    async (cenaId, posicao) => {
      try {
        await updateRmCena(cenaId, { posicaoCanvas: posicao });
      } catch {
        notifyError('Não foi possível salvar a nova posição da cena.');
      }
    },
    [notifyError],
  );

  const createConexao = useCallback(
    async (origemCenaId, destinoCenaId, origemHandle, destinoHandle) => {
      if (!campanha || origemCenaId === destinoCenaId) return;
      const jaExiste = conexoes.some(
        c =>
          c.origemCenaId === origemCenaId && c.destinoCenaId === destinoCenaId,
      );
      if (jaExiste) return;
      try {
        await addRmCenaConexao({
          campanhaId: campanha.id,
          universoId: campanha.universoId,
          mestreId: campanha.mestreId,
          origemCenaId,
          destinoCenaId,
          origemHandle: origemHandle || null,
          destinoHandle: destinoHandle || null,
        });
        await carregar();
      } catch {
        notifyError('Não foi possível criar a conexão entre as cenas.');
      }
    },
    [campanha, conexoes, carregar, notifyError],
  );

  const removeConexao = useCallback(
    async conexaoId => {
      try {
        await removeRmCenaConexao(conexaoId);
        await carregar();
      } catch {
        notifyError('Não foi possível remover a conexão.');
      }
    },
    [carregar, notifyError],
  );

  const updateCena = useCallback(
    async (cenaId, values) => {
      try {
        await updateRmCena(cenaId, values);
        await carregar();
      } catch (error) {
        notifyError('Não foi possível salvar as alterações da cena.');
        throw error;
      }
    },
    [carregar, notifyError],
  );

  const removeCena = useCallback(
    async cenaId => {
      try {
        const conexoesLigadas = conexoes.filter(
          c => c.origemCenaId === cenaId || c.destinoCenaId === cenaId,
        );
        await Promise.all(conexoesLigadas.map(c => removeRmCenaConexao(c.id)));
        await removeRmCena(cenaId);
        setSelectedCenaId(prev => (prev === cenaId ? null : prev));
        await carregar();
      } catch {
        notifyError('Não foi possível remover a cena.');
      }
    },
    [conexoes, carregar, notifyError],
  );

  return {
    cenas,
    conexoes,
    nodes,
    edges,
    loading,
    error,
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
