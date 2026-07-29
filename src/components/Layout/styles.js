import styled from 'styled-components';

export const AppContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
`;

export const MainWrapper = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
`;

export const ContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px;
`;
