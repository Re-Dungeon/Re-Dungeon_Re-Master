// Painéis flutuantes sobre o mapa (token selecionado / configuração do grid).
export const painelSx = {
  position: 'absolute',
  top: 12,
  zIndex: 40,
  width: 300,
  maxWidth: 'calc(100% - 24px)',
  maxHeight: 'calc(100% - 80px)',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 1.5,
  p: 2,
  borderRadius: 2,
  background: 'rgba(16, 14, 28, 0.96)',
  border: '1px solid var(--border-primary)',
  boxShadow: 'var(--shadow-md)',
};

// Com a faixa de iniciativa no topo do mapa (combate em andamento), os painéis
// descem para não cobri-la.
export const painelAbaixoDaFaixaSx = {
  top: 92,
  maxHeight: 'calc(100% - 160px)',
  // No celular os botões da faixa quebram para uma segunda linha.
  '@media (max-width: 599.95px)': { top: 150, maxHeight: 'calc(100% - 220px)' },
};

export const painelCabecalhoSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
};

// Listas dos diálogos de combate (Iniciar combate / Participantes).
export const listaParticipantesSx = {
  listStyle: 'none',
  m: 0,
  p: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
};

export const linhaParticipanteSx = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 1,
  px: 1,
  py: 0.25,
  borderRadius: 2,
  border: '1px solid var(--border-primary)',
  background: 'var(--bg-card)',
};

export const nomeParticipanteSx = {
  flex: 1,
  minWidth: 0,
  overflowWrap: 'anywhere',
  color: 'var(--text-primary)',
};
