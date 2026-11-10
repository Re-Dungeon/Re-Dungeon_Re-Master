import React from 'react';
import { useLocation } from 'react-router-dom';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import PropTypes from 'prop-types';
import { PAGE_TITLES } from 'common/constants/routes';
import BuscaGlobal from 'components/BuscaGlobal/BuscaGlobal';
import SessionTimers from 'components/SessionTimers/SessionTimers';
import { StyledAppBar, PageTitle } from './styles';

// `onMenuClick` só vem no celular (abaixo de 600px): mostra o botão ☰ que abre
// a gaveta com o menu. Em telas maiores a sidebar já está fixa na tela.
const Header = ({ onMenuClick = null }) => {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Re:Master';

  return (
    <StyledAppBar id="remaster-header">
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          minHeight: 'var(--header-height) !important',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          {onMenuClick && (
            <IconButton
              aria-label="Abrir menu"
              onClick={onMenuClick}
              edge="start"
              sx={{ color: 'var(--text-primary)', mr: 0.5 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <PageTitle variant="h6" id="page-title">
            {title}
          </PageTitle>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <BuscaGlobal />
          <SessionTimers />
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

Header.propTypes = {
  onMenuClick: PropTypes.func,
};

export default Header;
