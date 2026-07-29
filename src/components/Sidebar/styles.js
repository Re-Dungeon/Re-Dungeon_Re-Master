import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';

export const SidebarWrapper = styled.aside`
  width: var(--sidebar-width);
  height: 100vh;
  background: linear-gradient(135deg, #0a0e27 0%, #0f1629 100%);
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(96, 165, 250, 0.1);
  box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 100;
  flex-shrink: 0;
`;

export const LogoSection = styled(Box)`
  padding: 24px;
  border-bottom: 1px solid rgba(96, 165, 250, 0.1);
  background: linear-gradient(
    180deg,
    rgba(96, 165, 250, 0.05) 0%,
    transparent 100%
  );
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const LogoImage = styled.img`
  width: 56px;
  height: 56px;
  filter: drop-shadow(0 0 16px rgba(96, 165, 250, 0.6));
`;

export const StyledNavLink = styled(NavLink)`
  text-decoration: none;
  color: inherit;
  display: block;
  width: 100%;
  flex: 1 1 auto;

  &.active .nav-item-btn {
    background: rgba(111, 45, 168, 0.3);
    border-left: 3px solid #6f2da8;
    color: #00d9ff;

    .MuiListItemIcon-root {
      color: #00d9ff;
    }
    .MuiListItemText-primary {
      color: #00d9ff;
      font-weight: 600;
    }
  }
`;

export const NavItemButton = styled(ListItemButton)`
  border-radius: 8px !important;
  margin: 2px 8px !important;
  width: calc(100% - 16px) !important;
  color: #94a3b8 !important;
  transition: all 0.2s ease !important;
  border-left: 3px solid transparent !important;

  &:hover {
    background: rgba(96, 165, 250, 0.08) !important;
    color: #f8fafc !important;

    .MuiListItemIcon-root {
      color: #00d9ff;
    }
  }

  .MuiListItemIcon-root {
    min-width: 36px;
    color: #94a3b8;
    font-size: 18px;
    transition: color 0.2s ease;
  }

  &.parent-active {
    background: rgba(111, 45, 168, 0.15) !important;
    border-left: 3px solid #6f2da8 !important;
    color: #f8fafc !important;

    .MuiListItemIcon-root {
      color: #00d9ff;
    }
  }
`;

export const UserButton = styled(Box)`
  padding: 16px 24px;
  border-top: 1px solid rgba(96, 165, 250, 0.1);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(96, 165, 250, 0.05);
  }
`;
