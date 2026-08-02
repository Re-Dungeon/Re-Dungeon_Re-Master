import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';

export const SidebarWrapper = styled.aside`
  width: var(--sidebar-width);
  height: 100vh;
  background: linear-gradient(180deg, #090b10 0%, #11141a 100%);
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.35);
  position: relative;
  z-index: 100;
  flex-shrink: 0;
`;

export const LogoSection = styled(Box)`
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const LogoImage = styled.img`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.05);
  display: block;
`;

export const StyledNavLink = styled(NavLink)`
  text-decoration: none;
  color: inherit;
  display: block;
  width: 100%;
  flex: 1 1 auto;

  &.active .nav-item-btn {
    background: rgba(196, 58, 47, 0.16);
    border-left: 3px solid var(--color-primary);
    color: var(--text-primary);

    .MuiListItemIcon-root {
      color: var(--color-accent);
    }
    .MuiListItemText-primary {
      color: var(--text-primary);
      font-weight: 700;
    }
  }
`;

export const NavItemButton = styled(ListItemButton)`
  border-radius: 14px !important;
  margin: 4px 10px !important;
  width: calc(100% - 20px) !important;
  color: var(--text-secondary) !important;
  transition: all 0.2s ease !important;
  border-left: 3px solid transparent !important;

  &:hover {
    background: rgba(196, 58, 47, 0.12) !important;
    color: var(--text-primary) !important;

    .MuiListItemIcon-root {
      color: var(--color-accent);
    }
  }

  .MuiListItemIcon-root {
    min-width: 36px;
    color: var(--text-secondary);
    font-size: 18px;
    transition: color 0.2s ease;
  }

  &.parent-active {
    background: rgba(196, 58, 47, 0.12) !important;
    border-left: 3px solid var(--color-primary) !important;
    color: var(--text-primary) !important;

    .MuiListItemIcon-root {
      color: var(--color-accent);
    }
  }
`;

export const UserButton = styled(Box)`
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(196, 58, 47, 0.08);
  }
`;
