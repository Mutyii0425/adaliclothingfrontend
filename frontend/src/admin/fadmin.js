import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  IconButton,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  useMediaQuery,
  useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuIcon from '@mui/icons-material/Menu';
import EmailIcon from '@mui/icons-material/Email';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import HistoryIcon from '@mui/icons-material/History';
import Menu from '../menu2';

export default function Fadmin() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [users, setUsers] = useState([]);
  const [sideMenuActive, setSideMenuActive] = useState(false);
  const [isSendingCoupons, setIsSendingCoupons] = useState(false);
  const [couponResult, setCouponResult] = useState(null);
  const navigate = useNavigate();
  
  // Új állapotok a felhasználók kiválasztásához és a kuponok küldéséhez
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [expiryDays, setExpiryDays] = useState(30);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [allCouponDialogOpen, setAllCouponDialogOpen] = useState(false);
  const [allExpiryDays, setAllExpiryDays] = useState(30);
  
  // Új állapotok a kuponok kezeléséhez
  const [activeTab, setActiveTab] = useState(0);
  const [couponHistory, setCouponHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [couponStats, setCouponStats] = useState({
    totalCoupons: 0,
    usedCoupons: 0,
    activeCoupons: 0,
    expiredCoupons: 0,
    totalDiscount: 0
  });

  // Összes felhasználó kiválasztása/kiválasztás törlése
  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user.f_azonosito));
    }
  };

  // Egy felhasználó kiválasztása/kiválasztás törlése
  const handleSelectUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  // Kupon küldési dialógus megnyitása
  const handleOpenCouponDialog = () => {
    if (selectedUsers.length === 0) {
      setSnackbarMessage('Válassz ki legalább egy felhasználót!');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    setCouponDialogOpen(true);
  };

  // Kupon küldési dialógus bezárása
  const handleCloseCouponDialog = () => {
    setCouponDialogOpen(false);
  };

  // Kuponok küldése a kiválasztott felhasználóknak
  const handleSendSelectedCoupons = async () => {
    setIsSendingCoupons(true);
    setCouponResult(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/coupons/send-selected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: selectedUsers,
          expiryDays: parseInt(expiryDays)
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setCouponResult({
          success: true,
          message: result.message || `Sikeresen kiküldve ${result.dbSuccessCount || result.emailSuccessCount || 0} felhasználónak!`
        });
        setSnackbarMessage(result.message || `Sikeresen kiküldve ${result.dbSuccessCount || result.emailSuccessCount || 0} felhasználónak!`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setSelectedUsers([]);
        
        // Frissítsük a kupon statisztikákat
        fetchCouponStats();
        fetchCouponHistory();
      } else {
        setCouponResult({
          success: false,
          message: result.error || 'Hiba történt a kuponok küldésekor'
        });
        setSnackbarMessage(result.error || 'Hiba történt a kuponok küldésekor');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Hiba a kuponok küldésekor:', error);
      setCouponResult({
        success: false,
        message: error.message || 'Hálózati hiba történt a kuponok küldésekor'
      });
      setSnackbarMessage(error.message || 'Hálózati hiba történt a kuponok küldésekor');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSendingCoupons(false);
      setCouponDialogOpen(false);
    }
  };

  // Kuponok küldése minden felhasználónak
  const handleSendCoupons = () => {
    setAllCouponDialogOpen(true);
  };
  
  // Kuponok küldése minden felhasználónak a dialógus megerősítése után
  const handleSendAllCoupons = async () => {
    setIsSendingCoupons(true);
    setCouponResult(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/coupons/send-selected', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: users.map(user => user.f_azonosito),
          expiryDays: parseInt(allExpiryDays)
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setCouponResult({
          success: true,
          message: result.message || `Sikeresen kiküldve minden felhasználónak!`
        });
        setSnackbarMessage(result.message || `Sikeresen kiküldve minden felhasználónak!`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        // Frissítsük a kupon statisztikákat
        fetchCouponStats();
        fetchCouponHistory();
      } else {
        setCouponResult({
          success: false,
          message: result.error || 'Hiba történt a kuponok küldésekor'
        });
        setSnackbarMessage(result.error || 'Hiba történt a kuponok küldésekor');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Hiba a kuponok küldésekor:', error);
      setCouponResult({
        success: false,
        message: error.message || 'Hálózati hiba történt a kuponok küldésekor'
      });
      setSnackbarMessage(error.message || 'Hálózati hiba történt a kuponok küldésekor');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSendingCoupons(false);
      setAllCouponDialogOpen(false);
    }
  };

  // Kupon statisztikák lekérése
  const fetchCouponStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/coupons/stats');
      
      if (response.ok) {
        const stats = await response.json();
        setCouponStats(stats);
      }
    } catch (error) {
      console.error('Hiba a kupon statisztikák lekérésekor:', error);
    }
  };

  // Kupon történet lekérése
  const fetchCouponHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch('http://localhost:5000/api/coupons/history');
      
      if (response.ok) {
        const history = await response.json();
        setCouponHistory(history);
      }
    } catch (error) {
      console.error('Hiba a kupon történet lekérésekor:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/users');
        const data = await response.json();
        
        // Lekérjük minden felhasználó kupon információit
        const usersWithCoupons = await Promise.all(data.map(async (user) => {
          try {
            const couponResponse = await fetch(`http://localhost:5000/api/coupons/user-coupons/${user.f_azonosito}`);
            
            if (couponResponse.ok) {
              const coupons = await couponResponse.json();
              
              // Aktív kupon keresése
              const activeCoupon = coupons.find(coupon => !coupon.isUsed && !coupon.isExpired);
              
              // Használt kuponok száma
              const usedCouponsCount = coupons.filter(coupon => coupon.isUsed).length;
              
              return {
                ...user,
                activeCoupon,
                usedCouponsCount,
                coupons
              };
            }
            
            return user;
          } catch (error) {
            console.error(`Hiba a kupon adatok lekérésekor (${user.f_azonosito}):`, error);
            return user;
          }
        }));
        
        setUsers(usersWithCoupons);
      } catch (error) {
        console.log('Hiba:', error);
      }
    };
    
    fetchUsers();
    fetchCouponStats();
    fetchCouponHistory();
  }, []);

  const handleDelete = async (userId) => {
    const confirmation = window.confirm("Biztosan törölni szeretnéd ezt a felhasználót?");
    
    if (confirmation) {
      try {
        const response = await fetch(`http://localhost:5000/users/${userId}`, {
          method: 'DELETE'
        });
      
        if (response.ok) {
          setUsers(users.filter(user => user.f_azonosito !== userId));
          // Ha a törölt felhasználó ki volt választva, távolítsuk el a kiválasztottak közül
          if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
          }
        }
      } catch (error) {
        console.log('Törlési hiba:', error);
      }
    }
  };

  const toggleSideMenu = () => {
    setSideMenuActive(!sideMenuActive);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ backgroundColor: '#333', minHeight: '100vh' }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#333',
        padding: '10px 20px',
        position: 'relative',
      }}>
        <IconButton onClick={toggleSideMenu} sx={{ color: 'white' }}>
          <MenuIcon />
        </IconButton>

        <Typography variant="h1" sx={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontWeight: 'bold',
          color: 'white',
          fontSize: {
            xs: '1.2rem',
            sm: '1.5rem', 
            md: '2rem'
          },
          textAlign: 'center',
          whiteSpace: 'nowrap'
        }}>
          Adali Clothing
        </Typography>
      </Box>

      <Box sx={{
        position: 'fixed',
        top: 0,
        left: sideMenuActive ? 0 : '-250px',
        width: '250px',
        height: '100%',
        backgroundColor: '#fff',
        transition: 'left 0.3s',
        zIndex: 1200,
      }}>
        <Menu sideMenuActive={sideMenuActive} toggleSideMenu={toggleSideMenu} />
      </Box>

      <Container sx={{ pt: 8, px: { xs: 1, sm: 2, md: 3 } }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons={isMobile ? "auto" : "auto"}
          allowScrollButtonsMobile
          sx={{ 
            mb: 4,
            '& .MuiTab-root': { 
              color: 'white',
              fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' },
              minWidth: { xs: 'auto', sm: 'auto' },
              padding: { xs: '6px 8px', sm: '6px 12px', md: '6px 16px' }
            },
            '& .Mui-selected': { color: '#1976d2' },
            '& .MuiTabs-indicator': { backgroundColor: '#1976d2' }
          }}
          >
            <Tab 
              label={isMobile ? "Felhasználók" : "Felhasználók"} 
              icon={<EmailIcon fontSize={isMobile ? "small" : "medium"} />} 
              iconPosition="start" 
            />
            <Tab 
              label={isMobile ? "Statisztikák" : "Kupon Statisztikák"} 
              icon={<LocalOfferIcon fontSize={isMobile ? "small" : "medium"} />} 
              iconPosition="start" 
            />
            <Tab 
              label={isMobile ? "Történet" : "Kupon Történet"} 
              icon={<HistoryIcon fontSize={isMobile ? "small" : "medium"} />} 
              iconPosition="start" 
            />
          </Tabs>
  
          {activeTab === 0 && (
            <>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'column', md: 'row' }, 
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'flex-start', md: 'center' },
                mb: 4,
                gap: 2
              }}>
                <Typography variant="h4" sx={{ 
                  color: 'white',
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' }
                }}>
                  Felhasználók
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' }, 
                  gap: 2,
                  width: { xs: '100%', sm: 'auto' }
                }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<EmailIcon />}
                    onClick={handleOpenCouponDialog}
                    disabled={selectedUsers.length === 0}
                    fullWidth={isMobile}
                    size={isMobile ? "small" : "medium"}
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' } }}
                  >
                    {isMobile ? "Kupon kiválasztottaknak" : "Kupon küldése kiválasztottaknak"}
                  </Button>
                  <Button 
                    variant="contained" 
                    color="secondary" 
                    startIcon={<EmailIcon />}
                    onClick={handleSendCoupons}
                    fullWidth={isMobile}
                    size={isMobile ? "small" : "medium"}
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' } }}
                  >
                    {isMobile ? "Kupon mindenkinek" : "Kupon küldése mindenkinek"}
                  </Button>
                </Box>
              </Box>
  
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedUsers.length === users.length && users.length > 0}
                      indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                      onChange={handleSelectAllUsers}
                      sx={{ color: 'white' }}
                    />
                  }
                  label={<Typography sx={{ color: 'white', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>Összes kiválasztása</Typography>}
                />
              </Box>
  
              <Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
                {users.map((user) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={user.f_azonosito}>
                    <Card sx={{ 
                      height: '100%',
                      position: 'relative',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                      }
                    }}>
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Box sx={{ position: 'absolute', top: 5, right: 5 }}>
                          <Checkbox
                            checked={selectedUsers.includes(user.f_azonosito)}
                            onChange={() => handleSelectUser(user.f_azonosito)}
                            size={isMobile ? "small" : "medium"}
                          />
                        </Box>
                        <Typography variant="h6" gutterBottom sx={{ 
                          fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
                          mt: 1
                        }}>
                          {user.felhasznalonev}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" gutterBottom sx={{ 
                          fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } 
                        }}>
                          {user.email}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ 
                          fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } 
                        }}>
                          Regisztrált: {new Date(user.reg_datum).toLocaleDateString()}
                        </Typography>
                        
                        {/* Kupon információk megjelenítése */}
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eee' }}>
                          <Typography variant="subtitle2" gutterBottom sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' } 
                          }}>
                            Kupon információk:
                          </Typography>
                          
                          {user.activeCoupon ? (
                            <Box sx={{ 
                              display: 'flex', 
                              flexDirection: { xs: 'column', sm: 'row' },
                              alignItems: { xs: 'flex-start', sm: 'center' }, 
                              gap: 1 
                            }}>
                              <Chip 
                                label={`${user.activeCoupon.discount}% kedvezmény`} 
                                color="success" 
                                size="small" 
                              />
                              <Typography variant="caption" sx={{ 
                                fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } 
                              }}>
                                Lejárat: {new Date(user.activeCoupon.expiryDate).toLocaleDateString()}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary" sx={{ 
                              fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' } 
                            }}>
                              Nincs aktív kupon
                            </Typography>
                          )}
                          
                          {user.usedCouponsCount > 0 && (
                            <Typography variant="caption" display="block" sx={{ 
                              mt: 1,
                              fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.75rem' } 
                            }}>
                              Felhasznált kuponok: {user.usedCouponsCount}
                            </Typography>
                          )}
                        </Box>
                        
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                          <IconButton 
                            color="error" 
                            onClick={() => handleDelete(user.f_azonosito)}
                            aria-label="delete"
                            size={isMobile ? "small" : "medium"}
                          >
                            <DeleteIcon fontSize={isMobile ? "small" : "medium"} />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
  
          {activeTab === 1 && (
            <Box sx={{ color: 'white' }}>
              <Typography variant="h4" gutterBottom sx={{ 
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } 
              }}>
                Kupon Statisztikák
              </Typography>
              
              <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mt: 2 }}>
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ 
                    backgroundColor: '#1976d2',
                    color: 'white',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } 
                      }}>
                        Összes kupon
                      </Typography>
                      <Typography variant="h3" sx={{ 
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' } 
                      }}>
                        {couponStats.totalCoupons}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ 
                    backgroundColor: '#4caf50',
                    color: 'white',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } 
                      }}>
                        Aktív kuponok
                      </Typography>
                      <Typography variant="h3" sx={{ 
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' } 
                      }}>
                        {couponStats.activeCoupons}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ 
                    backgroundColor: '#f44336',
                    color: 'white',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } 
                      }}>
                        Felhasznált kuponok
                      </Typography>
                      <Typography variant="h3" sx={{ 
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' } 
                      }}>
                        {couponStats.usedCoupons}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={6}>
                  <Card sx={{ 
                    backgroundColor: '#ff9800',
                    color: 'white',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } 
                      }}>
                        Lejárt kuponok
                      </Typography>
                      <Typography variant="h3" sx={{ 
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' } 
                      }}>
                        {couponStats.expiredCoupons}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={6}>
                  <Card sx={{ 
                    backgroundColor: '#9c27b0',
                    color: 'white',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                    }
                  }}>
                    <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                      <Typography variant="h6" gutterBottom sx={{ 
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } 
                      }}>
                        Összes kedvezmény értéke
                      </Typography>
                      <Typography variant="h3" sx={{ 
                        fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' } 
                      }}>
                        {couponStats.totalDiscount.toLocaleString()} Ft
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 4 }}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={fetchCouponStats}
                  size={isMobile ? "small" : "medium"}
                >
                  Statisztikák frissítése
                </Button>
              </Box>
            </Box>
          )}
  
          {activeTab === 2 && (
            <Box sx={{ color: 'white' }}>
              <Typography variant="h4" gutterBottom sx={{ 
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' } 
              }}>
                Kupon Történet
              </Typography>
              
              {isLoadingHistory ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <CircularProgress />
                </Box>
                          ) : (
                            <TableContainer 
                              component={Paper} 
                              sx={{ 
                                mt: 3,
                                overflowX: 'auto'
                              }}
                            >
                              <Table size={isMobile ? "small" : "medium"}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ 
                                      display: { xs: 'none', sm: 'table-cell' },
                                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }
                                    }}>Felhasználó</TableCell>
                                    <TableCell sx={{ 
                                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }
                                    }}>Típus</TableCell>
                                    <TableCell sx={{ 
                                      display: { xs: 'none', md: 'table-cell' },
                                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }
                                    }}>Kód</TableCell>
                                    <TableCell sx={{ 
                                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }
                                    }}>Kedvezmény</TableCell>
                                    <TableCell sx={{ 
                                      display: { xs: 'none', sm: 'table-cell' },
                                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }
                                    }}>Létrehozva</TableCell>
                                    <TableCell sx={{ 
                                      display: { xs: 'none', md: 'table-cell' },
                                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }
                                    }}>Lejárat</TableCell>
                                    <TableCell sx={{ 
                                      fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }
                                    }}>Státusz</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                {couponHistory.map((coupon, index) => (
                                  <TableRow key={coupon.id || `coupon-${index}`}>
                                      <TableCell sx={{ 
                                        display: { xs: 'none', sm: 'table-cell' },
                                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                      }}>{coupon.username}</TableCell>
                                      <TableCell sx={{ 
                                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                      }}>{coupon.type === 'registration' ? 'Reg.' : 'Email'}</TableCell>
                                      <TableCell sx={{ 
                                        display: { xs: 'none', md: 'table-cell' },
                                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                      }}>{coupon.code}</TableCell>
                                      <TableCell sx={{ 
                                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                      }}>{coupon.discount}%</TableCell>
                                      <TableCell sx={{ 
                                        display: { xs: 'none', sm: 'table-cell' },
                                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                      }}>{new Date(coupon.createdAt).toLocaleDateString()}</TableCell>
                                      <TableCell sx={{ 
                                        display: { xs: 'none', md: 'table-cell' },
                                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                      }}>{new Date(coupon.expiryDate).toLocaleDateString()}</TableCell>
                                      <TableCell sx={{ 
                                        fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' }
                                      }}>
                                        {coupon.isUsed ? (
                                          <Chip label="Használt" color="error" size="small" />
                                        ) : coupon.isExpired ? (
                                          <Chip label="Lejárt" color="warning" size="small" />
                                        ) : (
                                          <Chip label="Aktív" color="success" size="small" />
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </TableContainer>
                          )}
                          
                          <Box sx={{ mt: 4 }}>
                            <Button 
                              variant="contained" 
                              color="primary" 
                              onClick={fetchCouponHistory}
                              disabled={isLoadingHistory}
                              size={isMobile ? "small" : "medium"}
                            >
                              Történet frissítése
                            </Button>
                          </Box>
                        </Box>
                      )}
                      <Button
          onClick={() => navigate('/admin')}
          variant="contained"
          sx={{ 
            mt: 4,
            bgcolor:  '#555' ,
            '&:hover': { bgcolor:  '#666'  }
          }}
        >
          Vissza az admin felületre
        </Button>
                    </Container>
              
                    {/* Kupon küldési dialógus a kiválasztott felhasználóknak */}
                    <Dialog 
                      open={couponDialogOpen} 
                      onClose={handleCloseCouponDialog}
                      maxWidth="sm"
                      fullWidth
                      PaperProps={{
                        sx: {
                          width: { xs: '95%', sm: '80%', md: '60%' },
                          maxWidth: '600px'
                        }
                      }}
                    >
                      <DialogTitle sx={{ 
                        fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } 
                      }}>
                        Kupon küldése a kiválasztott felhasználóknak
                      </DialogTitle>
                      <DialogContent>
                        <Typography variant="body1" gutterBottom sx={{ 
                          fontSize: { xs: '0.875rem', sm: '1rem' } 
                        }}>
                          Kupon küldése {selectedUsers.length} kiválasztott felhasználónak.
                        </Typography>
                        
                        <TextField
                          label="Lejárati idő (napokban)"
                          type="number"
                          value={expiryDays}
                          onChange={(e) => setExpiryDays(e.target.value)}
                          fullWidth
                          margin="normal"
                          InputProps={{ inputProps: { min: 1 } }}
                          sx={{ mt: 2 }}
                        />
                      </DialogContent>
                      <DialogActions>
                        <Button 
                          onClick={handleCloseCouponDialog}
                          size={isMobile ? "small" : "medium"}
                        >
                          Mégse
                        </Button>
                        <Button 
                          onClick={handleSendSelectedCoupons}
                          color="primary"
                          disabled={isSendingCoupons}
                          size={isMobile ? "small" : "medium"}
                        >
                          {isSendingCoupons ? (
                            <>
                              <CircularProgress size={isMobile ? 16 : 24} sx={{ mr: 1 }} />
                              Küldés...
                            </>
                          ) : (
                            'Kuponok küldése'
                          )}
                        </Button>
                      </DialogActions>
                    </Dialog>
              
                    {/* Kupon küldési dialógus minden felhasználónak */}
                    <Dialog 
                      open={allCouponDialogOpen} 
                      onClose={() => setAllCouponDialogOpen(false)}
                      maxWidth="sm"
                      fullWidth
                      PaperProps={{
                        sx: {
                          width: { xs: '95%', sm: '80%', md: '60%' },
                          maxWidth: '600px'
                        }
                      }}
                    >
                      <DialogTitle sx={{ 
                        fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' } 
                      }}>
                        Kupon küldése minden felhasználónak
                      </DialogTitle>
                      <DialogContent>
                        <Typography variant="body1" gutterBottom sx={{ 
                          fontSize: { xs: '0.875rem', sm: '1rem' } 
                        }}>
                          Kupon küldése mind a {users.length} felhasználónak.
                        </Typography>
                        
                        <TextField
                          label="Lejárati idő (napokban)"
                          type="number"
                          value={allExpiryDays}
                          onChange={(e) => setAllExpiryDays(e.target.value)}
                          fullWidth
                          margin="normal"
                          InputProps={{ inputProps: { min: 1 } }}
                          sx={{ mt: 2 }}
                        />
                        
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          Figyelem! Ez a művelet minden felhasználónak új kupont küld, függetlenül attól, hogy van-e már aktív kuponjuk.
                        </Alert>
                      </DialogContent>
                      <DialogActions>
                        <Button 
                          onClick={() => setAllCouponDialogOpen(false)}
                          size={isMobile ? "small" : "medium"}
                        >
                          Mégse
                        </Button>
                        <Button 
                          onClick={handleSendAllCoupons}
                          color="primary"
                          disabled={isSendingCoupons}
                          size={isMobile ? "small" : "medium"}
                        >
                          {isSendingCoupons ? (
                            <>
                              <CircularProgress size={isMobile ? 16 : 24} sx={{ mr: 1 }} />
                              Küldés...
                            </>
                          ) : (
                            'Kuponok küldése mindenkinek'
                          )}
                        </Button>
                      </DialogActions>
                    </Dialog>
              
                    {/* Snackbar értesítések */}
                    <Snackbar
                      open={snackbarOpen}
                      autoHideDuration={6000}
                      onClose={() => setSnackbarOpen(false)}
                      anchorOrigin={{ 
                        vertical: 'bottom', 
                        horizontal: isMobile ? 'center' : 'right' 
                      }}
                      sx={{
                        bottom: { xs: 16, sm: 24 }
                      }}
                    >
                      <Alert 
                        onClose={() => setSnackbarOpen(false)} 
                        severity={snackbarSeverity}
                        sx={{ 
                          width: '100%',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                      >
                        {snackbarMessage}
                      </Alert>
                    </Snackbar>

                    
         <Box sx={{ 
              backgroundColor: '#333' ,
              backgroundSize: '20px 20px',
              pb: 8 
            }}>
            </Box>
                  </Box>
                );
              }
              