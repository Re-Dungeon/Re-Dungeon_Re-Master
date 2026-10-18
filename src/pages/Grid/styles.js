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

export const painelCabecalhoSx = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 1,
};
