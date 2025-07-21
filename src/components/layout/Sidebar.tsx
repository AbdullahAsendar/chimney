import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Box,
  Avatar,
  Divider,
  useTheme,
  Typography,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import CachedIcon from '@mui/icons-material/Cached';
import BuildIcon from '@mui/icons-material/Build';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../app/store';
import { useEnvironment } from '../../contexts/EnvironmentContext';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';

const drawerWidth = 260;

const Sidebar = ({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state: RootState) => state.auth.user);
  const { isProduction } = useEnvironment();

  const navItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    ...(isProduction ? [] : [{ text: 'Workflow Builder', icon: <AccountTreeIcon />, path: '/workflow-builder' }]),
    { text: 'Customers', icon: <PeopleIcon />, path: '/customers' },
    { text: 'Worker Tasks', icon: <WorkIcon />, path: '/worker-tasks' },
    { text: 'Utilities', icon: <BuildIcon />, path: '/utilities' },
    { text: 'Clear Cache', icon: <CachedIcon />, path: '/clear-cache' },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh', position: 'relative' }}>
      <Drawer
        variant="permanent"
        open={!collapsed}
        sx={{
          width: collapsed ? 72 : drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: collapsed ? 72 : drawerWidth,
            boxSizing: 'border-box',
            background: '#fff',
            borderRight: `1px solid ${theme.palette.divider}`,
            boxShadow: '2px 0 8px 0 rgba(44,51,47,0.04)',
            transition: 'width 0.2s',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'          },
        }}
      >
        <Box>
          <Box onClick={onToggle} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start', px: 2, py: 2, position: 'relative' }}>
            {collapsed &&
              <img src="logo.svg" alt="Chimney Logo" style={{ width: 40, height: 40 }} />
            }
            {!collapsed && (
              <img src="logo-full.svg" alt="Chimney Logo" style={{ width: 150 }} />
            )}
          </Box>
          <Divider />
          <List sx={{ pt: 1 }}>
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Tooltip key={item.text} title={collapsed ? item.text : ''} placement="right">
                  <ListItem disablePadding sx={{ display: 'block' }}>
                    <ListItemButton
                      selected={active}
                      onClick={() => navigate(item.path)}
                      sx={{
                        minHeight: 55,
                        justifyContent: collapsed ? 'center' : 'flex-start',
                        px: collapsed ? 0 : 2.5,
                        borderRadius: 0,
                        my: 0.5,
                        position: 'relative',
                        '&:hover': {
                          background: theme.palette.action.hover,
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 2, display: 'flex', justifyContent: 'center', color: active ? theme.palette.primary.main : '#b0bac7' }}>
                        {item.icon}
                      </ListItemIcon>
                      {!collapsed && <ListItemText primary={item.text} sx={{ opacity: 1, fontWeight: 600 }} />}
                    </ListItemButton>
                  </ListItem>
                </Tooltip>
              );
            })}
          </List>
        </Box>
        <Box sx={{ pl: 2, pb: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <Divider sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Avatar sx={{ width: 40, height: 40, bgcolor: theme.palette.primary.main, mr: 1 }}>
              {user?.username
                ? user.username
                    .split(' ')
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()
                : 'U'}
            </Avatar>
            {!collapsed && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: 0 }}>
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, textAlign: 'left', maxWidth: 140, mt: 0, mb: 0 }}>
                  {user?.username || 'User Name'}
                </Typography>
                <Typography variant="caption" noWrap sx={{ textAlign: 'left', maxWidth: 140, mt: 0, mb: 0 }}>
                  {user?.email || 'user@email.com'}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>
    </Box>
  );
};

export default Sidebar; 