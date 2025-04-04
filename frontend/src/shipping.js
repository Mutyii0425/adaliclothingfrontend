import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Dialog, Zoom, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Rating } from '@mui/material';
import InactivityAlert from './InactivityAlert';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  Divider,
  createTheme,
  ThemeProvider,
  Snackbar,
  Alert,
  AlertTitle,
  Slide,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormHelperText,
  Paper
} from '@mui/material';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaymentIcon from '@mui/icons-material/Payment';


export default function Shipping() {
    const location = useLocation();
    const navigate = useNavigate();
    const { cartItems = [], totalPrice = 0 } = location.state || {};
    const [discountPercentage, setDiscountPercentage] = useState(0);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [darkMode, setDarkMode] = useState(true);
    const validTotalPrice = !isNaN(totalPrice) && totalPrice !== null ? totalPrice : 0;
    const validDiscountPercentage = !isNaN(discountPercentage) && discountPercentage !== null ? discountPercentage : 0;
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
    const [setTotal] = useState(0);
    const [alertOpen, setAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');
    const [alertSeverity, setAlertSeverity] = useState('success'); 
    const [alertTitle, setAlertTitle] = useState('');
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [formErrors, setFormErrors] = useState({});
    const [orderId, setOrderId] = useState(null);
    const [orderItems, setOrderItems] = useState([]); 
    const [finalPriceState, setFinalPriceState] = useState(0);
    const [orderData, setOrderData] = useState({
      nev: '',
      telefonszam: '',
      email: '',
      irsz: '',
      telepules: '',
      kozterulet: '',
      fizetesi_mod: 'utanvet'
    });

const showAlert = (message, severity = 'error', title = '') => {
  setAlertMessage(message);
  setAlertSeverity(severity);
  setAlertTitle(title);
  setAlertOpen(true);
};

const discountAmount = Math.round((totalPrice * discountPercentage) / 100);
const shippingCost = totalPrice > 19999 ? 0 : 1590;
const finalPrice = totalPrice - discountAmount + shippingCost;

const validateCoupon = async () => {
  if (!couponCode) {
    showAlert('Kérjük, add meg a kuponkódot!', 'warning', 'Hiányzó adat');
    return;
  }
  
  setIsValidatingCoupon(true);
  try {
    const response = await fetch('http://localhost:5000/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ couponCode })
    });
    
    const data = await response.json();
    
    if (data.success) {
      setCouponDiscount(data.discount);
      // Újraszámoljuk a végösszeget a kedvezménnyel
      calculateTotalWithDiscount(data.discount);
      showAlert('Kupon sikeresen érvényesítve!', 'success', 'Siker');
    } else {
      showAlert(data.message || 'Érvénytelen kuponkód', 'error', 'Hiba');
      setCouponDiscount(0);
    }
  } catch (error) {
    console.error('Kupon érvényesítési hiba:', error);
    showAlert('Hiba történt a kupon érvényesítése során', 'error', 'Rendszerhiba');
  } finally {
    setIsValidatingCoupon(false);
  }
};

const calculateTotalWithDiscount = (discount) => {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.ar * item.mennyiseg), 0);
  const discountAmount = subtotal * (discount / 100);
  setTotal(subtotal - discountAmount);
};

const [errors, setErrors] = useState({
  nev: false,
  telefonszam: false,
  email: false,
  irsz: false,
  telepules: false,
  kozterulet: false
});
const validateForm = () => {
  const newErrors = {};
  let isValid = true;


  Object.keys(orderData).forEach(field => {
    if (!orderData[field].trim()) {
      newErrors[field] = true;
      isValid = false;
    } else {
      newErrors[field] = false;
    }
  });


  if (!orderData.email.includes('@')) {
    newErrors.email = true;
    isValid = false;
  }


  const irszRegex = /^\d{4}$/;
  if (!irszRegex.test(orderData.irsz)) {
    newErrors.irsz = true;
    isValid = false;
  }

 
  const phoneRegex = /^(\+36|06)[0-9]{9}$/;
  if (!phoneRegex.test(orderData.telefonszam)) {
    newErrors.telefonszam = true;
    isValid = false;
  }

  if (!orderData.fizetesi_mod) {
    newErrors.fizetesi_mod = 'Kérjük, válassz fizetési módot';
    isValid = false;
  }

  setErrors(newErrors);
  setFormErrors(newErrors);
  return isValid;
};

const handleApplyCoupon = async () => {
  if (!couponCode.trim()) {
    showAlert('Kérjük, add meg a kuponkódot!', 'warning', 'Hiányzó adat');
    return;
  }
  
  // Normalizáljuk a kuponkódot
  const normalizedCouponCode = couponCode.trim().toUpperCase();
  
  setIsApplyingCoupon(true);
  
  try {
    const userData = JSON.parse(localStorage.getItem('user')) || {};
    
    if (!userData.f_azonosito) {
      showAlert('Bejelentkezés szükséges a kupon használatához!', 'warning', 'Figyelmeztetés');
      setIsApplyingCoupon(false);
      return;
    }
    
    // Ellenőrizzük a kuponkódot közvetlenül
    const response = await fetch(`http://localhost:5000/api/coupons/check-coupon/${normalizedCouponCode}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Kupon ellenőrzés eredménye:', result);
    
    // Ellenőrizzük, hogy a kupon létezik-e
    const regCoupons = result.regCoupons || [];
    const emailCoupons = result.emailCoupons || [];
    const separateCoupons = result.separateCoupons || [];
    
    // Ellenőrizzük, hogy a kupon a felhasználóhoz tartozik-e
    const userRegCoupon = regCoupons.find(c => c.f_azonosito === userData.f_azonosito);
    const userEmailCoupon = emailCoupons.find(c => c.f_azonosito === userData.f_azonosito);
    const userSeparateCoupon = separateCoupons.find(c => c.user_id === userData.f_azonosito);
    
    if (userRegCoupon && !userRegCoupon.kupon_hasznalva) {
      // Kinyerjük a kedvezmény mértékét
      const discountMatch = userRegCoupon.kupon ? userRegCoupon.kupon.match(/(\d+)%/) : null;
      const discount = discountMatch ? parseInt(discountMatch[1]) : 15; // Alapértelmezett 15%
      
      setAppliedCoupon({
        code: normalizedCouponCode,
        discount: discount,
        type: 'registration'
      });
      setDiscountPercentage(discount);
      showAlert(`${discount}% kedvezmény sikeresen alkalmazva!`, 'success', 'Kupon beváltva');
      
    } else if (userEmailCoupon && !userEmailCoupon.email_kupon_hasznalva) {
      // Kinyerjük a kedvezmény mértékét
      const discountMatch = userEmailCoupon.email_kupon ? userEmailCoupon.email_kupon.match(/(\d+)%/) : null;
      const discount = discountMatch ? parseInt(discountMatch[1]) : 10; // Alapértelmezett 10%
      
      setAppliedCoupon({
        code: normalizedCouponCode,
        discount: discount,
        type: 'email'
      });
      setDiscountPercentage(discount);
      showAlert(`${discount}% kedvezmény sikeresen alkalmazva!`, 'success', 'Kupon beváltva');
      
    } else if (userSeparateCoupon && !userSeparateCoupon.is_used) {
      // Használjuk a külön tábla adatait
      const discount = userSeparateCoupon.discount || 15;
      
      setAppliedCoupon({
        code: normalizedCouponCode,
        discount: discount,
        type: userSeparateCoupon.type || 'standard'
      });
      setDiscountPercentage(discount);
      showAlert(`${discount}% kedvezmény sikeresen alkalmazva!`, 'success', 'Kupon beváltva');
     
    } else if (regCoupons.length > 0 || emailCoupons.length > 0 || separateCoupons.length > 0) {
      // A kupon létezik, de nem ehhez a felhasználóhoz tartozik vagy már használt
      showAlert('Ez a kupon nem a te fiókodhoz tartozik vagy már fel lett használva!', 'error', 'Érvénytelen kupon');
      setDiscountPercentage(0);
      setAppliedCoupon(null);
    } else {
      // A kupon nem létezik
      showAlert('A megadott kuponkód nem létezik!', 'error', 'Érvénytelen kupon');
      setDiscountPercentage(0);
      setAppliedCoupon(null);
    }
  } catch (error) {
    console.error('Hiba a kupon ellenőrzésekor:', error);
    showAlert('Hiba történt a kupon ellenőrzése során. Kérjük, próbáld újra később!', 'error', 'Rendszerhiba');
  } finally {
    setIsApplyingCoupon(false);
  }
};

const handleSubmitOrder = async () => {
  if (!validateForm()) {
    showAlert('Kérjük, töltsd ki helyesen az összes kötelező mezőt!', 'warning', 'Hiányos adatok');
    return;
  }

  setIsLoading(true);
  try {
    // Vevő létrehozása
    const vevoResponse = await fetch('http://localhost:5000/vevo/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nev: orderData.nev,
        telefonszam: orderData.telefonszam,
        email: orderData.email,
        irsz: orderData.irsz,
        telepules: orderData.telepules,
        kozterulet: orderData.kozterulet,
        fizetesi_mod: orderData.fizetesi_mod || 'utanvet'
      })
    });

    if (!vevoResponse.ok) {
      const errorData = await vevoResponse.json();
      throw new Error(errorData.error || 'Hiba történt a rendelés során');
    }

    const vevoResult = await vevoResponse.json();
    
    // Tárold el a vevoResult.id-t a state változóban
    setOrderId(vevoResult.id);

    // Ha van alkalmazott kupon, jelöljük használtként
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData && appliedCoupon) {
      try {
        // A kupon típusától függően különböző végpontot hívunk meg
        const endpoint = appliedCoupon.type === 'email' 
          ? 'http://localhost:5000/api/coupons/mark-email-coupon-used'
          : 'http://localhost:5000/api/coupons/mark-coupon-used';
          
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userData.f_azonosito,
            couponCode: appliedCoupon.code
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          // Frissítjük a localStorage-ben tárolt adatokat
          if (appliedCoupon.type === 'email') {
            userData.email_kupon_hasznalva = 1;
          } else {
            userData.kupon_hasznalva = 1;
          }
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          console.error('Hiba a kupon használtként jelölésekor:', result.error);
        }
      } catch (error) {
        console.error('Hiba a kupon használtként jelölésekor:', error);
      }
    }

    // Optimalizált kosár elemek létrehozása
    const optimizedCartItems = cartItems.map(item => ({
      id: item.id,
      nev: item.nev,
      ar: item.ar,
      mennyiseg: item.mennyiseg,
      size: item.size || item.meret,
      imageUrl: item.imageUrl
    }));
    
    // Tárold el az optimizedCartItems-t a state változóban
    setOrderItems(optimizedCartItems);
    
    // Tárold el a végösszeget is
    setFinalPriceState(finalPrice);

    // Termékek rendelése
    for (const item of cartItems) {
      const orderResponse = await fetch('http://localhost:5000/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          termek: item.id,
          statusz: 'Feldolgozás alatt',
          mennyiseg: item.mennyiseg,
          vevo_id: vevoResult.id,
          ar: item.ar
        })
      });
      
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        
        if (errorData.error === 'Nincs elég készleten') {
          throw new Error(`A(z) "${item.nev}" termékből csak ${errorData.available} db van készleten, de ${errorData.requested} db-ot próbált rendelni.`);
        }
        throw new Error(errorData.error || 'Hiba történt a rendelés során');
      }
      
      // Készlet csökkentése
      await fetch(`http://localhost:5000/termekek/${item.id}/stock`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: item.mennyiseg })
      });
    }

    const emailResponse = await fetch('http://localhost:5000/send-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: orderData.email,
        name: orderData.nev,
        orderId: vevoResult.id,
        orderItems: optimizedCartItems,
        shippingDetails: {
          phoneNumber: orderData.telefonszam,
          zipCode: orderData.irsz,
          city: orderData.telepules,
          address: orderData.kozterulet
        },
        totalPrice: finalPrice,
        discount: discountAmount, 
        shippingCost: validTotalPrice > 19999 ? "Ingyenes szállítás" : "1590 Ft",
        paymentMethod: orderData.fizetesi_mod === 'utanvet' ? 'Utánvét (készpénz átvételkor)' : 'Online bankkártyás fizetés'
      })
    });
    
    // Kosár ürítése
    localStorage.removeItem('cartItems');
    
    // Sikeres rendelés után mutassuk az értékelő ablakot
    setOrderSuccess(true);
    setIsLoading(false);
    
    // Fizetési mód kezelése - NEM irányítunk át azonnal, ezt majd az értékelés után tesszük
    if (orderData.fizetesi_mod === 'kartya') {
      // Csak jelezzük, hogy kártyás fizetés lesz
      showAlert('Rendelésed sikeresen elküldtük! Az értékelés után átirányítunk a fizetési oldalra.', 'success', 'Sikeres rendelés');
    } else {
      // Utánvétes fizetés esetén
      showAlert('Rendelésed sikeresen elküldtük! Hamarosan emailben értesítünk a részletekről.', 'success', 'Sikeres rendelés');
    }
    
  } catch (error) {
    setIsLoading(false);
    console.error('Rendelési hiba:', error);
    
    // Hiba alert
    showAlert(error.message || 'Hiba történt a rendelés feldolgozása során. Kérjük, próbáld újra később!', 'error', 'Rendelési hiba');
  }
};

      
const saveRatingToDatabase = async (rating, comment) => {
  try {
    const userData = JSON.parse(localStorage.getItem('user'));
    
    const response = await fetch('http://localhost:5000/ratings/order-feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: userData.email,
        username: userData.username || userData.felhasznalonev,
        rating,
        velemeny: comment || null
      })
    });
    
    const responseData = await response.json();
    
    if (response.ok) {
      console.log('Értékelés sikeresen mentve');
      
      // Ellenőrizzük a fizetési módot
      if (orderData.fizetesi_mod === 'kartya') {
        // Kártyás fizetés esetén átirányítás a szimulált fizetési oldalra
        navigate('/payment-simulation', { 
          state: { 
            orderId: orderId, // A state változót használjuk
            amount: finalPriceState, // A state változót használjuk
            items: orderItems, // A state változót használjuk
            shippingDetails: {
              name: orderData.nev,
              phoneNumber: orderData.telefonszam,
              zipCode: orderData.irsz,
              city: orderData.telepules,
              address: orderData.kozterulet
            }
          } 
        });
      } else {
        // Utánvétes fizetés esetén átirányítás a kezdőlapra
        navigate('/kezdolap'); 
      }
      return true;
    } else {
      console.error('Hiba az értékelés mentésekor:', responseData.error);
      // Hiba esetén is irányítsuk át a felhasználót a megfelelő oldalra
      if (orderData.fizetesi_mod === 'kartya') {
        navigate('/payment-simulation', { 
          state: { 
            orderId: orderId, // A state változót használjuk
            amount: finalPriceState, // A state változót használjuk
            items: orderItems, // A state változót használjuk
            shippingDetails: {
              name: orderData.nev,
              phoneNumber: orderData.telefonszam,
              zipCode: orderData.irsz,
              city: orderData.telepules,
              address: orderData.kozterulet
            }
          } 
        });
      } else {
        navigate('/kezdolap');
      }
      return false;
    }
  } catch (error) {
    console.error('Hiba az értékelés mentésekor:', error);
    // Hiba esetén is irányítsuk át a felhasználót a megfelelő oldalra
    if (orderData.fizetesi_mod === 'kartya') {
      navigate('/payment-simulation', { 
        state: { 
          orderId: orderId, // A state változót használjuk
          amount: finalPriceState, // A state változót használjuk
          items: orderItems, // A state változót használjuk
          shippingDetails: {
            name: orderData.nev,
            phoneNumber: orderData.telefonszam,
            zipCode: orderData.irsz,
            city: orderData.telepules,
            address: orderData.kozterulet
          }
        } 
      });
    } else {
      navigate('/kezdolap');
    }
    return false;
  }
};
    
  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
      borderRadius: 2,
      color: '#fff'
    },
    '& .MuiInputLabel-root': {
      color: '#fff'
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255,255,255,0.3)'
    },
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgba(255,255,255,0.5)'
    }
  };

  const theme = createTheme({
    components: {
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              '&:hover fieldset': {
                borderColor: darkMode ? '#666' : '#333',
              },
              '&.Mui-focused fieldset': {
                borderColor: darkMode ? '#888' : '#444',
              }
            }
          }
        }
      }
    }
  });     
  
  const [couponStatus, setCouponStatus] = useState({
    available: false,
    used: false
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      
      // Először ellenőrizzük a regisztrációs kupont
      if (user.kupon && !user.kupon_hasznalva) {
        // MÓDOSÍTÁS KEZDETE - Regisztrációs kupon
        if (user.kupon.includes('%')) {
          // Kinyerjük a kedvezmény mértékét
          const discountMatch = user.kupon.match(/(\d+)%/);
          if (discountMatch && discountMatch[1]) {
            const discountAmount = parseInt(discountMatch[1]);
            setDiscountPercentage(discountAmount);
            setCouponStatus({ 
              available: true, 
              used: false,
              type: 'registration'
            });
          }
        }
        // MÓDOSÍTÁS VÉGE
      } 
      // Ha nincs érvényes regisztrációs kupon, ellenőrizzük az email kupont
      else if (user.email_kupon && !user.email_kupon_hasznalva) {
        // MÓDOSÍTÁS KEZDETE - Email kupon
        if (user.email_kupon.includes('%')) {
          // Kinyerjük a kedvezmény mértékét
          const discountMatch = user.email_kupon.match(/(\d+)%/);
          if (discountMatch && discountMatch[1]) {
            const discountAmount = parseInt(discountMatch[1]);
            setDiscountPercentage(discountAmount);
            setCouponStatus({ 
              available: true, 
              used: false,
              type: 'email'
            });
          }
        }
        // MÓDOSÍTÁS VÉGE
      }
      // Ha egyik kupon sem érvényes
      else {
        setCouponStatus({ 
          available: false, 
          used: true 
        });
        setDiscountPercentage(0);
      }
    }
  }, []);
  

  const fetchUserCoupons = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user')) || {};
      
      if (!userData.f_azonosito) {
        console.error('Nincs bejelentkezett felhasználó vagy hiányzik az azonosító');
        return;
      }
      
      // Ellenőrizd a helyes végpontot a backend kódban
      // Módosítsd az alábbi URL-t a megfelelő végpontra
      const response = await fetch(`http://localhost:5000/api/coupons/user-coupons/${userData.f_azonosito}`);
      
      if (!response.ok) {
        throw new Error('Hiba a kupon adatok lekérésekor');
      }
      
      const data = await response.json();
      
      // Frissítjük a localStorage-ban tárolt felhasználói adatokat
      if (data && data.length > 0) {
        // Először ellenőrizzük a regisztrációs kupont
        const activeRegCoupon = data.find(c => 
          c.type === 'registration' && !c.isUsed && !c.isExpired
        );
        
        // Aztán ellenőrizzük az email kupont
        const activeEmailCoupon = data.find(c => 
          c.type === 'email' && !c.isUsed && !c.isExpired
        );
        
        // Frissítjük a felhasználói adatokat
        if (activeRegCoupon) {
          userData.kupon = `${activeRegCoupon.discountValue}% kedvezmény: ${activeRegCoupon.code}`;
          userData.kupon_kod = activeRegCoupon.code;
          userData.kupon_hasznalva = activeRegCoupon.isUsed ? 1 : 0;
          userData.kupon_lejar = activeRegCoupon.expiresAt;
        }
        
        if (activeEmailCoupon) {
          userData.email_kupon = `${activeEmailCoupon.discountValue}% kedvezmény: ${activeEmailCoupon.code}`;
          userData.email_kupon_kod = activeEmailCoupon.code;
          userData.email_kupon_hasznalva = activeEmailCoupon.isUsed ? 1 : 0;
          userData.email_kupon_lejar = activeEmailCoupon.expiresAt;
        }
        
        localStorage.setItem('user', JSON.stringify(userData));
      }
      
      return data;
    } catch (error) {
      console.error('Hiba a kupon adatok lekérésekor:', error);
      return null;
    }
  };
  

  
  

  useEffect(() => {
    // Lekérjük a frissített felhasználói adatokat, beleértve a kupon információkat is
    fetchUserCoupons().then(coupons => {
      if (coupons && coupons.length > 0) {
        // A kupon állapotok frissítése a komponensben
        const activeCoupon = coupons.find(c => !c.isUsed && !c.isExpired);
        
        if (activeCoupon) {
          // Frissítjük a komponens állapotát
          setCouponStatus({ 
            available: true, 
            used: false,
            type: activeCoupon.type
          });
          
          // Beállítjuk a kedvezmény mértékét
          setDiscountPercentage(activeCoupon.discountValue);
        } else {
          setCouponStatus({ 
            available: false, 
            used: true 
          });
          setDiscountPercentage(0);
        }
      }
    });
  }, []);

    return (
      <ThemeProvider theme={theme}>
       <Box
  style={{
    backgroundColor: darkMode ? '#333' : '#f5f5f5',
    backgroundImage: darkMode 
      ? 'radial-gradient(#666 1px, transparent 1px)'
      : 'radial-gradient(#e0e0e0 1px, transparent 1px)',
    backgroundSize: '20px 20px',
    color: darkMode ? 'white' : 'black',
    minHeight: '100vh',
    transition: 'all 0.3s ease-in-out',
    display: 'flex',        
    alignItems: 'center',      
    justifyContent: 'center', 
    padding: '3rem 0'         
  }}
>
          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'flex',
                gap: 4,
                flexDirection: { xs: 'column', md: 'row' }
              }}
            >
             
              <Card
                elevation={8}
                sx={{
                  flex: 2,
                  backgroundColor: darkMode ? '#333' : '#fff',
                  borderRadius: 3,
                  padding: 4,
                  transition: 'transform 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-5px)'
                  }
                }}
              >
                <Typography 
                  variant="h4" 
                  gutterBottom 
                  sx={{ 
                    color: darkMode ? '#fff' : '#333',
                    borderBottom: '2px solid',
                    borderColor: darkMode ? '#555' : '#ddd',
                    paddingBottom: 2,
                    marginBottom: 4
                  }}
                >
                  Szállítási adatok
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
  <TextField
    fullWidth
    label="Név"
    value={orderData.nev}
    onChange={(e) => setOrderData({...orderData, nev: e.target.value})}
    error={errors.nev}
    helperText={errors.nev ? "Irja be a nevet!" : ""}
    sx={textFieldStyle}
  />
  <TextField
    fullWidth
    label="Telefonszám" 
    value={orderData.telefonszam}
    onChange={(e) => setOrderData({...orderData, telefonszam: e.target.value})}
    error={errors.telefonszam}
    inputProps={{ maxLength: 12 }}
    helperText={errors.telefonszam ?"Érvénytelen telefonszám (+36 vagy 06 kezdettel)!" : ""}
    sx={textFieldStyle}
  />
  <TextField
    fullWidth
    label="Email"
    value={orderData.email} 
    onChange={(e) => setOrderData({...orderData, email: e.target.value})}
    error={errors.email}
    helperText={errors.email ? "Érvénytelen email cím!" :  ""}
    sx={textFieldStyle}
  />
  <TextField
    fullWidth
    label="Irányítószám"
    value={orderData.irsz}
    onChange={(e) => setOrderData({...orderData, irsz: e.target.value})}
    error={errors.irsz} 
    inputProps={{ maxLength: 4 }}
    helperText={errors.irsz ? "Az irányítószámnak pontosan 4 számjegyből kell állnia!"  : ""}
    sx={textFieldStyle}
  />
  <TextField
    fullWidth
    label="Település"
    value={orderData.telepules}
    onChange={(e) => setOrderData({...orderData, telepules: e.target.value})}
    error={errors.telepules}
    helperText={errors.telepules ? "Irja be a település nevét!" : ""}
    sx={textFieldStyle}
  />
  <TextField
    fullWidth
    label="Közterület"
    value={orderData.kozterulet}
    onChange={(e) => setOrderData({...orderData, kozterulet: e.target.value})}
    error={errors.kozterulet}
    helperText={errors.kozterulet ? "Adja meg a közterületét!" : ""}
    sx={textFieldStyle}
  />
</Box>

<Box sx={{ mt: 2 }}>
  <Typography 
    sx={{ 
      color: darkMode ? '#fff' : '#333',
      mb: 2,
      fontWeight: 'medium',
      display: 'flex',
      alignItems: 'center'
    }}
  >
    <PaymentIcon sx={{ mr: 1, fontSize: '1.2rem', color: darkMode ? '#fff' : '#333' }} />
    Fizetési mód választása
  </Typography>
  
  <FormControl 
    component="fieldset" 
    error={!!formErrors?.fizetesi_mod} 
    sx={{ width: '100%' }}
  >
    <RadioGroup
      name="fizetesi_mod"
      value={orderData.fizetesi_mod || ''}
      onChange={(e) => {
        setOrderData({
          ...orderData,
          fizetesi_mod: e.target.value
        });
      }}
    >
      <Box 
        sx={{ 
          mb: 1.5, 
          p: 1,
          backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          borderRadius: 2,
          border: '1px solid',
          borderColor: darkMode ? 
            (orderData.fizetesi_mod === 'utanvet' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)') : 
            (orderData.fizetesi_mod === 'utanvet' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'),
          transition: 'all 0.2s ease'
        }}
      >
        <FormControlLabel
          value="utanvet"
          control={
            <Radio 
              sx={{ 
                color: darkMode ? '#fff' : '#666',
                '&.Mui-checked': {
                  color: darkMode ? '#90caf9' : '#1976d2',
                },
                padding: '4px'
              }} 
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocalAtmIcon sx={{ mr: 1, color: darkMode ? '#fff' : '#333', fontSize: '1rem' }} />
              <Typography sx={{ color: darkMode ? '#fff' : '#333', fontSize: '0.9rem' }}>
                Utánvét (készpénz átvételkor)
              </Typography>
            </Box>
          }
          sx={{ m: 0, py: 0.5 }}
        />
      </Box>

      <Box 
        sx={{ 
          p: 1,
          backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          borderRadius: 2,
          border: '1px solid',
          borderColor: darkMode ? 
            (orderData.fizetesi_mod === 'kartya' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)') : 
            (orderData.fizetesi_mod === 'kartya' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)'),
          transition: 'all 0.2s ease'
        }}
      >
        <FormControlLabel
          value="kartya"
          control={
            <Radio 
              sx={{ 
                color: darkMode ? '#fff' : '#666',
                '&.Mui-checked': {
                  color: darkMode ? '#90caf9' : '#1976d2',
                },
                padding: '4px'
              }} 
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CreditCardIcon sx={{ mr: 1, color: darkMode ? '#fff' : '#333', fontSize: '1rem' }} />
              <Typography sx={{ color: darkMode ? '#fff' : '#333', fontSize: '0.9rem' }}>
                Online bankkártyás fizetés
              </Typography>
            </Box>
          }
          sx={{ m: 0, py: 0.5 }}
        />
      </Box>
    </RadioGroup>
    {formErrors?.fizetesi_mod && (
      <FormHelperText error sx={{ ml: 1, mt: 1, color: '#ff6b6b' }}>
        {formErrors.fizetesi_mod}
      </FormHelperText>
    )}
  </FormControl>

  {orderData.fizetesi_mod === 'kartya' && (
    <Box sx={{ 
      mt: 2, 
      p: 1.5, 
      backgroundColor: darkMode ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)',
      borderRadius: 2,
      borderLeft: '3px solid',
      borderColor: darkMode ? '#90caf9' : '#1976d2'
    }}>
      <Typography variant="body2" sx={{ color: darkMode ? '#fff' : '#333', fontSize: '0.85rem' }}>
        A rendelés leadása után átirányítunk a biztonságos fizetési oldalra.
      </Typography>
    </Box>
  )}
  </Box>
              </Card>
             
              <Card
                elevation={8}
                sx={{
                  flex: 1,
                  backgroundColor: darkMode ? '#333' : '#fff',
                  borderRadius: 3,
                  padding: 4,
                  height: 'fit-content',
                  position: 'sticky',
                  top: 20
                }}
              >
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: darkMode ? '#fff' : '#333',
                    marginBottom: 3,
                    borderBottom: '2px solid',
                    borderColor: darkMode ? '#555' : '#ddd',
                    paddingBottom: 2
                  }}
                >
                  Rendelés összegzése
                </Typography>

                <Box sx={{ mb: 4 }}>
                  {cartItems.map((item, index) => (
                    <Box 
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 2,
                        padding: 2,
                        backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                        borderRadius: 2
                      }}
                    >
           <Typography sx={{ color: '#fff' }}>
           {item.nev} - Méret: {item.size || item.meret} (x{item.mennyiseg})
    </Typography>

    <Typography sx={{ color: '#fff' }}>
    {(item.ar * item.mennyiseg).toLocaleString()} Ft
    </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ mb: 3 }}>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
    <Typography sx={{ color: '#fff' }}>Részösszeg:</Typography>
    <Typography sx={{ color: '#fff' }}>
      {validTotalPrice.toLocaleString()} Ft
    </Typography>
  </Box>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
    <Typography sx={{ color: '#fff' }}>
      {validTotalPrice > 19999 ? 'Szállítási költség (ingyenes):' : 'Szállítási költség:'}
    </Typography>
    <Typography sx={{ color: '#fff' }}>
      {validTotalPrice > 19999 ? 'Ingyenes' : '1590 Ft'}
    </Typography>
  </Box>

  <Box sx={{ 
    mt: 3, 
    p: 2, 
    backgroundColor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
    borderRadius: 2
  }}>
    <Typography sx={{ color: '#fff', mb: 1 }}>Kuponkód:</Typography>
    <Box sx={{ display: 'flex', gap: 1 }}>
      <TextField
        fullWidth
        size="small"
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value)}
        placeholder="Add meg a kuponkódot"
        disabled={isApplyingCoupon || appliedCoupon !== null}
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'white',
            color: darkMode ? 'white' : 'black'
          }
        }}
      />
      <Button
        variant="contained"
        onClick={handleApplyCoupon}
        disabled={isApplyingCoupon || appliedCoupon !== null}
        sx={{
          backgroundColor: darkMode ? '#666' : '#333',
          '&:hover': {
            backgroundColor: darkMode ? '#777' : '#444',
          }
        }}
      >
        {isApplyingCoupon ? 'Ellenőrzés...' : 'Beváltás'}
      </Button>
    </Box>
    
    {appliedCoupon && (
      <Box sx={{ 
        mt: 2, 
        p: 1, 
        backgroundColor: darkMode ? 'rgba(100,255,100,0.1)' : 'rgba(100,255,100,0.05)',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Typography sx={{ color: darkMode ? '#4caf50' : '#2e7d32', fontSize: '0.875rem' }}>
          {appliedCoupon.discount}% kedvezmény alkalmazva
        </Typography>
        <Button 
          size="small" 
          onClick={() => {
            setAppliedCoupon(null);
            setDiscountPercentage(0);
            setCouponCode('');
          }}
          sx={{ color: darkMode ? '#ff6b6b' : '#d32f2f', fontSize: '0.75rem' }}
        >
          Eltávolítás
        </Button>
      </Box>
    )}
  </Box>
  
  {/* Kedvezmény megjelenítése */}
  {appliedCoupon && (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      mb: 2,
      backgroundColor: darkMode ? 'rgba(100,255,100,0.1)' : 'rgba(100,255,100,0.05)',
      padding: 2,
      borderRadius: 2,
      mt: 2
    }}>
      <Typography sx={{ color: darkMode ? '#4caf50' : '#2e7d32' }}>
        Kedvezmény ({appliedCoupon.discount}%):
      </Typography>
      <Typography sx={{ color: darkMode ? '#4caf50' : '#2e7d32' }}>
        -{discountAmount.toLocaleString()} Ft
      </Typography>
    </Box>
  )}


  {/* Add free shipping notification */}
  {totalPrice > 19999 && (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      mb: 2,
      backgroundColor: darkMode ? 'rgba(100,255,100,0.1)' : 'rgba(100,255,100,0.05)',
      padding: 2,
      borderRadius: 2
    }}>
      <Typography sx={{ color: darkMode ? '#4caf50' : '#2e7d32' }}>
        Ingyenes szállítás:
      </Typography>
      <Typography sx={{ color: darkMode ? '#4caf50' : '#2e7d32' }}>
        20 000 Ft feletti rendelés
      </Typography>
    </Box>
  )}

  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      mt: 3,
      backgroundColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
      padding: 2,
      borderRadius: 2
    }}
  >
    <Typography sx={{ color: '#fff' }} variant="h6">Végösszeg:</Typography>
    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#fff' }}>
      {finalPrice.toLocaleString()} Ft
    </Typography>
  </Box>

  
</Box>


                <Box sx={{ 
    display: 'flex', 
    gap: 2, 
    mt: 3,
    justifyContent: 'space-between',
    alignItems: 'center' 
    }}>
    <Button
    variant="outlined"
    size="large"
    startIcon={<ArrowBackIcon />}
    onClick={() => navigate('/kezdolap')}
    sx={{
      width: '40%',
      py: 1.5,
      borderColor: darkMode ? '#666' : '#333',
      color: darkMode ? '#fff' : '#333',
      '&:hover': {
        borderColor: darkMode ? '#777' : '#444',
        backgroundColor: 'rgba(255,255,255,0.05)',
        transform: 'scale(1.02)'
      },
      transition: 'all 0.3s ease'
    }}
    >
    Vissza
    </Button>

    <Button
    variant="contained"
    size="large"
    onClick={handleSubmitOrder}
    sx={{
      fontSize: '1.1rem',
              fontWeight: 600,
      width: '55%',
      py: 1.5,
      backgroundColor: darkMode ? '#666' : '#333',
      '&:hover': {
        backgroundColor: darkMode ? '#777' : '#444',
        transform: 'scale(1.02)'
      },
      transition: 'all 0.3s ease'
    }}
    >
    Rendelés véglegesítése
    </Button>
    </Box>
              </Card>
            </Box>
            {isLoading && (
              <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <CircularProgress />
              </Box>
            )}

            
<Dialog
  open={orderSuccess}
  TransitionComponent={Zoom}
  sx={{
    '& .MuiDialog-paper': {
      backgroundColor: darkMode ? '#333' : '#fff',
      borderRadius: 3,
      padding: { xs: 2, sm: 4 }, // Kisebb padding mobilon
      textAlign: 'center',
      minWidth: { xs: '90%', sm: '400px' }, // Reszponzív szélesség
      maxWidth: { xs: '95%', sm: '90%', md: '500px' }, // Maximum szélesség korlátozása
      margin: { xs: '10px', sm: 'auto' } // Kisebb margó mobilon
    }
  }}
>
  <CheckCircleIcon sx={{ 
    fontSize: { xs: 40, sm: 60 }, // Kisebb ikon mobilon
    color: '#4CAF50', 
    mb: { xs: 1, sm: 2 } // Kisebb margó mobilon
  }} />
  
  <Typography 
    variant="h5" 
    sx={{ 
      color: darkMode ? '#fff' : '#333', 
      mb: { xs: 1, sm: 2 },
      fontSize: { xs: '1.2rem', sm: '1.5rem' } // Kisebb betűméret mobilon
    }}
  >
    Köszönjük a rendelését!
  </Typography>
  
  <Typography sx={{ 
    color: darkMode ? '#ccc' : '#666', 
    mb: { xs: 2, sm: 3 },
    fontSize: { xs: '0.9rem', sm: '1rem' } // Kisebb betűméret mobilon
  }}>
    A rendelés visszaigazolását elküldtük emailben.
    {orderData.fizetesi_mod === 'kartya' && (
      <Box component="span" sx={{ 
        display: 'block', 
        mt: 1, 
        fontWeight: 'bold',
        fontSize: { xs: '0.85rem', sm: '1rem' } // Kisebb betűméret mobilon
      }}>
        Az értékelés után átirányítunk a fizetési oldalra.
      </Box>
    )}
  </Typography>

  <Box sx={{ mb: { xs: 2, sm: 3 } }}>
    <Typography sx={{ 
      color: darkMode ? '#ccc' : '#666', 
      mb: { xs: 1, sm: 2 },
      fontSize: { xs: '0.9rem', sm: '1rem' } // Kisebb betűméret mobilon
    }}>
      Értékelje az élményét:
    </Typography>
    
    <Rating
      size={window.innerWidth < 600 ? "medium" : "large"} // Kisebb csillagok mobilon
      value={rating}
      onChange={(event, newValue) => setRating(newValue)}
    />
    
    <TextField
      multiline
      rows={window.innerWidth < 600 ? 3 : 4} // Kevesebb sor mobilon
      placeholder="Írd le véleményed..."
      value={comment}
      onChange={(e) => setComment(e.target.value)}
      sx={{ 
        mt: { xs: 1, sm: 2 }, 
        width: '100%',
        '& .MuiInputBase-input': {
          fontSize: { xs: '0.9rem', sm: '1rem' } // Kisebb betűméret mobilon
        }
      }}
    />
    
    <Button
  onClick={async () => {  
    if (rating === 0) {
      alert('Kérjük, válassz egy értékelést!');
      return;
    }
    
    // Ez megakadályozza a többszörös navigációt
    setIsLoading(true);
    
    const success = await saveRatingToDatabase(rating, comment);
    
    // Ha sikeresen elmentettük az értékelést és a fizetési oldalra kell navigálnunk,
    // NEM szabad, hogy bármilyen más navigáció történjen ezután
    if (success && orderData.fizetesi_mod === 'kartya') {
      // Ez az egyetlen navigáció, aminek történnie kell
      navigate('/payment-simulation', { 
        state: { 
          orderId: orderId,
          amount: finalPriceState,
          items: orderItems,
          shippingDetails: {
            name: orderData.nev,
            phoneNumber: orderData.telefonszam,
            zipCode: orderData.irsz,
            city: orderData.telepules,
            address: orderData.kozterulet
          }
        } 
      });
    } else if (success) {
      // Csak nem kártyás fizetés esetén navigálj a kezdőlapra
      navigate('/kezdolap');
    }
    
    // A párbeszédablakot csak a navigáció kezdeményezése után zárd be
    setOrderSuccess(false);
    setIsLoading(false);
  }}
  variant="contained"
  sx={{ 
    mt: { xs: 1.5, sm: 2 },
    fontSize: { xs: '0.85rem', sm: '1rem' },
    padding: { xs: '8px 16px', sm: '10px 20px' }
  }}
>
  {orderData.fizetesi_mod === 'kartya' ? 'Értékelés küldése és tovább a fizetéshez' : 'Értékelés küldése'}
</Button>
  </Box>
</Dialog>

<Snackbar
  open={alertOpen}
  autoHideDuration={6000}
  onClose={() => setAlertOpen(false)}
  anchorOrigin={{ 
    vertical: 'top', 
    horizontal: 'center' 
  }}
  TransitionComponent={Slide}
  TransitionProps={{ direction: "down" }}
>
  <Alert
    elevation={6}
    variant="filled"
    onClose={() => setAlertOpen(false)}
    severity={alertSeverity}
    sx={{
      width: '100%',
      maxWidth: '500px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      '& .MuiAlert-icon': {
        fontSize: '1.5rem'
      },
      '& .MuiAlert-message': {
        fontSize: '0.95rem'
      }
    }}
  >
    {alertTitle && (
      <AlertTitle sx={{ fontWeight: 'bold' }}>{alertTitle}</AlertTitle>
    )}
    {alertMessage}
  </Alert>
</Snackbar>

<InactivityAlert darkMode={darkMode} inactivityTimeout={120000} />
      
          </Container>
        </Box>
      </ThemeProvider>
    )
  
};