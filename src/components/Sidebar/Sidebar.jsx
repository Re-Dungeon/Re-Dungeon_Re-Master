import React, { useState } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import { NAV_ITEMS, NAV_ITEMS_SECONDARY } from 'common/constants/navItems';
import { useAuth } from 'context/AuthContext';
import LoginModal from 'components/LoginModal/LoginModal';
import ResourceCenterModal from 'components/ResourceCenterModal/ResourceCenterModal';
import {
  SidebarWrapper,
  LogoSection,
  LogoImage,
  StyledNavLink,
  NavItemButton,
  UserButton,
} from './styles';

const Sidebar = () => {
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const { currentUser, logout, isAdmin, allowedUniversos, loadingPermissions } = useAuth();
  const temAcessoAUniverso = isAdmin || allowedUniversos.length > 0;

  const handleUserButtonClick = () => {
    if (currentUser) {
      logout();
    } else {
      setLoginModalOpen(true);
    }
  };

  return (
    <SidebarWrapper id="remaster-sidebar">
      <LogoSection>
        <Box sx={{ position: 'relative', width: '100%', height: 96, flexShrink: 0 }}>
          <LogoImage
            src="https://i.imgur.com/3xTDlF9.png"
            alt="Brasão Re:Master"
          />
          <Typography
            variant="caption"
            sx={{
              position: 'absolute',
              right: 10,
              bottom: 6,
              color: '#FFF',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontSize: 10,
              lineHeight: 1,
              px: 0.75,
              py: 0.35,
              bgcolor: 'rgba(0, 0, 0, 0.55)',
              borderRadius: '8px',
            }}
          >
            V1.0
          </Typography>
        </Box>
      </LogoSection>

      <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
        {currentUser && !loadingPermissions && !temAcessoAUniverso && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              Você ainda não tem acesso a nenhum Universo. Peça para um admin
              liberar seu acesso para usar o Re:Master.
            </Typography>
          </Box>
        )}

        {currentUser && !loadingPermissions && temAcessoAUniverso && (
          <>
            <List disablePadding>
              {NAV_ITEMS.map(item => (
                <ListItem key={item.path} disablePadding>
                  <StyledNavLink to={item.path}>
                    <NavItemButton className="nav-item-btn">
                      <ListItemIcon sx={{ fontSize: 18 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                            {item.label}
                          </Typography>
                        }
                      />
                    </NavItemButton>
                  </StyledNavLink>
                </ListItem>
              ))}
              <ListItem disablePadding>
                <NavItemButton
                  onClick={() => setResourceModalOpen(true)}
                  className="nav-item-btn"
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemIcon sx={{ fontSize: 18 }}>
                    📚
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                        Central de Recursos
                      </Typography>
                    }
                  />
                </NavItemButton>
              </ListItem>
            </List>

            {NAV_ITEMS_SECONDARY.length > 0 && (
              <>
                <Divider
                  sx={{ mx: 2, my: 1, borderColor: 'rgba(255,255,255,0.08)' }}
                />
                <List disablePadding>
                  {NAV_ITEMS_SECONDARY.map(item => (
                    <ListItem key={item.path} disablePadding>
                      <StyledNavLink to={item.path}>
                        <NavItemButton className="nav-item-btn">
                          <ListItemIcon sx={{ fontSize: 18 }}>
                            {item.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                                {item.label}
                              </Typography>
                            }
                          />
                        </NavItemButton>
                      </StyledNavLink>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </>
        )}
      </Box>

      <Tooltip
        title={currentUser ? 'Sair da conta' : 'Fazer login'}
        placement="top"
      >
        <UserButton
          id="btn-user-profile"
          onClick={handleUserButtonClick}
          aria-label={currentUser ? 'Sair da conta' : 'Fazer login'}
        >
          <Avatar
            src={currentUser?.photoURL || undefined}
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.main',
              fontSize: 16,
            }}
          >
            {currentUser
              ? currentUser.displayName?.[0]?.toUpperCase() || '👤'
              : '👤'}
          </Avatar>
          <Typography
            variant="body2"
            sx={{
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 120,
            }}
          >
            {currentUser
              ? currentUser.displayName || currentUser.email
              : 'Usuário'}
          </Typography>
        </UserButton>
      </Tooltip>

      <LoginModal
        open={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
      />
      <ResourceCenterModal
        open={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
      />
    </SidebarWrapper>
  );
};

export default Sidebar;
