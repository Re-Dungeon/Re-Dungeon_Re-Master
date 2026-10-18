import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { nomeDaCena } from 'common/utils/grid';

/**
 * Barra de cenas do Grid: uma "aba" por cena (▶ = a cena ativa, a que os
 * jogadores veem), clicar abre a cena só para o mestre; o "⋯" de cada uma
 * mostra/oculta para os jogadores, renomeia, duplica e apaga.
 */
const CenasBarra = ({
  cenas,
  cenaAbertaId,
  cenaAtivaId,
  podeCriar,
  onAbrir,
  onNova,
  onMostrar,
  onRenomear,
  onDuplicar,
  onApagar,
}) => {
  const [menu, setMenu] = useState(null); // { anchorEl, cena }

  const fecharMenu = () => setMenu(null);
  const acao = fn => () => {
    const { cena } = menu;
    fecharMenu();
    fn(cena);
  };
  const menuEhDaAtiva = menu?.cena.id === cenaAtivaId;

  return (
    <Box
      role="toolbar"
      aria-label="Cenas do grid"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        overflowX: 'auto',
        pb: 0.5,
      }}
    >
      {cenas.map(cena => {
        const aberta = cena.id === cenaAbertaId;
        const ativa = cena.id === cenaAtivaId;
        const nome = nomeDaCena(cena);
        return (
          <ButtonGroup
            key={cena.id}
            size="small"
            variant={aberta ? 'contained' : 'outlined'}
            sx={{ flexShrink: 0 }}
          >
            <Button
              aria-pressed={aberta}
              aria-label={ativa ? `${nome} (visível aos jogadores)` : nome}
              startIcon={ativa ? <PlayArrowIcon fontSize="small" /> : null}
              onClick={() => onAbrir(cena.id)}
              sx={{ textTransform: 'none', maxWidth: 220 }}
            >
              <Box
                component="span"
                sx={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {nome}
              </Box>
            </Button>
            <Button
              aria-label={`Opções da cena ${nome}`}
              onClick={event =>
                setMenu({ anchorEl: event.currentTarget, cena })
              }
              sx={{ px: 0.5, minWidth: 0 }}
            >
              <MoreVertIcon fontSize="small" />
            </Button>
          </ButtonGroup>
        );
      })}

      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={onNova}
        disabled={!podeCriar}
        sx={{ flexShrink: 0 }}
      >
        Nova cena
      </Button>

      <Menu anchorEl={menu?.anchorEl} open={Boolean(menu)} onClose={fecharMenu}>
        {menuEhDaAtiva ? (
          <MenuItem onClick={acao(() => onMostrar(null))}>
            Ocultar dos jogadores
          </MenuItem>
        ) : (
          <MenuItem onClick={acao(cena => onMostrar(cena.id))}>
            Mostrar aos jogadores
          </MenuItem>
        )}
        <MenuItem onClick={acao(onRenomear)}>Renomear</MenuItem>
        <MenuItem onClick={acao(onDuplicar)} disabled={!podeCriar}>
          Duplicar
        </MenuItem>
        <MenuItem onClick={acao(onApagar)} disabled={menuEhDaAtiva}>
          <ListItemText
            primary="Apagar"
            secondary={
              menuEhDaAtiva ? 'Mostre outra cena aos jogadores antes' : null
            }
          />
        </MenuItem>
      </Menu>
    </Box>
  );
};

CenasBarra.propTypes = {
  cenas: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      nome: PropTypes.string,
    }),
  ).isRequired,
  cenaAbertaId: PropTypes.string,
  cenaAtivaId: PropTypes.string,
  podeCriar: PropTypes.bool.isRequired,
  onAbrir: PropTypes.func.isRequired,
  onNova: PropTypes.func.isRequired,
  onMostrar: PropTypes.func.isRequired,
  onRenomear: PropTypes.func.isRequired,
  onDuplicar: PropTypes.func.isRequired,
  onApagar: PropTypes.func.isRequired,
};

export default CenasBarra;
