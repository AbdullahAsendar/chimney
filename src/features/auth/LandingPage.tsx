import React from 'react';
import { Box, Typography, Button, Card, CardContent, CardActions, useTheme } from '@mui/material';
import Player from 'lottie-react';
import industrialFactoryAnimation from '../../assets/industrial-production-factory.json';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import SecurityIcon from '@mui/icons-material/Security';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const infoSections = [
  {
    title: 'What is Chimney?',
    text: `Chimney is an innovative internal tool designed to enhance workflow configuration for development teams. It simplifies creating, modifying, and managing complex workflows, so you can focus on building robust applications.`,
    action: { label: 'Learn More', href: 'https://github.com/AbdullahAsendar/chimney' },
  },
  {
    title: 'Modern UI/UX',
    text: `Enjoy a clean, responsive, and accessible dashboard experience, with dark mode, tooltips, and instant feedback for every action.`,
    action: { label: 'See Features', href: '#' },
  },
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
          justifyContent: 'space-between',
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
            borderRadius: 3,
          }}
        />
        <Box
          sx={{
            position: 'relative',
            zIndex: 2,
            pl: { xs: 3, md: 10 },
            py: { xs: 6, md: 0 },
            maxWidth: { xs: '100%', md: 700 },
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <img src="logo.svg" alt="Chimney logo" style={{ width: 56, height: 56, display: 'block' }} />
            <Typography
              variant="h3"
              fontWeight={900}
              color="#fff"
              gutterBottom
              sx={{
                letterSpacing: 1,
                fontSize: { xs: '2rem', md: '2.8rem' },
                lineHeight: 1.1,
                display: 'flex',
                alignItems: 'center',
                mb: 0,
              }}
            >
              Chimney
            </Typography>
          </Box>
          <Typography variant="h5" color="#e6f4ea" sx={{ opacity: 0.95, fontWeight: 400, mb: 2 }}>
            Workflow Configuration Made Simple
          </Typography>
          <Typography variant="body1" color="#e6f4ea" sx={{ opacity: 0.9, fontWeight: 400, mb: 3, maxWidth: 500 }}>
            Empower your team to build, manage, and collaborate on complex workflows with ease.
          </Typography>
        </Box>
        {/* Animation on the far right for md+ screens */}
        <Box
          sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'flex-end',
            flex: 1,
            pr: 8,
            zIndex: 2,
            minWidth: 320,
            maxWidth: 480,
            height: { md: 320, lg: 400 },
            filter: 'brightness(0) saturate(100%) invert(24%) sepia(97%) saturate(747%) hue-rotate(88deg) brightness(90%) contrast(90%)', // green tint
          }}
        >
          <Player
            autoplay
            loop
            animationData={industrialFactoryAnimation}
            style={{ width: '100%', height: '100%' }}
          />
        </Box>
      </Box>
      {/* Add Hero Cards Section Below Hero Panel */}
      <Box width="100%" mt={5} display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={3} px={2} justifyContent="center" alignItems="stretch" flexWrap="wrap">
        {[
          {
            icon: <SettingsSuggestIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />, title: 'Easy Setup',
            text: 'Get started in minutes with intuitive configuration and zero hassle.'
          },
          {
            icon: <GroupWorkIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />, title: 'Team Collaboration',
            text: 'Work together seamlessly with real-time updates and shared workflows.'
          },
          {
            icon: <FlashOnIcon sx={{ fontSize: 40, color: '#FFD600' }} />, title: 'Lightning Fast',
            text: 'Experience instant feedback and rapid workflow execution.'
          },
          {
            icon: <SecurityIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />, title: 'Secure by Design',
            text: 'Enterprise-grade security and privacy for your data.'
          },
          {
            icon: <CloudSyncIcon sx={{ fontSize: 40, color: theme.palette.secondary.main }} />, title: 'Cloud Native',
            text: 'Access your workflows anywhere, anytime, on any device.'
          },
          {
            icon: <CheckCircleIcon sx={{ fontSize: 40, color: '#43A047' }} />, title: 'Reliable',
            text: 'Built for stability and peace of mind, even at scale.'
          },
        ].map((feature, idx) => (
          <Card key={idx} sx={{ flex: '1 1 320px', maxWidth: 345, borderRadius: 3, boxShadow: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
            {feature.icon}
            <Typography variant="h6" fontWeight={700} mt={2} mb={1} align="center">{feature.title}</Typography>
            <Typography variant="body2" color="text.secondary" align="center">{feature.text}</Typography>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default LandingPage; 