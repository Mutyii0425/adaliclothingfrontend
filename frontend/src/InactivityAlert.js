import React, { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, useMediaQuery, useTheme } from '@mui/material';

const InactivityAlert = ({ darkMode, inactivityTimeout = 120000 }) => {
  const [inactivityAlert, setInactivityAlert] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  useEffect(() => {
    const handleUserActivity = () => {
      setLastActivity(Date.now());
      if (inactivityAlert) {
        setInactivityAlert(false);
      }
    };
    
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    const inactivityCheckInterval = setInterval(() => {
      const currentTime = Date.now();
    
      if (currentTime - lastActivity > inactivityTimeout) {
        setInactivityAlert(true);
      }
    }, 10000); 
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      clearInterval(inactivityCheckInterval);
    };
  }, [lastActivity, inactivityAlert, inactivityTimeout]);
  
  const handleCloseInactivityAlert = () => {
    setInactivityAlert(false);
    setLastActivity(Date.now());
  };

  if (!inactivityAlert) return null;
  
  return (
    <Box
      sx={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1400,
        width: isMobile ? '90%' : 'auto',
        maxWidth: '100%',
        animation: 'popIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        '@keyframes popIn': {
          '0%': {
            opacity: 0,
            transform: 'translate(-50%, -50%) scale(0.5)',
          },
          '50%': {
            transform: 'translate(-50%, -50%) scale(1.05)',
          },
          '100%': {
            opacity: 1,
            transform: 'translate(-50%, -50%) scale(1)',
          },
        },
      }}
    >
      <Card
        sx={{
          minWidth: isMobile ? '100%' : 350,
          backgroundColor: darkMode ? 'rgba(45, 45, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          color: darkMode ? '#fff' : '#000',
          boxShadow: darkMode 
            ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)' 
            : '0 8px 32px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          borderRadius: isMobile ? '16px' : '20px',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #00C853, #B2FF59)',
            animation: 'loadingBar 2s ease-in-out',
            '@keyframes loadingBar': {
              '0%': { width: '0%' },
              '100%': { width: '100%' }
            }
          }}
        />
        <CardContent sx={{ 
          p: isMobile ? 2.5 : 4,
        }}>
          <Box sx={{ textAlign: 'center', mb: isMobile ? 2 : 3 }}>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              sx={{ 
                fontWeight: 600,
                mb: isMobile ? 0.5 : 1,
                fontSize: isMobile ? '1.1rem' : undefined,
                background: darkMode 
                ? 'linear-gradient(45deg, #90caf9, #42a5f5)' 
                : 'linear-gradient(45deg, #1976d2, #1565c0)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Még itt vagy?
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: darkMode ? '#aaa' : '#666',
                fontSize: isMobile ? '0.9rem' : undefined,
              }}
            >
              Észrevettük, hogy már egy ideje nem történt aktivitás. Szeretnéd folytatni a böngészést?
            </Typography>
          </Box>
          <Box 
            sx={{ 
              display: 'flex', 
              gap: 2,
              justifyContent: 'space-between'
            }}
          >
            <Button
              onClick={handleCloseInactivityAlert}
              sx={{
                flex: 1,
                py: isMobile ? 1 : 1.5,
                px: isMobile ? 2 : 3,
                fontSize: isMobile ? '0.85rem' : undefined,
                borderRadius: isMobile ? '10px' : '12px',
                background: darkMode 
                ? 'linear-gradient(45deg, #90caf9, #42a5f5)' 
                : 'linear-gradient(45deg, #1976d2, #1565c0)',
                color: '#fff',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: isMobile ? 'none' : 'translateY(-2px)',
                  boxShadow: isMobile ? 'none' : '0 5px 15px rgba(0,0,0,0.3)',
                },
                '&:active': {
                  transform: isMobile ? 'scale(0.98)' : undefined,
                }
              }}
            >
              Igen, folytatom
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default InactivityAlert;