import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';

const StatTile = ({ label, valor }) => (
  <Box
    sx={{
      flex: '1 1 88px',
      minWidth: 80,
      textAlign: 'center',
      p: 1.1,
      background: 'rgba(13, 17, 24, 0.9)',
      border: '1px solid var(--border-primary)',
      borderRadius: 2,
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.02)',
    }}
  >
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        fontWeight: 700,
        mb: 0.35,
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="body1"
      sx={{ color: 'var(--text-primary)', fontWeight: 800, lineHeight: 1.2 }}
    >
      {valor}
    </Typography>
  </Box>
);

StatTile.propTypes = {
  label: PropTypes.string.isRequired,
  valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

const cardBaseSx = {
  background: 'linear-gradient(180deg, rgba(13,18,28,0.94), rgba(11,15,23,0.82))',
  border: '1px solid rgba(148, 163, 184, 0.14)',
  borderRadius: 2.5,
  p: 1.75,
  boxShadow: '0 10px 28px rgba(2,6,23,0.26), inset 0 1px 0 rgba(255,255,255,0.02)',
};

const sectionHeaderSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  color: 'var(--color-accent)',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  fontSize: '0.7rem',
  borderBottom: '1px solid rgba(196, 58, 47, 0.22)',
  pb: 0.8,
  mb: 1.5,
  position: 'relative',
  '&::before': {
    content: '""',
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #fbbf24, #c43a2f)',
    boxShadow: '0 0 0 4px rgba(196,58,47,0.12)',
  },
};

const sectionShellSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  mt: 1.5,
  p: 0,
};

const chipAccentSx = {
  background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'var(--text-primary)',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  fontSize: '0.65rem',
  height: 26,
  borderRadius: '999px',
};

const InfoCard = ({ titulo, valor, tone = 'default', icon = '✦' }) => {
  if (!valor) return null;

  const palette = {
    default: {
      border: 'rgba(148, 163, 184, 0.18)',
      accent: 'var(--color-accent)',
      bg: 'rgba(12, 17, 24, 0.82)',
    },
    success: {
      border: 'rgba(45, 212, 166, 0.22)',
      accent: '#3dd9a5',
      bg: 'rgba(10, 22, 19, 0.82)',
    },
    danger: {
      border: 'rgba(248, 113, 113, 0.22)',
      accent: '#fca5a5',
      bg: 'rgba(28, 15, 16, 0.82)',
    },
    subtle: {
      border: 'rgba(96, 165, 250, 0.2)',
      accent: '#7dd3fc',
      bg: 'rgba(10, 19, 29, 0.82)',
    },
  };

  const colors = palette[tone] || palette.default;

  return (
    <Box
      sx={{
        ...cardBaseSx,
        background: colors.bg,
        borderColor: colors.border,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        minHeight: 148,
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-1px)',
          borderColor: colors.accent,
          boxShadow: '0 14px 32px rgba(2,6,23,0.32)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: 1.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)',
            color: colors.accent,
            fontSize: '0.72rem',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {icon}
        </Box>
        <Typography
          sx={{
            color: colors.accent,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontSize: '0.62rem',
          }}
        >
          {titulo}
        </Typography>
      </Box>

      <Typography
        variant="body1"
        sx={{
          color: 'var(--text-primary)',
          whiteSpace: 'pre-line',
          lineHeight: 1.75,
          fontSize: '0.96rem',
        }}
      >
        {valor}
      </Typography>
    </Box>
  );
};

InfoCard.propTypes = {
  titulo: PropTypes.string.isRequired,
  valor: PropTypes.string,
  tone: PropTypes.oneOf(['default', 'success', 'danger', 'subtle']),
  icon: PropTypes.string,
};

InfoCard.defaultProps = {
  valor: null,
  tone: 'default',
  icon: '✦',
};

/**
 * Corpo de exibição de uma carta do `cardflux` (imagem, stats, tags e as
 * seções de texto) — reaproveitado pela modal de detalhes (CartaDetalheDialog)
 * e pelo painel "Carta Sorteada" da tela de Sorteio, para mostrar sempre as
 * mesmas informações nos dois lugares.
 */
const CartaDetalhe = ({ carta, hideCoverImage = false, hideTags = false }) => {
  const tags = (carta?.tags ?? '')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
  const tipoELabel = [carta?.tipo, carta?.raridade].filter(Boolean);
  const temStats =
    carta?.deck ||
    Number.isFinite(carta?.peso) ||
    Number.isFinite(carta?.cd) ||
    Number.isFinite(carta?.intensidade);

  return (
    <Box>
      {carta?.nome && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h4"
            sx={{
              color: 'var(--text-primary)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              fontSize: { xs: '1.9rem', sm: '2.4rem' },
            }}
          >
            {carta.nome}
          </Typography>
        </Box>
      )}

      {!hideCoverImage && carta?.linkImagem && (
        <Box
          component="img"
          src={carta.linkImagem}
          alt={carta.nome}
          loading="lazy"
          sx={{
            width: '100%',
            height: 220,
            borderRadius: 2.5,
            objectFit: 'cover',
            display: 'block',
            border: '1px solid var(--border-primary)',
            mb: 2,
            boxShadow: '0 12px 30px rgba(0,0,0,0.22)',
          }}
          onError={e => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      {!hideTags && (tipoELabel.length > 0 || tags.length > 0) && (
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
          {[...tipoELabel, ...tags].map(token => (
            <Chip
              key={token}
              label={token}
              size="small"
              sx={{
                ...chipAccentSx,
                background: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.12)',
                color: 'var(--text-primary)',
              }}
            />
          ))}
        </Box>
      )}

      {temStats && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(2, minmax(0, 1fr))',
              sm: 'repeat(4, minmax(0, 1fr))',
            },
            gap: 1,
            mb: 2,
          }}
        >
          {carta.deck && <StatTile label="Deck" valor={carta.deck} />}
          {Number.isFinite(carta.peso) && (
            <StatTile label="Peso" valor={carta.peso} />
          )}
          {Number.isFinite(carta.cd) && (
            <StatTile label="CD" valor={carta.cd} />
          )}
          {Number.isFinite(carta.intensidade) && (
            <StatTile label="Intensidade" valor={carta.intensidade} />
          )}
        </Box>
      )}

      {(carta?.descricaoGeral ||
        carta?.comoApresentar ||
        carta?.mecanicasDesafios) && (
        <Box sx={sectionShellSx}>
          <Typography sx={sectionHeaderSx}>Narrativa</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                lg: '1.5fr 1fr',
              },
              gap: 2,
            }}
          >
            {carta.descricaoGeral && (
              <InfoCard
                titulo="Descrição Geral"
                valor={carta.descricaoGeral}
                tone="default"
                icon="✦"
              />
            )}
            {carta.comoApresentar && (
              <InfoCard
                titulo="Como Apresentar"
                valor={carta.comoApresentar}
                tone="subtle"
                icon="◌"
              />
            )}
          </Box>

          {carta.mecanicasDesafios && (
            <InfoCard
              titulo="Mecânicas / Desafios"
              valor={carta.mecanicasDesafios}
              tone="default"
              icon="✧"
            />
          )}
        </Box>
      )}

      {(carta?.seConseguirem || carta?.seFalharem) && (
        <Box sx={sectionShellSx}>
          <Typography sx={sectionHeaderSx}>Resultados</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            {carta.seConseguirem && (
              <InfoCard
                titulo="Se Conseguirem"
                valor={carta.seConseguirem}
                tone="success"
                icon="✓"
              />
            )}
            {carta.seFalharem && (
              <InfoCard
                titulo="Se Falharem"
                valor={carta.seFalharem}
                tone="danger"
                icon="!"
              />
            )}
          </Box>
        </Box>
      )}

      {(carta?.recompensas ||
        carta?.impactoMundo ||
        carta?.ganchosNarrativos) && (
        <Box sx={sectionShellSx}>
          <Typography sx={sectionHeaderSx}>Consequências</Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(3, minmax(0, 1fr))',
              },
              gap: 2,
            }}
          >
            {carta.recompensas && (
              <InfoCard
                titulo="Recompensas"
                valor={carta.recompensas}
                tone="success"
                icon="✦"
              />
            )}
            {carta.impactoMundo && (
              <InfoCard
                titulo="Impacto no Mundo"
                valor={carta.impactoMundo}
                tone="subtle"
                icon="◈"
              />
            )}
            {carta.ganchosNarrativos && (
              <InfoCard
                titulo="Ganchos Narrativos"
                valor={carta.ganchosNarrativos}
                tone="default"
                icon="↺"
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

CartaDetalhe.propTypes = {
  carta: PropTypes.shape({
    nome: PropTypes.string,
    tipo: PropTypes.string,
    raridade: PropTypes.string,
    deck: PropTypes.string,
    peso: PropTypes.number,
    cd: PropTypes.number,
    intensidade: PropTypes.number,
    tags: PropTypes.string,
    linkImagem: PropTypes.string,
    descricaoGeral: PropTypes.string,
    comoApresentar: PropTypes.string,
    mecanicasDesafios: PropTypes.string,
    seConseguirem: PropTypes.string,
    seFalharem: PropTypes.string,
    recompensas: PropTypes.string,
    impactoMundo: PropTypes.string,
    ganchosNarrativos: PropTypes.string,
  }),
  hideCoverImage: PropTypes.bool,
  hideTags: PropTypes.bool,
};

CartaDetalhe.defaultProps = {
  carta: null,
  hideCoverImage: false,
  hideTags: false,
};

export default CartaDetalhe;
