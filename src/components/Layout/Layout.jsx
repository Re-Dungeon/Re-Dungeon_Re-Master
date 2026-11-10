import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { MOBILE_MEDIA } from 'common/styles/breakpoints';
import Sidebar from 'components/Sidebar/Sidebar';
import Header from 'components/Header/Header';
import { AppContainer, MainWrapper, ContentWrapper } from './styles';

const PAPER_GAVETA_SX = {
  width: 'min(var(--sidebar-width), 85vw)',
  background: 'transparent',
  boxShadow: 'none',
};

const Layout = () => {
  const location = useLocation();
  const celular = useMediaQuery(MOBILE_MEDIA);
  // A gaveta guarda em qual navegação foi aberta: ao mudar de `location` ela
  // deixa de estar aberta sozinha (sem efeito para fechar).
  const [gavetaAbertaEm, setGavetaAbertaEm] = useState(null);
  const gavetaAberta = celular && gavetaAbertaEm === location.key;

  return (
    <AppContainer className="remaster-container">
      {celular ? (
        <Drawer
          open={gavetaAberta}
          onClose={() => setGavetaAbertaEm(null)}
          slotProps={{ paper: { sx: PAPER_GAVETA_SX } }}
        >
          <Sidebar />
        </Drawer>
      ) : (
        <Sidebar />
      )}
      <MainWrapper className="remaster-main" id="remaster-main">
        <Header
          onMenuClick={celular ? () => setGavetaAbertaEm(location.key) : null}
        />
        <ContentWrapper className="remaster-content" id="remaster-content">
          <Outlet />
        </ContentWrapper>
      </MainWrapper>
    </AppContainer>
  );
};

export default Layout;
