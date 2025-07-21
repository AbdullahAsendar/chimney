import React, { useEffect } from "react";
import { ThemeProvider } from "@mui/material/styles";
import { getTheme } from "./app/theme";
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "./app/store";
import { fetchAccessToken, fetchUserInfo, fetchAccountId } from "./features/auth/authSlice";
import LoginPage from "./features/auth/LoginPage";
import ClearCachePage from "./features/utilities/ClearCachePage";
import WorkflowBuilder from "./features/workflow/WorkflowBuilder";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import GlobalStyles from '@mui/material/GlobalStyles';
import Player from 'lottie-react';
import loadingAnimation from './assets/loadingAnimation.json';
import UtilitiesPage from './features/utilities/UtilitiesPage';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import LandingPage from "./features/auth/LandingPage";
import Sidebar from "./components/layout/Sidebar";
import { EnvironmentProvider, useEnvironment } from "./contexts/EnvironmentContext";
import EnvironmentToggle from "./components/EnvironmentToggle";
import CustomersPage from './features/customers/CustomersPage';
import WorkerTaskPage from './features/workerTask/WorkerTaskPage';

const theme = getTheme('light');

// HeaderBar component to be rendered inside Router
function HeaderBar({ user, anchorEl, handleMenuOpen, handleMenuClose, handleLogout }: {
  user: any,
  anchorEl: HTMLElement | null,
  handleMenuOpen: (e: React.MouseEvent<HTMLElement>) => void,
  handleMenuClose: () => void,
  handleLogout: () => void,
}) {
  const location = useLocation();
  const { isProduction, toggleEnvironment } = useEnvironment();
  const pageTitles: Record<string, string> = {
    '/': 'Home',
    '/workflow-builder': 'Workflow Builder',
    '/customers': 'Customers',
    '/worker-tasks': 'Worker Tasks',
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
      borderRadius: 0
    }}>
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
        <Typography >
          {currentTitle}
        </Typography>
      </Box>
      <EnvironmentToggle isProduction={isProduction} onToggle={toggleEnvironment} />
    </Paper>
  );
}

export const App = () => {
  const dispatch = useDispatch();
  const { refreshToken, accessToken, accountId, user, status, error, accountIdStatus } = useSelector((state: RootState) => state.auth);
  const { apiBaseUrl } = useEnvironment();
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
      dispatch(fetchAccessToken({ refreshToken, apiBaseUrl }) as any);
    }
  }, [refreshToken, accessToken, status, dispatch, apiBaseUrl]);

  // Fetch accountId after accessToken is available
  useEffect(() => {
    if (accessToken && !accountId) {
      dispatch(fetchAccountId({ accessToken, apiBaseUrl }) as any);
    }
  }, [accessToken, accountId, dispatch, apiBaseUrl]);

  // Fetch user info after both accessToken and accountId are available
  useEffect(() => {
    if (accessToken && accountId && !user) {
      dispatch(fetchUserInfo({ accessToken, apiBaseUrl }) as any);
    }
  }, [accessToken, accountId, user, dispatch, apiBaseUrl]);

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
            Access Denied: This application requires super admin privileges. Please contact your system administrator to grant the necessary permissions or verify your account has the correct role assigned.
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
        'html': { height: '100%', margin: 0, padding: 0, background: theme.palette.background.default },
        'body': { height: '100%', margin: 0, padding: 0, background: theme.palette.background.default },
        '#root': { height: '100%', margin: 0, padding: 0, background: theme.palette.background.default },
      }} />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: theme.palette.background.default, m: 0, p: 0, boxShadow: 'none', border: 'none' }}>
          <Sidebar collapsed={drawerCollapsed} onToggle={handleDrawerToggle} />
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
              <Route path="/workflow-builder" element={<WorkflowBuilder />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/worker-tasks" element={<WorkerTaskPage />} />
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
