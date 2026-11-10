// Celular (abaixo de 600px): o único breakpoint de celular do app.
export const MOBILE_QUERY = '@media (max-width: 599.95px)';
export const MOBILE_MEDIA = '(max-width: 599.95px)';

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
  // No celular os painéis viram folha na base (painelLadoSx) e a faixa fica livre.
};

// Painel de um lado do mapa (`lado` = 'left' | 'right'). A partir de 600px é
// o cartão flutuante de 300px de sempre; no celular vira uma folha na base do
// mapa, de ponta a ponta (a faixa de iniciativa fica livre no topo). O bloco do
// celular entra por último de propósito, para vencer o `left/right: 12`.
export const painelLadoSx = (lado, abaixoDaFaixa = false) => {
  const sx = { ...painelSx, [lado]: 12 };
  if (abaixoDaFaixa) {
    sx.top = painelAbaixoDaFaixaSx.top;
    sx.maxHeight = painelAbaixoDaFaixaSx.maxHeight;
  }
  sx[MOBILE_QUERY] = {
    top: 'auto',
    bottom: 0,
    left: 0,
    right: 0,
    width: 'auto',
    maxWidth: 'none',
    maxHeight: '55%',
    borderRadius: '16px 16px 0 0',
  };
  return sx;
};

// O mesmo painel recolhido numa barrinha (título + expandir), no mesmo lado e
// na mesma altura. No celular fica de ponta a ponta na base do mapa.
export const painelMinimizadoSx = (lado, abaixoDaFaixa = false) => ({
  position: 'absolute',
  top: abaixoDaFaixa ? painelAbaixoDaFaixaSx.top : painelSx.top,
  [lado]: 12,
  zIndex: painelSx.zIndex,
  width: 220,
  maxWidth: 'calc(100% - 24px)',
  borderRadius: 2,
  background: painelSx.background,
  border: painelSx.border,
  boxShadow: painelSx.boxShadow,
  [MOBILE_QUERY]: {
    top: 'auto',
    bottom: 0,
    left: 0,
    right: 0,
    width: 'auto',
    maxWidth: 'none',
    borderRadius: '16px 16px 0 0',
  },
});

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
