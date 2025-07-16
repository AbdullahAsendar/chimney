import React, { useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./store";
import { fetchAccessToken, fetchUserInfo, fetchAccountId } from "./authSlice";
import LoginPage from "./pages/LoginPage";
import ClearCachePage from "./pages/ClearCachePage";
import LandingPage from "./pages/LandingPage";
import CompanyPermissionsPage from "./pages/CompanyPermissionsList";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HomeIcon from '@mui/icons-material/Home';
import BusinessIcon from '@mui/icons-material/Business';
import CachedIcon from '@mui/icons-material/Cached';
import LogoutIcon from '@mui/icons-material/Logout';
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import GlobalStyles from '@mui/material/GlobalStyles';
import Player from 'lottie-react';
import loadingAnimation from '../public/loadingAnimation.json';
import UtilitiesPage from './pages/UtilitiesPage';
import BuildIcon from '@mui/icons-material/Build';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useTheme } from '@mui/material/styles';

const drawerWidth = 280;

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#006635' },
    secondary: { main: '#006635' },
    background: { default: '#f3f3f8', paper: '#fff' },
    text: { primary: '#2c332f', secondary: '#2c332f' },
  },
  typography: {
    fontFamily: 'Inter, Roboto, Arial, sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { fontWeight: 700, textTransform: 'none' },
  },
  shape: { borderRadius: 3 },
});

function DrawerNav({ collapsed, onToggle }: { collapsed: boolean, onToggle: () => void }) {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = [
    { text: 'Home', icon: <HomeIcon />, path: '/' },
    { text: 'Company Permissions', icon: <BusinessIcon />, path: '/company-permissions' },
    { text: 'Clear Cache', icon: <CachedIcon />, path: '/clear-cache' },
    { text: 'Utilities', icon: <BuildIcon />, path: '/utilities' },
  ];
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: collapsed ? 72 : drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: collapsed ? 72 : drawerWidth,
          boxSizing: 'border-box',
          background: '#fff',
          borderRight: '1px solid #e0e0e0',
          transition: 'width 0.2s',
        },
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', p: 3, pb: 2 }}>
          <Typography
            variant="h5"
            fontWeight={900}
            color="primary"
            sx={{ letterSpacing: 1, cursor: 'pointer', opacity: collapsed ? 0 : 1, transition: 'opacity 0.2s', whiteSpace: 'nowrap', overflow: 'hidden' }}
            onClick={() => navigate("/")}
          >
            Chimney
          </Typography>
          <IconButton onClick={onToggle} size="small" sx={{ ml: collapsed ? 0 : 1 }}>
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
        <List>
          {navItems.map(item => (
            <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  pl: 2,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  minHeight: 48,
                  borderRadius: 2,
                }}
              >
                <ListItemIcon sx={{ color: location.pathname === item.path ? theme.palette.primary.main : '#888', minWidth: 0, mr: collapsed ? 0 : 2, justifyContent: 'center' }}>{item.icon}</ListItemIcon>
                {!collapsed && <ListItemText primary={item.text} primaryTypographyProps={{ fontWeight: location.pathname === item.path ? 700 : 500 }} />}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box flexGrow={1} />
      </Box>
    </Drawer>
  );
}

// HeaderBar component to be rendered inside Router
function HeaderBar({ user, anchorEl, handleMenuOpen, handleMenuClose, handleLogout }: {
  user: any,
  anchorEl: HTMLElement | null,
  handleMenuOpen: (e: React.MouseEvent<HTMLElement>) => void,
  handleMenuClose: () => void,
  handleLogout: () => void,
}) {
  const theme = useTheme();
  const location = useLocation();
  const pageTitles: Record<string, string> = {
    '/': 'Home',
    '/company-permissions': 'Company Permissions',
    '/clear-cache': 'Clear Cache',
    '/utilities': 'Utilities',
  };
  const currentTitle = pageTitles[location.pathname] || '';
  return (
    <Paper elevation={0} square sx={{
      width: '100%',
      minHeight: 64,
      bgcolor: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      px: { xs: 2, md: 4 },
      py: 1,
      boxSizing: 'border-box',
      borderBottom: '1px solid #e0e0e0',
      position: 'sticky',
      top: 0,
      zIndex: 1100,
    }}>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <Typography >
          {currentTitle}
        </Typography>
      </Box>
      {user && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton onClick={handleMenuOpen} sx={{ p: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, color: '#fff', fontWeight: 700 }}>
              {user.username?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2)}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleLogout} sx={{ color: theme.palette.error.main, fontWeight: 700 }}>
              <LogoutIcon sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Box>
      )}
    </Paper>
  );
}

export const App = () => {
  const dispatch = useDispatch();
  const { refreshToken, accessToken, accountId, user, status, error, accountIdStatus } = useSelector((state: RootState) => state.auth);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [drawerCollapsed, setDrawerCollapsed] = React.useState(false);
  const handleDrawerToggle = () => setDrawerCollapsed(c => !c);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    localStorage.removeItem('refreshToken');
    window.location.reload();
  };

  useEffect(() => {
    if (refreshToken && !accessToken && status === 'idle') {
      dispatch(fetchAccessToken(refreshToken) as any);
    }
  }, [refreshToken, accessToken, status, dispatch]);

  // Fetch accountId after accessToken is available
  useEffect(() => {
    if (accessToken && !accountId) {
      dispatch(fetchAccountId(accessToken) as any);
    }
  }, [accessToken, accountId, dispatch]);

  // Fetch user info after both accessToken and accountId are available
  useEffect(() => {
    if (accessToken && accountId && !user) {
      dispatch(fetchUserInfo(accessToken) as any);
    }
  }, [accessToken, accountId, user, dispatch]);

  if (!refreshToken) {
    return (
      <ThemeProvider theme={theme}>
        <LoginPage />
      </ThemeProvider>
    );
  }

  if (status === 'loading' || (refreshToken && !accessToken)) {
    return (
      <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Player
          autoplay
          loop
          animationData={loadingAnimation}
          style={{ height: 180, width: 180 }}
        />
      </Box>
    );
  }

  if (status === 'failed') {
    if (typeof error === 'string' && (error === 'unauthorized' || error === 'invalid_token')) {
      return (
        <ThemeProvider theme={theme}>
          <LoginPage errorMsg="Your session has expired or the token is invalid. Please enter a new refresh token." />
        </ThemeProvider>
      );
    }
    return (
      <ThemeProvider theme={theme}>
        <LoginPage errorMsg="Invalid or expired refresh token. Please enter a new one." />
      </ThemeProvider>
    );
  }

  if (accountIdStatus === 'failed') {
    return (
      <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ minWidth: 350, maxWidth: 400, p: 3, borderRadius: 4, background: theme.palette.background.paper, boxShadow: 0 }}>
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            fontWeight="bold"
            sx={{ color: theme.palette.primary.main, letterSpacing: 1 }}
          >
            Chimney
          </Typography>
          <Typography color={theme.palette.error.main} variant="body1" align="center" mb={2} fontWeight={600}>
            A super admin account is required to use this tool. Please ensure a super admin account exists.
          </Typography>
        </Box>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ bgcolor: theme.palette.background.default, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Player
          autoplay
          loop
          animationData={loadingAnimation}
          style={{ height: 180, width: 180 }}
        />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={{
        'html': { height: '100%', margin: 0, padding: 0, background: theme.palette.background.default, overflow: 'hidden' },
        'body': { height: '100%', margin: 0, padding: 0, background: theme.palette.background.default, overflow: 'hidden' },
        '#root': { height: '100%', margin: 0, padding: 0, background: theme.palette.background.default, overflow: 'hidden' },
      }} />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default, m: 0, p: 0, boxShadow: 'none', border: 'none', overflow: 'hidden' }}>
          <DrawerNav collapsed={drawerCollapsed} onToggle={handleDrawerToggle} />
          <Box component="main" sx={{ flexGrow: 1, p: 0, bgcolor: theme.palette.background.default, color: theme.palette.text.primary, minHeight: '100vh', m: 0, boxShadow: 'none', border: 'none', overflowX: 'auto', overflowY: 'auto', position: 'relative', transition: 'none' }}>
            <HeaderBar
              user={user}
              anchorEl={anchorEl}
              handleMenuOpen={handleMenuOpen}
              handleMenuClose={handleMenuClose}
              handleLogout={handleLogout}
            />
            <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/company-permissions" element={<CompanyPermissionsPage />} />
              <Route path="/clear-cache" element={<ClearCachePage />} />
              <Route path="/utilities" element={<UtilitiesPage />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            </Box>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};
