import React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import {
  resolverValorAtributoPrimario,
  resolverValorAtributoSecundario,
} from 'common/utils/atributosPersonagem';

const cardSx = {
  p: 2.5,
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 2.5,
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.18)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  transition:
    'transform 220ms ease, border-color 220ms ease, box-shadow 220ms ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: 'var(--border-hover)',
    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.24)',
  },
};

const atributoBoxSx = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0.25,
  alignItems: 'center',
  p: 0.9,
  borderRadius: 1.5,
  background: 'rgba(111, 45, 168, 0.14)',
  border: '1px solid rgba(111, 45, 168, 0.2)',
};

const atributosGridSx = {
  display: 'grid',
  gridTemplateColumns: {
    xs: 'repeat(3, minmax(0, 1fr))',
    md: 'repeat(6, minmax(0, 1fr))',
  },
  gap: 0.75,
  mb: 2,
};

const seloCloneTextoSx = {
  color: 'var(--color-accent)',
  display: 'block',
  mb: 1.5,
  fontWeight: 600,
};

// Card compartilhado por NPCs, Criaturas e Jogadores (páginas que listam
// `personagens` do Re-Dungeon vinculados à campanha ativa). As três telas
// divergem em detalhes pontuais — se oferecem "Clonar", se mostram descrição,
// e em qual forma exibem o aviso de clone — por isso esses comportamentos
// são controlados via props em vez de hardcoded aqui.
const PersonagemCard = ({
  personagem,
  clone,
  podeEscrever,
  atributosPrimarios,
  atributosSecundarios,
  onVisualizar,
  onClonar,
  onEditarClone,
  onRemoverClone,
  exibirDescricao,
  seloCloneTopo,
  seloCloneBadge,
  seloCloneRodape,
}) => (
  <Paper elevation={0} sx={cardSx}>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        mb: 1.5,
        gap: 1,
      }}
    >
      <Typography
        variant="h6"
        sx={{ color: 'var(--text-primary)', fontWeight: 700 }}
      >
        {personagem.nome}
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
        <IconButton
          size="small"
          onClick={() => onVisualizar(personagem)}
          sx={{ color: 'var(--color-accent)' }}
          aria-label={`Ver ficha de ${personagem.nome}`}
        >
          <VisibilityOutlinedIcon fontSize="small" />
        </IconButton>
        {podeEscrever && !clone && onClonar && (
          <IconButton
            size="small"
            onClick={() => onClonar(personagem)}
            sx={{ color: 'var(--color-accent)' }}
            aria-label={`Clonar ${personagem.nome}`}
          >
            <ContentCopyOutlinedIcon fontSize="small" />
          </IconButton>
        )}
        {podeEscrever && clone && (
          <>
            <IconButton
              size="small"
              onClick={() => onEditarClone(personagem, clone)}
              sx={{ color: 'var(--color-accent)' }}
              aria-label={`Editar clone de ${personagem.nome}`}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onRemoverClone(clone)}
              sx={{ color: '#ef4444' }}
              aria-label={`Remover clone de ${personagem.nome}`}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </>
        )}
      </Box>
    </Box>

    {clone && seloCloneTopo && (
      <Typography variant="caption" sx={{ ...seloCloneTextoSx, mb: 1 }}>
        Clonado nesta campanha
      </Typography>
    )}

    <Box
      sx={{
        width: '100%',
        height: 180,
        borderRadius: 2,
        border: '1px solid var(--border-primary)',
        background: 'var(--bg-secondary)',
        overflow: 'hidden',
        mb: 1.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {personagem.linkImagem ? (
        <Box
          component="img"
          src={personagem.linkImagem}
          alt={personagem.nome}
          loading="lazy"
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
          onError={e => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.75,
            color: 'var(--text-muted)',
          }}
        >
          <ImageOutlinedIcon sx={{ fontSize: 30 }} />
          <Typography variant="caption">Sem imagem</Typography>
        </Box>
      )}

      {clone && seloCloneBadge && (
        <Box
          component="img"
          src="https://i.imgur.com/9jaRlGw.png"
          alt="Clonado nesta campanha"
          sx={{
            position: 'absolute',
            right: -8,
            bottom: -8,
            width: 60,
            height: 60,
            objectFit: 'contain',
            pointerEvents: 'none',
            filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.4))',
          }}
        />
      )}
    </Box>

    <Box sx={atributosGridSx}>
      {atributosPrimarios.map(({ label, aliases, icon: Icon }) => {
        const valor = resolverValorAtributoPrimario(personagem, aliases);
        return (
          <Box key={label} sx={atributoBoxSx}>
            <Icon sx={{ fontSize: 16, color: 'var(--color-accent)' }} />
            <Typography
              variant="caption"
              sx={{ color: 'var(--text-muted)', fontWeight: 700 }}
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
      })}
    </Box>

    <Box sx={atributosGridSx}>
      {atributosSecundarios.map(({ label, aliases }) => {
        const valor = resolverValorAtributoSecundario(personagem, aliases);
        return (
          <Box key={label} sx={atributoBoxSx}>
            <Typography
              variant="caption"
              sx={{ color: 'var(--text-muted)', fontWeight: 700 }}
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
      })}
    </Box>

    {exibirDescricao && personagem.descricao && (
      <Typography
        variant="body2"
        sx={{ color: 'var(--text-secondary)', mb: 1.5 }}
      >
        {personagem.descricao}
      </Typography>
    )}

    {clone && seloCloneRodape && (
      <Typography variant="caption" sx={seloCloneTextoSx}>
        Clonado nesta campanha
      </Typography>
    )}
  </Paper>
);

PersonagemCard.propTypes = {
  personagem: PropTypes.shape({
    id: PropTypes.string,
    nome: PropTypes.string.isRequired,
    linkImagem: PropTypes.string,
    descricao: PropTypes.string,
  }).isRequired,
  clone: PropTypes.shape({ id: PropTypes.string }),
  podeEscrever: PropTypes.bool,
  atributosPrimarios: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      aliases: PropTypes.arrayOf(PropTypes.string).isRequired,
      icon: PropTypes.elementType.isRequired,
    }),
  ).isRequired,
  atributosSecundarios: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      aliases: PropTypes.arrayOf(PropTypes.string).isRequired,
    }),
  ).isRequired,
  onVisualizar: PropTypes.func.isRequired,
  onClonar: PropTypes.func,
  onEditarClone: PropTypes.func.isRequired,
  onRemoverClone: PropTypes.func.isRequired,
  exibirDescricao: PropTypes.bool,
  seloCloneTopo: PropTypes.bool,
  seloCloneBadge: PropTypes.bool,
  seloCloneRodape: PropTypes.bool,
};

PersonagemCard.defaultProps = {
  clone: null,
  podeEscrever: false,
  onClonar: null,
  exibirDescricao: false,
  seloCloneTopo: false,
  seloCloneBadge: false,
  seloCloneRodape: false,
};

export default PersonagemCard;
