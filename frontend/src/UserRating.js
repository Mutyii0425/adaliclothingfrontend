import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Rating,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  List,
  ListItem,
  Divider,
  Avatar,
  Snackbar,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import CloseIcon from '@mui/icons-material/Close';

const UserRating = (props) => {
  const [ratings, setRatings] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [userId, setUserId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { username, darkMode, onClose } = props;
  
  const handleShowRatingsChange = (value) => {
    if (props.onShowRatingsChange) {
      props.onShowRatingsChange(value);
    }
  };

  useEffect(() => {
    if (username) {
      fetchUserId();
    }
  }, [username]);

  useEffect(() => {
    if (userId) {
      fetchRatings();
    }
  }, [userId]);

  const fetchUserId = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/ratings/user-id/${encodeURIComponent(username)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError(`Nem található felhasználó: ${username}`);
          setLoading(false);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUserId(data.userId);
      } else {
        setError(data.error);
        setLoading(false);
      }
    } catch (error) {
      console.error('Hiba a felhasználó azonosító lekérésekor:', error);
      setError('Hiba történt az adatok lekérésekor');
      setLoading(false);
    }
  };

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/ratings/user-ratings/${userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setRatings(data.ratings);
        setAvgRating(data.avgRating);
        setRatingCount(data.count);
      } else {
        setError(data.error);
      }
    } catch (error) {
      console.error('Hiba az értékelések lekérésekor:', error);
      setError('Hiba történt az adatok lekérésekor');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitRating = async () => {
    try {
      setSubmitting(true);
      
      const userData = localStorage.getItem('user');
      if (!userData) {
        setSnackbarMessage('A értékeléshez be kell jelentkezned');
        setSnackbarSeverity('error');
        setShowSnackbar(true);
        return;
      }
      
      const currentUser = JSON.parse(userData);
      const raterUsername = currentUser.username || currentUser.felhasznalonev;
      
      console.log('Értékelés küldése:', {
        ratedUsername: username,
        raterUsername: raterUsername,
        rating: userRating,
        velemeny: comment
      });
      
      const response = await fetch('http://localhost:5000/ratings/add-user-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ratedUsername: username,
          raterUsername: raterUsername,
          rating: userRating,
          velemeny: comment
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Szerver hiba');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSnackbarMessage('Értékelés sikeresen elküldve!');
        setSnackbarSeverity('success');
        setShowSnackbar(true);
        handleCloseDialog();
        
        // Frissítsük az értékeléseket
        if (fetchRatings) {
          await fetchRatings();
        }
      } else {
        setSnackbarMessage(data.error || 'Hiba történt az értékelés elküldésekor');
        setSnackbarSeverity('error');
        setShowSnackbar(true);
      }
    } catch (error) {
      console.error('Hiba az értékelés küldésekor:', error);
      setSnackbarMessage(error.message || 'Hiba történt az értékelés küldésekor');
      setSnackbarSeverity('error');
      setShowSnackbar(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleOpenDialog = () => {
    // Ellenőrizzük, hogy a felhasználó be van-e jelentkezve
    const userData = localStorage.getItem('user');
    if (!userData) {
      setSnackbarMessage('A értékeléshez be kell jelentkezned!');
      setSnackbarSeverity('warning');
      setShowSnackbar(true);
      return;
    }
    
    const currentUser = JSON.parse(userData);
    
    // Ellenőrizzük, hogy a felhasználó nem saját magát értékeli-e
    if (currentUser.felhasznalonev === username) {
      setSnackbarMessage('Saját magadat nem értékelheted!');
      setSnackbarSeverity('warning');
      setShowSnackbar(true);
      return;
    }
    
    // Ellenőrizzük, hogy a felhasználó értékelte-e már ezt a feltöltőt
    const existingRating = ratings.find(r => r.felhasznalonev === currentUser.felhasznalonev);
    if (existingRating) {
      setUserRating(existingRating.rating);
      setComment(existingRating.velemeny || '');
    } else {
      setUserRating(0);
      setComment('');
    }
    
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSnackbarClose = () => {
    setShowSnackbar(false);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'yyyy. MMMM d. HH:mm', { locale: hu });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Paper
        elevation={darkMode ? 0 : 2}
        sx={{
          p: 3,
          backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
          borderRadius: '12px',
          border: '1px solid',
          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
          boxShadow: darkMode ? 'none' : '0 3px 10px rgba(0,0,0,0.08)',
        }}
      >
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          pb: 2,
          borderBottom: '1px solid',
          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: darkMode ? '#fff' : '#333', 
              fontWeight: 600,
              fontSize: '1.25rem'
            }}
          >
            Értékelések a feltöltőről
          </Typography>
          
          <Button
            variant="contained"
            onClick={handleOpenDialog}
            sx={{
              backgroundColor: darkMode ? '#90caf9' : '#1976d2',
              color: darkMode ? '#333' : '#fff',
              fontWeight: 600,
              borderRadius: '8px',
              padding: '8px 16px',
              boxShadow: darkMode ? 'none' : '0 2px 8px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                backgroundColor: darkMode ? '#42a5f5' : '#1565c0',
                boxShadow: darkMode ? 'none' : '0 4px 12px rgba(25, 118, 210, 0.4)',
              }
            }}
          >
            Értékelés írása
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={40} sx={{ color: darkMode ? '#90caf9' : '#1976d2' }} />
          </Box>
        ) : error ? (
          <Typography variant="body1" sx={{ 
            textAlign: 'center', 
            py: 3, 
            color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
            backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
            borderRadius: '8px',
            padding: '16px'
          }}>
            {error}
          </Typography>
        ) : (
          <>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              gap: 3, 
              mb: 4,
              p: 2,
              backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(25, 118, 210, 0.04)',
              borderRadius: '10px',
              border: '1px solid',
              borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(25, 118, 210, 0.15)'
            }}>
              <Box sx={{ 
                textAlign: 'center', 
                minWidth: '120px',
                p: 2,
                backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'white',
                borderRadius: '8px',
                boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                border: '1px solid',
                borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'
              }}>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    color: darkMode ? '#90caf9' : '#1976d2', 
                    fontWeight: 700,
                    textShadow: darkMode ? 'none' : '0 1px 2px rgba(25, 118, 210, 0.2)'
                  }}
                >
                  {avgRating.toFixed(1)}
                </Typography>
                
                <Rating 
                  value={avgRating}
                  precision={0.1}
                  readOnly
                  sx={{
                    '& .MuiRating-iconFilled': {
                      color: darkMode ? '#90caf9' : '#1976d2',
                    },
                    '& .MuiRating-iconEmpty': {
                      color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                    }
                  }}
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)', 
                    mt: 0.5,
                    fontWeight: 500
                  }}
                >
                  {ratingCount} értékelés
                </Typography>
              </Box>
              
              <Box sx={{ flex: 1 }}>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    mb: 1.5, 
                    color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.7)',
                    fontWeight: 500
                  }}
                >
                  Értékelések eloszlása:
                </Typography>
                
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratings.filter(r => Math.round(r.rating) === star).length;
                  const percentage = ratingCount > 0 ? (count / ratingCount) * 100 : 0;
                  
                  return (
                    <Box key={star} sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 1,
                      p: 0.5,
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'
                      }
                    }}>
                      <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                  width: '20px', 
                                                  mr: 1, 
                                                  color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                                                  fontWeight: 600
                                                }}
                                              >
                                                {star}
                                              </Typography>
                                              <StarIcon sx={{ 
                                                fontSize: '16px', 
                                                mr: 1, 
                                                color: darkMode ? '#90caf9' : '#1976d2' 
                                              }} />
                                              <Box sx={{ 
                                                flex: 1, 
                                                height: '10px', 
                                                backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)', 
                                                borderRadius: '5px', 
                                                overflow: 'hidden',
                                                border: '1px solid',
                                                borderColor: darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'
                                              }}>
                                                <Box
                                                  sx={{
                                                    height: '100%',
                                                    width: `${percentage}%`,
                                                    backgroundColor: darkMode ? '#90caf9' : '#1976d2',
                                                    transition: 'width 0.5s ease-in-out'
                                                  }}
                                                />
                                              </Box>
                                              <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                  ml: 1.5, 
                                                  minWidth: '30px', 
                                                  color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                                                  fontWeight: 500
                                                }}
                                              >
                                                {count}
                                              </Typography>
                                            </Box>
                                          );
                                        })}
                                      </Box>
                                    </Box>
                                    
                                    <Typography 
                                      variant="h6" 
                                      sx={{ 
                                        mt: 4, 
                                        mb: 2, 
                                        color: darkMode ? '#fff' : '#333',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        borderBottom: '1px solid',
                                        borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                        pb: 1
                                      }}
                                    >
                                      Felhasználói vélemények
                                    </Typography>
                        
                                    <List sx={{ mt: 2 }}>
                                      {ratings.length > 0 ? (
                                        ratings.map((rating) => (
                                          <Box 
                                            key={rating.rating_id} 
                                            sx={{ 
                                              mb: 2.5, 
                                              p: 2.5, 
                                              borderRadius: '10px', 
                                              backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'white',
                                              border: '1px solid',
                                              borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)',
                                              boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.05)',
                                              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                                              '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: darkMode ? '0 5px 15px rgba(0,0,0,0.2)' : '0 5px 15px rgba(0,0,0,0.08)'
                                              }
                                            }}
                                          >
                                            <Box sx={{ 
                                              display: 'flex', 
                                              justifyContent: 'space-between', 
                                              alignItems: 'center', 
                                              mb: 1.5,
                                              pb: rating.velemeny ? 1.5 : 0,
                                              borderBottom: rating.velemeny ? '1px solid' : 'none',
                                              borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                                            }}>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar
                                                  src={rating.rater_profile_image}
                                                  sx={{
                                                    width: 40,
                                                    height: 40,
                                                    bgcolor: !rating.rater_profile_image ? (darkMode ? '#1976d2' : '#1976d2') : 'transparent',
                                                    fontSize: '1rem',
                                                    border: '2px solid',
                                                    borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(25, 118, 210, 0.5)'
                                                  }}
                                                >
                                                  {rating.rater_username ? rating.rater_username.charAt(0).toUpperCase() : '?'}
                                                </Avatar>
                                                <Box>
                                                  <Typography 
                                                    variant="subtitle1"
                                                    sx={{
                                                      fontWeight: 600,
                                                      color: darkMode ? '#fff' : '#333',
                                                      fontSize: '0.95rem'
                                                    }}
                                                  >
                                                    {rating.rater_username || 'Ismeretlen felhasználó'}
                                                  </Typography>
                                                  <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                      display: 'block', 
                                                      color: darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)',
                                                      fontSize: '0.75rem'
                                                    }}
                                                  >
                                                    {new Date(rating.date).toLocaleDateString('hu-HU', { 
                                                      year: 'numeric', 
                                                      month: 'long', 
                                                      day: 'numeric' 
                                                    })}
                                                  </Typography>
                                                </Box>
                                              </Box>
                                              <Box sx={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'flex-end'
                                              }}>
                                                <Rating 
                                                  value={rating.rating} 
                                                  readOnly 
                                                  size="small"
                                                  sx={{
                                                    '& .MuiRating-iconFilled': {
                                                      color: darkMode ? '#90caf9' : '#1976d2',
                                                    },
                                                    '& .MuiRating-iconEmpty': {
                                                      color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                                                    }
                                                  }}
                                                />
                                                <Typography 
                                                  variant="h6" 
                                                  sx={{ 
                                                    color: darkMode ? '#90caf9' : '#1976d2',
                                                    fontWeight: 700,
                                                    fontSize: '1.1rem',
                                                    mt: 0.5
                                                  }}
                                                >
                                                  {rating.rating.toFixed(1)}
                                                </Typography>
                                              </Box>
                                            </Box>
                                            
                                            {rating.velemeny && (
                                              <Typography 
                                                variant="body2" 
                                                sx={{ 
                                                  mt: 1.5, 
                                                  color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
                                                  lineHeight: 1.6,
                                                  fontSize: '0.9rem',
                                                  backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                  p: 1.5,
                                                  borderRadius: '8px',
                                                  borderLeft: '3px solid',
                                                  borderColor: darkMode ? '#90caf9' : '#1976d2'
                                                }}
                                              >
                                                {rating.velemeny}
                                              </Typography>
                                            )}
                                          </Box>
                                        ))
                                      ) : (
                                        <Box sx={{
                                          textAlign: 'center', 
                                          py: 4, 
                                          px: 2,
                                          backgroundColor: darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                          borderRadius: '10px',
                                          border: '1px dashed',
                                          borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                        }}>
                                          <Typography 
                                            variant="body1" 
                                            sx={{ 
                                              color: darkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                                              fontWeight: 500
                                            }}
                                          >
                                            Még nincsenek értékelések erről a feltöltőről.
                                          </Typography>
                                          <Typography 
                                            variant="body2" 
                                            sx={{ 
                                              color: darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                              mt: 1
                                            }}
                                          >
                                            Legyél te az első, aki értékelést ír!
                                          </Typography>
                                        </Box>
                                      )}
                                    </List>
                                  </>
                                )}
                              </Paper>
                              
                              <Dialog
                                open={openDialog}
                                onClose={handleCloseDialog}
                                PaperProps={{
                                  sx: {
                                    backgroundColor: darkMode ? '#333' : '#fff',
                                    color: darkMode ? '#fff' : '#333',
                                    borderRadius: '12px',
                                    maxWidth: '500px',
                                    width: '100%',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                    border: '1px solid',
                                    borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                  }
                                }}
                              >
                                <DialogTitle sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  borderBottom: '1px solid',
                                  borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                  padding: '16px 24px'
                                }}>
                                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {username} értékelése
                                  </Typography>
                                  
                                  <IconButton
                                    onClick={handleCloseDialog}
                                    size="small"
                                    sx={{
                                      color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
                                      '&:hover': {
                                        backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                                      }
                                    }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </DialogTitle>
                        
                                <DialogContent sx={{ mt: 2, px: 3, py: 2 }}>
                                  <Typography 
                                    variant="body1" 
                                    sx={{ 
                                      mb: 2, 
                                      color: darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)',
                                      fontWeight: 500
                                    }}
                                  >
                                    Értékeld {username} feltöltőt:
                                  </Typography>
                                  
                                  <Box sx={{ 
                                    display: 'flex', 
                                    flexDirection: 'column',
                                    alignItems: 'center', 
                                    my: 3,
                                    p: 2,
                                    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                                    borderRadius: '10px'
                                  }}>
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        mb: 1, 
                                        color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                                        alignSelf: 'center'
                                      }}
                                    >
                                      Válassz értékelést:
                                    </Typography>
                                    
                                    <Rating
                                      name="user-rating"
                                      value={userRating}
                                      onChange={(event, newValue) => {
                                        setUserRating(newValue);
                                      }}
                                      size="large"
                                      sx={{
                                        '& .MuiRating-iconFilled': {
                                          color: darkMode ? '#90caf9' : '#1976d2',
                                        },
                                        '& .MuiRating-iconEmpty': {
                                          color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
                                        },
                                        fontSize: '2rem',
                                        mt: 1
                                      }}
                                    />
                                    
                                    {userRating > 0 && (
                                      <Typography 
                                        variant="body1" 
                                        sx={{ 
                                          mt: 1.5, 
                                          color: darkMode ? '#90caf9' : '#1976d2',
                                          fontWeight: 600
                                        }}
                                      >
                                        {userRating === 5 ? 'Kiváló!' : 
                                          userRating === 4 ? 'Nagyon jó' : 
                                          userRating === 3 ? 'Megfelelő' : 
                                          userRating === 2 ? 'Gyenge' : 
                                          userRating === 1 ? 'Rossz' : ''}
                                      </Typography>
                                    )}
                                  </Box>
                                  
                                  <TextField
                                    label="Vélemény (opcionális)"
                                    multiline
                                    rows={4}
                                    fullWidth
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    variant="outlined"
                                    placeholder="Írd le véleményed a feltöltőről..."
                                    sx={{
                                      mt: 2,
                                      '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                          borderColor: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                                          borderWidth: '1px',
                                          borderRadius: '8px'
                                        },
                                        '&:hover fieldset': {
                                          borderColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                                        },
                                        '&.Mui-focused fieldset': {
                                          borderColor: darkMode ? '#90caf9' : '#1976d2',
                                          borderWidth: '2px'
                                        },
                                        color: darkMode ? '#fff' : 'inherit',
                                        borderRadius: '8px'
                                      },
                                      '& .MuiInputLabel-root': {
                                        color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                                      },
                                      '& .MuiInputLabel-root': {
                                        color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                                      },
                                      '& .MuiInputLabel-root.Mui-focused': {
                                        color: darkMode ? '#90caf9' : '#1976d2',
                                      },
                                    }}
                                  />
                                </DialogContent>
                                
                                <DialogActions sx={{ 
                                  p: 3, 
                                  pt: 1,
                                  borderTop: '1px solid',
                                  borderColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                  mt: 2
                                }}>
                                  <Button
                                    onClick={handleCloseDialog}
                                    sx={{
                                      color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                                      fontWeight: 500,
                                      borderRadius: '8px',
                                      padding: '8px 16px',
                                      '&:hover': {
                                        backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                      }
                                    }}
                                  >
                                    Mégse
                                  </Button>
                                  
                                  <Button
                                    onClick={handleSubmitRating}
                                    disabled={!userRating || submitting}
                                    variant="contained"
                                    sx={{
                                      backgroundColor: darkMode ? '#90caf9' : '#1976d2',
                                      color: darkMode ? '#333' : '#fff',
                                      fontWeight: 600,
                                      borderRadius: '8px',
                                      padding: '8px 20px',
                                      boxShadow: darkMode ? 'none' : '0 2px 8px rgba(25, 118, 210, 0.3)',
                                      '&:hover': {
                                        backgroundColor: darkMode ? '#42a5f5' : '#1565c0',
                                        boxShadow: darkMode ? 'none' : '0 4px 12px rgba(25, 118, 210, 0.4)',
                                      },
                                      '&.Mui-disabled': {
                                        backgroundColor: darkMode ? 'rgba(144, 202, 249, 0.5)' : 'rgba(25, 118, 210, 0.5)',
                                        color: darkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.5)',
                                      }
                                    }}
                                  >
                                    {submitting ? (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <CircularProgress size={16} sx={{ color: darkMode ? '#333' : '#fff' }} />
                                        <span>Küldés...</span>
                                      </Box>
                                    ) : (
                                      'Értékelés küldése'
                                    )}
                                  </Button>
                                </DialogActions>
                              </Dialog>
                              
                              <Snackbar
                                open={showSnackbar}
                                autoHideDuration={5000}
                                onClose={handleSnackbarClose}
                                anchorOrigin={{
                                  vertical: 'bottom',
                                  horizontal: 'center',
                                }}
                              >
                                <Alert
                                  onClose={handleSnackbarClose}
                                  severity={snackbarSeverity}
                                  variant="filled"
                                  sx={{
                                    width: '100%',
                                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                                    borderRadius: '8px',
                                    fontWeight: 500,
                                    '& .MuiAlert-icon': {
                                      color: darkMode ? '#fff' : undefined
                                    }
                                  }}
                                >
                                  {snackbarMessage}
                                </Alert>
                              </Snackbar>
                            </Box>
                          );
                        };
                        
                        export default UserRating;
                        
                        
