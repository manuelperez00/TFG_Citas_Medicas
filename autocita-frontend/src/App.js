import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Componentes
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MyAppointments from './pages/patient/MyAppointments';
import History from './pages/patient/History';
import BookAppointment from './pages/patient/BookAppointment';
import WaitingList from './pages/patient/WaitingList';
import PatientProfilePage from './pages/patient/ProfilePage';
import Medications from './pages/patient/Medications';
import DoctorHome from './pages/doctor/DoctorHome';
import DoctorDashboard from './pages/doctor/DoctorDashboard';

// NUEVOS COMPONENTES
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';

function App() {
  const [user, setUser] = useState(null); // Usuario logueado
  const [userRole, setUserRole] = useState(null); // 'PATIENT' o 'DOCTOR'
  const [patientId, setPatientId] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [authHeader, setAuthHeader] = useState(localStorage.getItem('authHeader'));
  const [offers, setOffers] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL;

  // --- LÓGICA DE NOTIFICACIONES ---
  const fetchOffers = async () => {
    // Usamos user.authHeader si está logueado, sino el estado authHeader
    const token = user?.authHeader || authHeader;
    if (!patientId || !token) return;

    try {
      const res = await fetch(`${API_URL}/api/appointments/patient/${patientId}`, {
        headers: { 'Authorization': token }
      });
      if (res.ok) {
        const data = await res.json();
        // Filtramos solo las pendientes de respuesta (OFFERED)
        const pendingOffers = data.filter(app => app.status === 'OFFERED');
        setOffers(pendingOffers);
      }
    } catch (err) {
      console.error("Error cargando notificaciones globales:", err);
    }
  };

  useEffect(() => {
    if (userRole === 'PATIENT') {
      fetchOffers();
      // Polling cada 10 segundos para buscar nuevas ofertas automáticamente
      const interval = setInterval(fetchOffers, 10000);
      return () => clearInterval(interval);
    }
  }, [patientId, userRole, user?.authHeader]);


  // --- LOGICA DE LOGIN ---
  const handleLogin = (userData) => {
    const tempUser = { username: userData.username, authHeader: userData.authHeader };
    setAuthHeader(userData.authHeader);
    localStorage.setItem('authHeader', userData.authHeader);

    // Intentar como PACIENTE primero
    fetch(`${API_URL}/api/patients/my-id`, {
      headers: { 'Authorization': userData.authHeader }
    })
    .then(async response => {
      if (response.ok) {
        const id = await response.json();
        console.log('Login as PATIENT:', id);
        setPatientId(id);
        setUserRole('PATIENT');
        setUser({ ...tempUser, role: 'PATIENT' });
        return; // Login exitoso como paciente
      } else {
        throw new Error('Not a patient'); // Intentar como doctor
      }
    })
    .catch(err => {
      // Si falla como paciente, intentar como MÉDICO
      console.log('Trying as DOCTOR...');
      return fetch(`${API_URL}/api/doctors/my-id`, {
        headers: { 'Authorization': userData.authHeader }
      })
      .then(async response => {
        if (response.ok) {
          const id = await response.json();
          console.log('Login as DOCTOR:', id);
          setDoctorId(id);
          setUserRole('DOCTOR');
          setUser({ ...tempUser, role: 'DOCTOR' });
        } else {
          throw new Error("Credenciales no válidas");
        }
      });
    })
    .catch(err => {
      console.error('Login error:', err);
      alert("Usuario o contraseña incorrectos");
    });
  };

  const handleLogout = () => {
    setUser(null);
    setUserRole(null);
    setPatientId(null);
    setDoctorId(null);
    setOffers([]);
    localStorage.removeItem('authHeader');
  };

  // --- ZONA PÚBLICA (NO LOGUEADO) ---
  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // --- ZONA PRIVADA: MÉDICO ---
  if (userRole === 'DOCTOR') {
    return (
      <BrowserRouter>
        <Navbar user={user} onLogout={handleLogout} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '50px' }}>
          <Routes>
            <Route path="/" element={<DoctorHome authHeader={user.authHeader} doctorId={doctorId} />} />
            <Route path="/agenda" element={<DoctorDashboard authHeader={user.authHeader} doctorId={doctorId} />} />
            <Route path="/bloqueos" element={<DoctorDashboard authHeader={user.authHeader} doctorId={doctorId} />} />
            <Route path="/historial" element={<DoctorDashboard authHeader={user.authHeader} doctorId={doctorId} />} />
            <Route path="/perfil" element={<DoctorDashboard authHeader={user.authHeader} doctorId={doctorId} />} />
            <Route path="/estadisticas" element={<DoctorDashboard authHeader={user.authHeader} doctorId={doctorId} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </BrowserRouter>
    );
  }

  // --- ZONA PRIVADA: PACIENTE ---
  if (userRole === 'PATIENT') {
    return (
      <BrowserRouter>
        <Navbar 
          user={user} 
          onLogout={handleLogout} 
          offers={offers} 
          onRefresh={fetchOffers} 
        />
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '50px' }}>
          <Routes>
            <Route path="/" element={
              <Home 
                user={user} 
                authHeader={user.authHeader} 
                patientId={patientId} 
                offers={offers} 
                onRefresh={fetchOffers} 
              />
            } />
            <Route path="/mis-citas" element={<MyAppointments authHeader={user.authHeader} patientId={patientId} />} />
            <Route path="/historial" element={<History authHeader={user.authHeader} patientId={patientId} />} />
            <Route path="/medicamentos" element={<Medications authHeader={user.authHeader} patientId={patientId} />} />
            <Route path="/reservar" element={<BookAppointment authHeader={user.authHeader} patientId={patientId} />} />
            <Route path="/lista-espera" element={<WaitingList authHeader={user.authHeader} patientId={patientId} />} />
            <Route path="/perfil" element={<PatientProfilePage authHeader={user.authHeader} patientId={patientId} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </BrowserRouter>
    );
  }

  return <div>Cargando...</div>;
}

export default App;