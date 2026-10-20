import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';

export const SidebarWrapper = styled.aside`
  width: var(--sidebar-width);
  height: 100vh;
  background: linear-gradient(180deg, rgba(10, 12, 16, 0.98) 0%, rgba(18, 20, 26, 0.96) 100%);
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.35);
  position: relative;
  z-index: 100;
  flex-shrink: 0;
  backdrop-filter: blur(12px);
`;

export const LogoSection = styled(Box)`
  padding: 18px 18px 12px;
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
`;

export const LogoImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 18px;
  background: transparent;
  display: block;
  object-fit: cover;
  filter: drop-shadow(0 12px 20px rgba(196, 58, 47, 0.18));
`;

export const MenuSection = styled(Box)`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0 12px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(196, 58, 47, 0.7) rgba(10, 12, 16, 0.2);

  &::-webkit-scrollbar {
    width: 7px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(10, 12, 16, 0.15);
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(196, 58, 47, 0.7);
    border-radius: 999px;
  }
`;

export const SectionLabel = styled('span')`
  display: block;
  margin: 10px 18px 6px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(169, 176, 186, 0.75);
`;

export const StyledNavLink = styled(NavLink)`
  text-decoration: none;
  color: inherit;
  display: block;
  width: 100%;
  flex: 1 1 auto;

  &.active .nav-item-btn {
    background: linear-gradient(90deg, rgba(196, 58, 47, 0.18), rgba(196, 58, 47, 0.08));
    border-left: 3px solid var(--color-accent);
    box-shadow: inset 0 0 0 1px rgba(196, 58, 47, 0.16);
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
  border-radius: 12px !important;
  margin: 3px 10px !important;
  width: calc(100% - 20px) !important;
  padding: 8px 10px !important;
  color: var(--text-secondary) !important;
  transition: all 0.2s ease !important;
  border-left: 3px solid transparent !important;
  min-height: 42px;

  &:hover {
    background: rgba(196, 58, 47, 0.08) !important;
    color: var(--text-primary) !important;
    transform: translateX(2px);

    .MuiListItemIcon-root {
      color: var(--color-accent);
    }
  }

  .MuiListItemIcon-root {
    min-width: 28px;
    color: var(--text-secondary);
    font-size: 16px;
    transition: color 0.2s ease;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .MuiListItemText-root {
    margin: 0 !important;
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
  padding: 14px 18px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s ease;
  background: rgba(255, 255, 255, 0.015);

  &:hover {
    background: rgba(196, 58, 47, 0.08);
  }
`;
