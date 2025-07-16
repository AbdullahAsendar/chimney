import React from 'react';
import { Box, Typography, Button, Paper, useTheme } from '@mui/material';


const infoSections = [
  {
    text: `Chimney is an innovative internal tool specifically designed to enhance workflow configuration for development teams. Its primary goal is to simplify the process of creating, modifying, and managing complex workflows, enabling developers to focus on building robust applications rather than getting bogged down in intricate setup tasks.`
  }
];

const LandingPage: React.FC = () => {
  const theme = useTheme();
  return (
    <Box minHeight="80vh" width="100%" display="flex" flexDirection="column" alignItems="center" justifyContent="flex-start" bgcolor={theme.palette.background.default}>
      {/* Hero Section */}
      <Box
        width="100%"
        minHeight={{ xs: 320, md: 420 }}
        sx={{
          position: 'relative',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(0, 102, 53, 0.60)',
            zIndex: 1,
            borderRadius: 3
          }}
        />
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            pl: { xs: 3, md: 10 },
            py: { xs: 6, md: 0 },
            maxWidth: { xs: '100%', md: 700 },
          }}
        >
          <Typography variant="h3" fontWeight={900} color="#fff" gutterBottom sx={{ letterSpacing: 1, fontSize: { xs: '2rem', md: '2.8rem' } }}>
            Chimney: Workflow Configuration Made Simple
          </Typography>
          <Typography variant="h6" color="#e6f4ea" sx={{ opacity: 0.95, fontWeight: 400, mb: 3 }}>
            Empower your team to build, manage, and collaborate on complex workflows with ease.
          </Typography>
          <Button variant="contained" color="primary" size="large" sx={{ fontWeight: 700, borderRadius: 2, px: 4, py: 1.5, fontSize: '1.1rem', boxShadow: 2 }}>
            Get Started
          </Button>
        </Box>
      </Box>
      {/* Info Section as separate hero cards */}
      <Box width="100%"  mt={5} display="flex" flexDirection="column" gap={0} px={2}>
        {infoSections.map((section, idx) => (
          <Paper key={idx} elevation={0} sx={{ p: 4, borderRadius: 3, background: theme.palette.background.paper }}>
            <Typography variant="body1" color="text.primary" sx={{ fontSize: '1.15rem' }}>
              {section.text}
            </Typography>
          </Paper>
        ))}
      </Box>
    </Box>
  );
};

export default LandingPage; 