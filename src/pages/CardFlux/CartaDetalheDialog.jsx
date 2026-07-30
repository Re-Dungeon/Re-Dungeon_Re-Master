import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import SectionTitle from 'components/SectionTitle/SectionTitle';

const secaoSx = {
  color: 'var(--color-accent)',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 1,
  fontSize: '0.8rem',
  borderBottom: '1px solid var(--border-primary)',
  pb: 0.5,
  mt: 2.5,
  mb: 1.5,
};

const StatTile = ({ label, valor }) => (
  <Box
    sx={{
      flex: '1 1 70px',
      textAlign: 'center',
      p: 1,
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 1.5,
    }}
  >
    <Typography
      variant="caption"
      sx={{
        display: 'block',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
      }}
    >
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{ color: 'var(--text-primary)', fontWeight: 700 }}
    >
      {valor}
    </Typography>
  </Box>
);

StatTile.propTypes = {
  label: PropTypes.string.isRequired,
  valor: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

const Campo = ({ label, valor }) =>
  valor ? (
    <Box sx={{ mb: 1.5 }}>
      <SectionTitle>{label}</SectionTitle>
      <Typography
        variant="body2"
        sx={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}
      >
        {valor}
      </Typography>
    </Box>
  ) : null;

Campo.propTypes = {
  label: PropTypes.string.isRequired,
  valor: PropTypes.string,
};

Campo.defaultProps = {
  valor: null,
};

/**
 * Visualização completa de uma carta do `cardflux` — usada no resultado do
 * "Puxar Carta" do CardFlux. As cartas vêm prontas do projeto irmão, então
 * este dialog só exibe os campos do doc (sem formulário/edição).
 */
const CartaDetalheDialog = ({ open, onClose, carta }) => {
  const tags = (carta?.tags ?? '')
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean);
  const temStats =
    carta?.deck ||
    Number.isFinite(carta?.peso) ||
    Number.isFinite(carta?.cd) ||
    Number.isFinite(carta?.intensidade);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          background: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{ color: 'var(--text-primary)', fontWeight: 700, pb: 1 }}
      >
        {carta?.nome}
        {(carta?.tipo || carta?.raridade) && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'var(--color-accent)',
              fontWeight: 600,
              mt: 0.5,
            }}
          >
            {[carta.tipo, carta.raridade].filter(Boolean).join(' · ')}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: 'var(--border-primary)' }}>
        {carta?.linkImagem && (
          <Box
            component="img"
            src={carta.linkImagem}
            alt={carta.nome}
            loading="lazy"
            sx={{
              width: '100%',
              height: 200,
              borderRadius: 2,
              objectFit: 'cover',
              display: 'block',
              border: '1px solid var(--border-primary)',
              mb: 2,
            }}
            onError={e => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {temStats && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
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

        {tags.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
            {tags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-secondary)',
                }}
              />
            ))}
          </Box>
        )}

        {(carta?.descricaoGeral ||
          carta?.comoApresentar ||
          carta?.mecanicasDesafios) && (
          <>
            <Typography sx={secaoSx}>Narrativa</Typography>
            <Campo label="Descrição Geral" valor={carta.descricaoGeral} />
            <Campo label="Como Apresentar" valor={carta.comoApresentar} />
            <Campo label="Mecânicas/Desafios" valor={carta.mecanicasDesafios} />
          </>
        )}

        {(carta?.seConseguirem || carta?.seFalharem) && (
          <>
            <Typography sx={secaoSx}>Resultados</Typography>
            <Campo label="Se Conseguirem" valor={carta.seConseguirem} />
            <Campo label="Se Falharem" valor={carta.seFalharem} />
          </>
        )}

        {(carta?.recompensas ||
          carta?.impactoMundo ||
          carta?.ganchosNarrativos) && (
          <>
            <Typography sx={secaoSx}>Consequências</Typography>
            <Campo label="Recompensas" valor={carta.recompensas} />
            <Campo label="Impacto no Mundo" valor={carta.impactoMundo} />
            <Campo label="Ganchos Narrativos" valor={carta.ganchosNarrativos} />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: 'var(--text-secondary)',
            '&:hover': { color: 'var(--text-primary)' },
          }}
        >
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

CartaDetalheDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
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
};

CartaDetalheDialog.defaultProps = {
  carta: null,
};

export default CartaDetalheDialog;
