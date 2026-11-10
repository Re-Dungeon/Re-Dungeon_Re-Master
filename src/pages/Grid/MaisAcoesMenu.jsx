import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';

/**
 * Menu "Mais" da barra do Grid no celular (abaixo de 600px): guarda as ações
 * secundárias que não cabem na barra. Cada item: { chave, rotulo, onClick,
 * disabled?, selecionado?, separador? } — `separador` põe uma linha antes do
 * item. Escolher um item fecha o menu.
 */
const MaisAcoesMenu = ({ itens }) => {
  const [ancora, setAncora] = useState(null);
  const fechar = () => setAncora(null);

  return (
    <>
      <IconButton
        aria-label="Mais ações"
        aria-haspopup="menu"
        aria-expanded={Boolean(ancora)}
        onClick={event => setAncora(event.currentTarget)}
      >
        <MoreVertIcon />
      </IconButton>
      <Menu anchorEl={ancora} open={Boolean(ancora)} onClose={fechar}>
        {itens.flatMap(item => [
          item.separador ? <Divider key={`${item.chave}-sep`} /> : null,
          <MenuItem
            key={item.chave}
            selected={Boolean(item.selecionado)}
            disabled={Boolean(item.disabled)}
            onClick={() => {
              fechar();
              item.onClick();
            }}
          >
            {item.rotulo}
          </MenuItem>,
        ])}
      </Menu>
    </>
  );
};

MaisAcoesMenu.propTypes = {
  itens: PropTypes.arrayOf(
    PropTypes.shape({
      chave: PropTypes.string.isRequired,
      rotulo: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      disabled: PropTypes.bool,
      selecionado: PropTypes.bool,
      separador: PropTypes.bool,
    }),
  ).isRequired,
};

export default MaisAcoesMenu;
