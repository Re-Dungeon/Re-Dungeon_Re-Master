import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
// DialogContent not used; using StyledDialogContent from styles
import Grow from '@mui/material/Grow';
import {
  StyledDialogContent,
  ModalHeader,
  ModalTitle,
  ModalSubtitle,
  CardsGrid,
  ResourceCard,
  ResourceCardImage,
  ResourceCardContent,
  ResourceCardTitle,
  ResourceCardDescription,
  ResourceCardButton,
  ModalFooter,
} from './styles';

const RESOURCE_CARDS = [
  {
    title: 'Ficha de Jogador',
    description:
      'Acesse o sistema oficial de fichas dos jogadores para visualizar, editar e acompanhar a evolução dos personagens.',
    image: 'https://i.imgur.com/KtYkuQP.png',
    href: 'https://re-dungeon.github.io/Ficha-RPG---Re-Dungeon-/login',
  },
  {
    title: 'Banco de Dados',
    description:
      'Consulte itens, criaturas, equipamentos, magias, materiais, regiões e todo o conteúdo oficial do universo Re:Dungeon.',
    image: 'https://i.imgur.com/GdBanRI.png',
    href: 'https://re-dungeon.github.io/Banco-de-Dados---ReDungeon/',
  },
];

const ResourceCenterModal = ({ open, onClose }) => {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (open && closeButtonRef.current && typeof closeButtonRef.current.focus === 'function') {
      closeButtonRef.current.focus();
    }
  }, [open]);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="resource-center-title"
      maxWidth="md"
      fullWidth
      slots={{ transition: Grow }}
      slotProps={{
        transition: { timeout: 250 },
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
          },
        },
        paper: {
          sx: {
            background: '#15171d',
            border: '1px solid rgba(196, 58, 47, 0.22)',
            borderRadius: '18px',
            width: 'min(760px, calc(100vw - 32px))',
            maxWidth: 760,
            margin: '24px',
            boxShadow: '0 30px 90px rgba(0, 0, 0, 0.55)',
            overflow: 'hidden',
          },
        },
      }}
    >
      <StyledDialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Fechar central de recursos"
            size="small"
            sx={{
              color: 'var(--text-muted)',
              '&:hover': { color: 'var(--text-primary)' },
            }}
          >
            ✕
          </IconButton>
        </Box>

        <ModalHeader>
          <Typography sx={{ fontSize: 32, lineHeight: 1, mr: 1 }}>📚</Typography>
          <Box>
            <ModalTitle id="resource-center-title">Central de Recursos</ModalTitle>
            <ModalSubtitle>
              Acesse rapidamente as ferramentas oficiais utilizadas nesta campanha.
            </ModalSubtitle>
          </Box>
        </ModalHeader>

        <CardsGrid>
          {RESOURCE_CARDS.map(card => (
            <ResourceCard key={card.title}>
              <ResourceCardImage
                component="img"
                src={card.image}
                alt={card.title}
                loading="lazy"
              />
              <ResourceCardContent>
                <ResourceCardTitle>{card.title}</ResourceCardTitle>
                <ResourceCardDescription>{card.description}</ResourceCardDescription>
                <Box sx={{ flex: 1 }} />
                <ResourceCardButton
                  component="a"
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Acessar ${card.title}`}
                >
                  Acessar
                </ResourceCardButton>
              </ResourceCardContent>
            </ResourceCard>
          ))}
        </CardsGrid>

        <ModalFooter>Ferramentas oficiais do universo Re:Dungeon.</ModalFooter>
      </StyledDialogContent>
    </Dialog>
  );
};

ResourceCenterModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default ResourceCenterModal;
