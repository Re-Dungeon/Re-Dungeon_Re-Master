import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from 'components/Sidebar/Sidebar';
import Header from 'components/Header/Header';
import { AppContainer, MainWrapper, ContentWrapper } from './styles';

const Layout = () => {
  return (
    <AppContainer className="redungeon-container">
      <Sidebar />
      <MainWrapper className="redungeon-main" id="redungeon-main">
        <Header />
        <ContentWrapper className="redungeon-content" id="redungeon-content">
          <Outlet />
        </ContentWrapper>
      </MainWrapper>
    </AppContainer>
  );
};

export default Layout;
