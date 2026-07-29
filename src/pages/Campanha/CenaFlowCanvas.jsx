import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { ReactFlow, Background, Controls, MiniMap, Panel } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CenaNode from './CenaNode';

const NODE_TYPES = { cenaNode: CenaNode };

const CenaFlowCanvas = ({
  nodes,
  edges,
  podeEscrever,
  onNodePositionChange,
  onNodeDragStop,
  onNodeClick,
  onConnect,
  onNovaCena,
  height = '70vh',
  compact = false,
}) => {
  const handleNodesChange = useCallback(
    changes => {
      changes.forEach(change => {
        if (change.type === 'position' && change.position) {
          onNodePositionChange(change.id, change.position);
        }
      });
    },
    [onNodePositionChange],
  );

  const handleNodeDragStop = useCallback(
    (event, node) => onNodeDragStop(node.id, node.position),
    [onNodeDragStop],
  );

  const handleNodeClick = useCallback(
    (event, node) => onNodeClick(node.id),
    [onNodeClick],
  );

  const handleConnect = useCallback(
    params => onConnect(params.source, params.target),
    [onConnect],
  );

  const nodeColor = useMemo(() => n => n.data?.cor ?? '#6b7280', []);

  return (
    <Box
      sx={{
        height,
        border: '1px solid var(--border-primary)',
        borderRadius: 2,
        overflow: 'hidden',
        background: 'var(--bg-secondary)',

        '& .react-flow__controls': {
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)',
        },
        '& .react-flow__controls-button': {
          background: 'var(--bg-card)',
          border: 'none',
          borderBottom: '1px solid var(--border-primary)',
          fill: 'var(--text-primary)',
          color: 'var(--text-primary)',
          '&:hover': {
            background: 'var(--bg-secondary)',
          },
        },
        '& .react-flow__minimap': {
          background: 'var(--bg-card) !important',
          border: '1px solid var(--border-primary)',
          borderRadius: 1,
          overflow: 'hidden',
        },
        '& .react-flow__minimap-mask': {
          fill: 'rgba(5, 8, 22, 0.6)',
        },
        '& .react-flow__attribution': {
          background: 'transparent',
          color: 'var(--text-muted)',
        },
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
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
        <Background />
        {!compact && <Controls />}
        {!compact && <MiniMap nodeColor={nodeColor} />}
        {podeEscrever && (
          <Panel position="top-right">
            <Button
              variant="contained"
              onClick={onNovaCena}
              sx={{
                background: 'var(--color-primary)',
                '&:hover': { background: '#5a2090' },
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
  onNodePositionChange: PropTypes.func.isRequired,
  onNodeDragStop: PropTypes.func.isRequired,
  onNodeClick: PropTypes.func.isRequired,
  onConnect: PropTypes.func.isRequired,
  onNovaCena: PropTypes.func.isRequired,
  height: PropTypes.string,
  compact: PropTypes.bool,
};

export default CenaFlowCanvas;
