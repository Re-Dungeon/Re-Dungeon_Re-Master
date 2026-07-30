import React from 'react';
import { useLocation } from 'react-router-dom';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import { PAGE_TITLES } from 'common/constants/routes';
import BuscaGlobal from 'components/BuscaGlobal/BuscaGlobal';
import SessionTimers from 'components/SessionTimers/SessionTimers';
import { StyledAppBar, PageTitle } from './styles';

const Header = () => {
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
        <PageTitle variant="h6" id="page-title">
          {title}
        </PageTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <BuscaGlobal />
          <SessionTimers />
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Header;
