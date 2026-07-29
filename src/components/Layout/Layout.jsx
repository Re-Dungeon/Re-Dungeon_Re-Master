import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from 'components/Sidebar/Sidebar';
import Header from 'components/Header/Header';
import { AppContainer, MainWrapper, ContentWrapper } from './styles';

const Layout = () => {
  return (
    <AppContainer className="remaster-container">
      <Sidebar />
      <MainWrapper className="remaster-main" id="remaster-main">
        <Header />
        <ContentWrapper className="remaster-content" id="remaster-content">
          <Outlet />
        </ContentWrapper>
      </MainWrapper>
    </AppContainer>
  );
};

export default Layout;
