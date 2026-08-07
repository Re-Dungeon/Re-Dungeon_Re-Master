import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  applyNodeChanges,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CenaNode from './CenaNode';
import CenaEdge from './CenaEdge';

const NODE_TYPES = { cenaNode: CenaNode };
const EDGE_TYPES = { cenaEdge: CenaEdge };

const getHandleColor = (nodeHandleTypes, edge) => {
  const sourceTypes = nodeHandleTypes[edge.source] ?? {};
  const sourceType = sourceTypes[edge.sourceHandle];
  if (sourceType === 'entrada') return '#60A5FA';
  if (sourceType === 'saida') return '#FB923C';
  return 'var(--color-accent)';
};

const CenaFlowCanvas = ({
  nodes,
  edges,
  podeEscrever,
  onNodePositionChange,
  onNodeDragStop,
  onNodeClick,
  onConnect,
  onNovaCena,
  onRemoveConexao = () => {},
  height = '70vh',
  compact = false,
}) => {
  const [localNodes, setLocalNodes] = useState(nodes);
  const [nodeHandleTypes, setNodeHandleTypes] = useState({});

  useEffect(() => {
    // Sync local drag state when nodes are updated from props.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalNodes(nodes);
  }, [nodes]);

  const handleSetNodeHandleType = useCallback((nodeId, handleId, type) => {
    setNodeHandleTypes(prev => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [handleId]: type,
      },
    }));
  }, []);

  const renderedNodes = useMemo(
    () =>
      localNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          handleTypes: nodeHandleTypes[node.id] ?? {},
          onChangeHandleType: (handleId, type) =>
            handleSetNodeHandleType(node.id, handleId, type),
        },
      })),
    [localNodes, nodeHandleTypes, handleSetNodeHandleType],
  );

  const handleNodesChange = useCallback(
    changes => {
      setLocalNodes(currentNodes => applyNodeChanges(changes, currentNodes));
    },
    [],
  );

  const handleNodeDragStop = useCallback(
    (event, node) => {
      onNodePositionChange(node.id, node.position);
      onNodeDragStop(node.id, node.position);
    },
    [onNodeDragStop, onNodePositionChange],
  );

  const handleNodeClick = useCallback(
    (event, node) => onNodeClick(node.id),
    [onNodeClick],
  );

  const handleConnect = useCallback(
    params =>
      onConnect(
        params.source,
        params.target,
        params.sourceHandle,
        params.targetHandle,
      ),
    [onConnect],
  );

  const nodeColor = useMemo(() => n => n.data?.cor ?? '#6b7280', []);

  const edgesComData = useMemo(
    () =>
      edges.map(edge => {
        const stroke = getHandleColor(nodeHandleTypes, edge);
        return {
          ...edge,
          type: 'cenaEdge',
          style: {
            ...edge.style,
            stroke,
          },
          markerEnd: { type: 'arrowclosed', color: stroke },
          data: { podeEscrever, onDelete: onRemoveConexao },
        };
      }),
    [edges, nodeHandleTypes, podeEscrever, onRemoveConexao],
  );

  return (
    <Box
      sx={{
        height,
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 3,
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(6, 10, 18, 0.95), rgba(14, 18, 28, 0.98))',
        boxShadow: '0 26px 56px rgba(0,0,0,0.26)',
        position: 'relative',
        '& .react-flow__pane': {
          transition: 'transform 220ms ease',
        },
        '& .react-flow__controls': {
          background: 'rgba(10, 14, 22, 0.94)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 18px 36px rgba(0,0,0,0.24)',
        },
        '& .react-flow__controls-button': {
          width: 38,
          height: 38,
          background: 'rgba(255,255,255,0.05)',
          border: 'none',
          color: 'var(--text-primary)',
          fill: 'var(--text-primary)',
          '&:hover': {
            background: 'rgba(255,255,255,0.1)',
          },
          '&.react-flow__controls-button--zoom-in, &.react-flow__controls-button--zoom-out': {
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          },
        },
        '& .react-flow__minimap': {
          background: 'rgba(10, 14, 22, 0.94) !important',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18,
          overflow: 'hidden',
          boxShadow: '0 18px 36px rgba(0,0,0,0.24)',
        },
        '& .react-flow__minimap-mask': {
          fill: 'rgba(0,0,0,0.54)',
        },
        '& .react-flow__attribution': {
          background: 'transparent',
          color: 'var(--text-muted)',
        },
        '& .react-flow__handle': {
          opacity: 0.76,
          transition: 'transform 180ms ease, opacity 180ms ease, background 180ms ease, border-color 180ms ease',
          '&:hover': {
            transform: 'scale(1.18)',
            opacity: 1,
            background: 'rgba(196,58,47,0.95)',
            borderColor: 'rgba(255,255,255,0.28)',
          },
        },
      }}
    >
      <ReactFlow
        nodes={renderedNodes}
        edges={edgesComData}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        onNodesChange={handleNodesChange}
        onEdgesChange={() => {}}
        onNodeDragStop={handleNodeDragStop}
        onNodeClick={handleNodeClick}
        onConnect={podeEscrever ? handleConnect : undefined}
        nodesDraggable={podeEscrever}
        nodesConnectable={podeEscrever}
        elementsSelectable
        zoomOnScroll={!compact}
        panOnScroll={false}
        fitView
      >
        <Background
          variant="lines"
          gap={24}
          size={1}
          color="rgba(255,255,255,0.06)"
        />
        {!compact && <Controls />}
        {!compact && (
          <MiniMap
            nodeColor={nodeColor}
            nodeStrokeColor={() => 'rgba(255,255,255,0.85)'}
            nodeBorderRadius={6}
            maskColor="rgba(0, 0, 0, 0.55)"
            style={{ opacity: 0.96 }}
          />
        )}
        {podeEscrever && (
          <Panel position="top-right">
            <Button
              variant="contained"
              onClick={onNovaCena}
              sx={{
                background: 'linear-gradient(135deg, rgba(143,35,28,1), rgba(196,58,47,1))',
                color: '#FFFFFF',
                boxShadow: '0 16px 32px rgba(196,58,47,0.24)',
                textTransform: 'none',
                fontWeight: 700,
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(196,58,47,1), rgba(143,35,28,1))',
                },
              }}
            >
              + Nova Cena
            </Button>
          </Panel>
        )}
      </ReactFlow>
    </Box>
  );
};

CenaFlowCanvas.propTypes = {
  nodes: PropTypes.array.isRequired,
  edges: PropTypes.array.isRequired,
  podeEscrever: PropTypes.bool.isRequired,
  onNodeDragStop: PropTypes.func.isRequired,
  onNodeClick: PropTypes.func.isRequired,
  onConnect: PropTypes.func.isRequired,
  onNovaCena: PropTypes.func.isRequired,
  onRemoveConexao: PropTypes.func,
  onNodePositionChange: PropTypes.func.isRequired,
  height: PropTypes.string,
  compact: PropTypes.bool,
};

export default CenaFlowCanvas;
