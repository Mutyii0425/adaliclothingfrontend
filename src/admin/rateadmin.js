import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, IconButton, Button,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Rating as MuiRating
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import { Tabs, Tab } from '@mui/material';
import Menu from '../menu2';

const RateAdmin = () => {
  const [ratings, setRatings] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRating, setEditingRating] = useState(null);
  const [sideMenuActive, setSideMenuActive] = useState(false);
  const [activeTab, setActiveTab] = useState('shop');
  const [shopRatings, setShopRatings] = useState([]);
  const [userRatings, setUserRatings] = useState([]);
  const navigate = useNavigate();

  const fetchShopRatings = async () => {
    try {
      const response = await fetch('http://localhost:5000/ratings/get-all-ratings');
      const data = await response.json();
      
      // Ellenőrizzük, hogy a válasz tartalmazza-e a felhasználóneveket
      if (Array.isArray(data)) {
        setShopRatings(data);
      } else {
        console.error('Unexpected response format:', data);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };
  
  const fetchUserRatings = async () => {
    try {
      const response = await fetch('http://localhost:5000/ratings/admin/all-user-ratings');
      
      if (!response.ok) {
        console.error('Server error:', response.status);
        setUserRatings([]);
        return;
      }
      
      const data = await response.json();
      console.log('Fetched user ratings:', data);
      setUserRatings(data);
    } catch (error) {
      console.error('Error fetching user ratings:', error);
      setUserRatings([]);
      // Ne jelenítsd meg a hibaüzenetet a felhasználónak
    }
  };


  useEffect(() => {
    fetchShopRatings();
    fetchUserRatings();
  }, []);

  const handleEditUserRating = (rating) => {
    setEditingRating(rating);
    setFormData({
      raterUsername: rating.rater_username,
      ratedUsername: rating.rated_username,
      rating: rating.rating,
      velemeny: rating.velemeny
    });
    setOpenDialog(true);
  };

  const handleDeleteUserRating = async (id) => {
    if (window.confirm('Biztosan törölni szeretnéd ezt a felhasználói értékelést?')) {
      try {
        const response = await fetch(`http://localhost:5000/ratings/admin/delete-user-rating/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          fetchUserRatings();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  

  const [formData, setFormData] = useState({
    id: null,
    felhasznalonev: '',  // Webshop értékelésekhez
    f_azonosito: null,   // Webshop értékelésekhez (adatbázisban)
    rating: 0,
    velemeny: '',
    // Felhasználói értékelésekhez
    raterUsername: '',
    ratedUsername: ''
  });

  const fetchRatings = async () => {
    try {
      const response = await fetch('http://localhost:5000/ratings/get-all-ratings');
      const data = await response.json();
      setRatings(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchRatings();
  }, []);

  const handleEdit = (rating) => {
    if (activeTab === 'shop') {
      // Webshop értékelés szerkesztése
      setFormData({
        id: rating.rating_id,
        felhasznalonev: rating.felhasznalonev, // A felhasználónév a user táblából jön
        f_azonosito: rating.f_azonosito,       // Az f_azonosito a ratings táblából
        rating: rating.rating,
        velemeny: rating.velemeny || ''
      });
    } else {
      // Felhasználói értékelés szerkesztése
      setFormData({
        id: rating.rating_id,
        raterUsername: rating.rater_username,
        ratedUsername: rating.rated_username,
        rating: rating.rating,
        velemeny: rating.velemeny || ''
      });
    }
    setOpenDialog(true);
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'shop') {
        // Webshop értékelés mentése/frissítése
        if (formData.id) {
          // Meglévő értékelés frissítése
          // ...
        } else {
          // Új értékelés hozzáadása
          console.log('Adding new shop rating:', formData);
          
          // Ellenőrizzük, hogy a felhasználónév meg van-e adva
          if (!formData.felhasznalonev) {
            alert('Kérlek add meg a felhasználónevet!');
            return;
          }
          
          // Ellenőrizzük, hogy az értékelés meg van-e adva
          if (!formData.rating) {
            alert('Kérlek add meg az értékelést!');
            return;
          }
          
          const response = await fetch('http://localhost:5000/ratings/add-rating', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              felhasznalonev: formData.felhasznalonev,
              rating: formData.rating,
              velemeny: formData.velemeny
            })
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server error: ${response.status} - ${errorText}`);
          }
          
          const data = await response.json();
          console.log('Response from add-rating:', data);
          
          if (data.success) {
            fetchShopRatings();
            setOpenDialog(false);
            setFormData({
              id: null,
              felhasznalonev: '',
              f_azonosito: null,
              rating: 0,
              velemeny: ''
            });
          } else {
            console.error('Failed to add rating:', data.error);
            alert('Hiba történt az értékelés hozzáadásakor: ' + (data.error || 'Ismeretlen hiba'));
          }
        }
      } else {
        // Felhasználói értékelés mentése/frissítése
        handleSaveUserRating();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Hiba történt: ' + error.message);
    }
  };
  
  

  const handleDelete = async (id) => {
    try {
      if (activeTab === 'shop') {
        // Webshop értékelés törlése
        const response = await fetch(`http://localhost:5000/ratings/delete-rating/${id}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
          fetchShopRatings();
        }
      } else {
        // Felhasználói értékelés törlése
        const response = await fetch(`http://localhost:5000/ratings/admin/delete-user-rating/${id}`, {
          method: 'DELETE'
        });
        const data = await response.json();
        
        if (data.success) {
          fetchUserRatings();
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSaveUserRating = async () => {
    try {
      if (formData.id) {
        // Meglévő felhasználói értékelés frissítése
        // ...
      } else {
        // Új felhasználói értékelés hozzáadása
        console.log('Sending user rating data:', {
          raterUsername: formData.raterUsername,
          ratedUsername: formData.ratedUsername,
          rating: formData.rating,
          velemeny: formData.velemeny
        });
        
        const response = await fetch('http://localhost:5000/ratings/admin/add-user-rating', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            raterUsername: formData.raterUsername,
            ratedUsername: formData.ratedUsername,
            rating: formData.rating,
            velemeny: formData.velemeny
          })
        });
        
        // Ellenőrizzük a válasz státuszkódját
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error:', response.status, errorText);
          
          try {
            // Próbáljuk meg JSON-ként értelmezni a választ
            const errorData = JSON.parse(errorText);
            alert('Hiba: ' + (errorData.error || 'Ismeretlen hiba'));
          } catch (e) {
            // Ha nem JSON, akkor egyszerűen megjelenítjük a szöveget
            alert('Szerver hiba: ' + response.status + ' - ' + errorText);
          }
          return;
        }
        
        const data = await response.json();
        console.log('Response from add-user-rating:', data);
        
        if (data.success) {
          fetchUserRatings();
          setOpenDialog(false);
          setFormData({
            id: null,
            raterUsername: '',
            ratedUsername: '',
            rating: 0,
            velemeny: ''
          });
        } else {
          console.error('Failed to add user rating:', data.error);
          alert('Hiba történt az értékelés hozzáadásakor: ' + (data.error || 'Ismeretlen hiba'));
        }
      }
    } catch (error) {
      console.error('Error in handleSaveUserRating:', error);
      alert('Hiba történt: ' + error.message);
    }
  };

  return (
    <Box sx={{
      backgroundColor: '#333',
      minHeight: '100vh',
      transition: 'all 0.3s ease-in-out'
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#333',
        padding: '10px 20px',
        position: 'relative',
        width: '100%',
        boxSizing: 'border-box',
      }}>
        <IconButton
          onClick={() => setSideMenuActive(true)}
          sx={{ color: 'white' }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: 'rgba(255,255,255,0.7)',
              '&.Mui-selected': { color: '#60BA97' }
            },
            '& .MuiTabs-indicator': { backgroundColor: '#60BA97' }
          }}
        >
          <Tab label="Webshop értékelések" value="shop" />
          <Tab label="Felhasználói értékelések" value="user" />
        </Tabs>
      </Box>

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

      {/* Side Menu */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: sideMenuActive ? 0 : '-250px',
        width: '250px',
        height: '100%',
        backgroundColor: '#fff',
        boxShadow: '4px 0px 10px rgba(0, 0, 0, 0.2)',
        zIndex: 1200,
        transition: 'left 0.3s ease-in-out',
      }}>
        <Menu sideMenuActive={sideMenuActive} toggleSideMenu={() => setSideMenuActive(false)} />
      </Box>

      

      <Box sx={{ p: 4, mt: 4 }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 4
        }}>
          <Typography variant="h4" sx={{
            color: '#fff',
            fontWeight: 'bold'
          }}>
            {activeTab === 'shop' ? 'Webshop értékelések kezelése' : 'Felhasználói értékelések kezelése'}
          </Typography>
          <Button
  startIcon={<AddIcon />}
  onClick={() => {
    setEditingRating(null);
    setFormData({
      id: null,  // Fontos, hogy ez null legyen
      felhasznalonev: '',
      rating: 0,
      velemeny: '',
      raterUsername: '',
      ratedUsername: ''
    });
    setOpenDialog(true);
  }}
  variant="contained"
>
  Új értékelés
</Button>

        </Box>

        {activeTab === 'shop' ? (
  // Webshop értékelések megjelenítése
  <Box sx={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 3
  }}>
    {shopRatings.map((rating) => (
      <Card
        key={rating.rating_id}
        sx={{
          backgroundColor: '#444',
          color: '#fff',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)'
          }
        }}
      >
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {rating.felhasznalonev}
          </Typography>
          <MuiRating
            value={Number(rating.rating)}
            readOnly
            sx={{ mb: 2 }}
          />
          <Typography sx={{ mb: 2, minHeight: '60px' }}>
            {rating.velemeny}
          </Typography>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="caption" sx={{ color: '#aaa' }}>
              {new Date(rating.date).toLocaleDateString()}
            </Typography>
            <Box>
              <IconButton
                onClick={() => handleEdit(rating)}
                sx={{
                  color: '#60BA97',
                  '&:hover': { backgroundColor: 'rgba(96, 186, 151, 0.1)' }
                }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                onClick={() => handleDelete(rating.rating_id)}
                sx={{
                  color: '#ff4444',
                  '&:hover': { backgroundColor: 'rgba(255, 68, 68, 0.1)' }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    ))}
  </Box>
) : (
  // Felhasználói értékelések megjelenítése
  <Box sx={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 3
  }}>
    {userRatings.map((rating) => (
      <Card
        key={rating.rating_id}
        sx={{
          backgroundColor: '#444',
          color: '#fff',
          transition: 'transform 0.2s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)'
          }
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6">
              {rating.rater_username}
            </Typography>
            <Typography variant="body2" sx={{ color: '#aaa' }}>
              értékelte: {rating.rated_username}
            </Typography>
          </Box>
          <MuiRating
            value={Number(rating.rating)}
            readOnly
            sx={{ mb: 2 }}
          />
          <Typography sx={{ mb: 2, minHeight: '60px' }}>
            {rating.velemeny}
          </Typography>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="caption" sx={{ color: '#aaa' }}>
              {new Date(rating.date).toLocaleDateString()}
            </Typography>
            <Box>
              <IconButton
                onClick={() => handleEdit(rating)}
                sx={{
                  color: '#60BA97',
                  '&:hover': { backgroundColor: 'rgba(96, 186, 151, 0.1)' }
                }}
              >
                <EditIcon />
              </IconButton>
              <IconButton
                onClick={() => handleDelete(rating.rating_id)}
                sx={{
                  color: '#ff4444',
                  '&:hover': { backgroundColor: 'rgba(255, 68, 68, 0.1)' }
                }}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    ))}
  </Box>
)}
</Box>

<Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
  <DialogTitle>
    {formData.id 
      ? (activeTab === 'shop' ? 'Webshop értékelés szerkesztése' : 'Felhasználói értékelés szerkesztése')
      : (activeTab === 'shop' ? 'Új webshop értékelés' : 'Új felhasználói értékelés')
    }
  </DialogTitle>
  <DialogContent>
    {activeTab === 'shop' ? (
      // Webshop értékelés űrlap
      <>
        <TextField
          fullWidth
          label="Felhasználónév"
          value={formData.felhasznalonev || ''}
          onChange={(e) => setFormData({...formData, felhasznalonev: e.target.value})}
          margin="normal"
          disabled={formData.id !== null} // Csak új értékelésnél szerkeszthető
        />
        <Box sx={{ my: 2 }}>
          <Typography component="legend">Értékelés</Typography>
          <MuiRating
            name="rating"
            value={Number(formData.rating) || 0}
            onChange={(event, newValue) => {
              setFormData({...formData, rating: newValue});
            }}
          />
        </Box>
        <TextField
          fullWidth
          label="Vélemény"
          value={formData.velemeny || ''}
          onChange={(e) => setFormData({...formData, velemeny: e.target.value})}
          margin="normal"
          multiline
          rows={4}
        />
      </>
    ) : (
      // Felhasználói értékelés űrlap
      <>
        <TextField
          fullWidth
          label="Értékelő felhasználó"
          value={formData.raterUsername || ''}
          onChange={(e) => setFormData({...formData, raterUsername: e.target.value})}
          margin="normal"
          disabled={formData.id !== null} // Csak új értékelésnél szerkeszthető
        />
        <TextField
          fullWidth
          label="Értékelt felhasználó"
          value={formData.ratedUsername || ''}
          onChange={(e) => setFormData({...formData, ratedUsername: e.target.value})}
          margin="normal"
          disabled={formData.id !== null} // Csak új értékelésnél szerkeszthető
        />
        <Box sx={{ my: 2 }}>
          <Typography component="legend">Értékelés</Typography>
          <MuiRating
            name="rating"
            value={Number(formData.rating) || 0}
            onChange={(event, newValue) => {
              setFormData({...formData, rating: newValue});
            }}
          />
        </Box>
        <TextField
          fullWidth
          label="Vélemény"
          value={formData.velemeny || ''}
          onChange={(e) => setFormData({...formData, velemeny: e.target.value})}
          margin="normal"
          multiline
          rows={4}
        />
      </>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenDialog(false)}>Mégse</Button>
    <Button onClick={handleSave} variant="contained" color="primary">
      Mentés
    </Button>
  </DialogActions>
</Dialog>

      <Button
        onClick={() => navigate('/admin')}
        variant="contained"
        sx={{
          left: 30,
          mb: 3,
          backgroundColor: '#333',
          '&:hover': {
            backgroundColor: '#555'
          }
        }}
      >
        Vissza az admin felületre
      </Button>
    </Box>
  );
};

export default RateAdmin;
