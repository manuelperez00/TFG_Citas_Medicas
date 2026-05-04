import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Notifications from './Notifications';

const API_URL = process.env.REACT_APP_API_URL;

function Home({ user, authHeader, patientId }) {
  const navigate = useNavigate();

  // 1. Estado para estadísticas y contador de notificaciones
  const [stats, setStats] = useState({
    activeAppointments: 0,
    doctors: 0,
    timeToNextAppointment: "Sin próximas citas",
    nextAppointmentDate: null,
    notificationCount: 0 // Nuevo: para el punto rojo/número
  });

  // 2. Carga de información desde el backend
  useEffect(() => {
    if (!patientId) return;

    // Cargar Citas y Notificaciones (Ofertas)
    fetch(`${API_URL}/api/appointments/patient/${patientId}`, {
      headers: { Authorization: authHeader }
    })
      .then(res => res.json())
      .then(apps => {
        // Citas confirmadas (ASSIGNED)
        const active = apps.filter(a => a.status === 'ASSIGNED').length;
        
        // Citas que son ofertas (OFFERED) para el badge
        const offersCount = apps.filter(a => a.status === 'OFFERED').length;

        // Cálculo del tiempo hasta la próxima cita
        let timeToNextAppointment = "Sin próximas citas";
        let nextAppointmentDate = null;
        
        const now = new Date();
        const future = apps
          .filter(a => new Date(a.startTime) > now && ['ASSIGNED', 'OFFERED'].includes(a.status))
          .map(a => new Date(a.startTime))
          .sort((a, b) => a - b);
        
        if (future.length > 0) {
          nextAppointmentDate = future[0];
          const diffMs = nextAppointmentDate - now;
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const remainingHours = diffHours % 24;

          if (diffDays === 0) {
            if (diffHours === 0) {
              timeToNextAppointment = "Hoy en breve";
            } else if (diffHours === 1) {
              timeToNextAppointment = "En 1 hora";
            } else {
              timeToNextAppointment = `En ${diffHours} horas`;
            }
          } else if (diffDays === 1) {
            timeToNextAppointment = `Mañana${remainingHours > 0 ? ` en ${remainingHours}h` : ''}`;
          } else {
            timeToNextAppointment = `En ${diffDays} días${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
          }
        }

        setStats(prev => ({ 
            ...prev, 
            activeAppointments: active, 
            timeToNextAppointment: timeToNextAppointment,
            nextAppointmentDate: nextAppointmentDate,
            notificationCount: offersCount 
        }));
      })
      .catch(err => console.error('Error fetching appointments', err));

    // Cargar total de doctores
    fetch(`${API_URL}/api/doctors`, { headers: { Authorization: authHeader } })
      .then(res => res.json())
      .then(dr => {
        setStats(prev => ({ ...prev, doctors: dr.length }));
      })
      .catch(err => console.error('Error fetching doctors', err));

  }, [patientId, authHeader]);

  // Función para refrescar cuando se acepta/rechaza una oferta
  // Sin hacer reload completo (lo cual lo redirige al login)
  const refreshData = () => {
    // Simplemente refrescar estadísticas
    if (!patientId) return;

    fetch(`http://localhost:8080/api/appointments/patient/${patientId}`, {
      headers: { Authorization: authHeader }
    })
      .then(res => res.json())
      .then(apps => {
        // Citas confirmadas (ASSIGNED)
        const active = apps.filter(a => a.status === 'ASSIGNED').length;
        
        // Citas que son ofertas (OFFERED) para el badge
        const offersCount = apps.filter(a => a.status === 'OFFERED').length;

        // Cálculo del tiempo hasta la próxima cita
        let timeToNextAppointment = "Sin próximas citas";
        let nextAppointmentDate = null;
        
        const now = new Date();
        const future = apps
          .filter(a => new Date(a.startTime) > now && ['ASSIGNED', 'OFFERED'].includes(a.status))
          .map(a => new Date(a.startTime))
          .sort((a, b) => a - b);
        
        if (future.length > 0) {
          nextAppointmentDate = future[0];
          const diffMs = nextAppointmentDate - now;
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const remainingHours = diffHours % 24;

          if (diffDays === 0) {
            if (diffHours === 0) {
              timeToNextAppointment = "Hoy en breve";
            } else if (diffHours === 1) {
              timeToNextAppointment = "En 1 hora";
            } else {
              timeToNextAppointment = `En ${diffHours} horas`;
            }
          } else if (diffDays === 1) {
            timeToNextAppointment = `Mañana${remainingHours > 0 ? ` en ${remainingHours}h` : ''}`;
          } else {
            timeToNextAppointment = `En ${diffDays} días${remainingHours > 0 ? ` ${remainingHours}h` : ''}`;
          }
        }

        setStats(prev => ({ 
            ...prev, 
            activeAppointments: active, 
            timeToNextAppointment: timeToNextAppointment,
            nextAppointmentDate: nextAppointmentDate,
            notificationCount: offersCount 
        }));
      })
      .catch(err => console.error('Error fetching appointments', err));
  };

  return (
    <div className="main-container" style={{ padding: '20px', animation: 'fadeIn 0.5s ease-in' }}>
      
      {/* 1. HERO BANNER */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '60px 40px',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        borderRadius: '0 0 60px 60px',
        marginBottom: '40px',
        position: 'relative'
      }}>
        {/* INDICADOR DE NOTIFICACIONES (Campana con Badge) */}
        <div style={notificationBadgeContainer}>
            <span style={{ fontSize: '1.5rem' }}>🔔</span>
            {stats.notificationCount > 0 && (
                <div style={badgeStyle}>
                    {stats.notificationCount}
                </div>
            )}
        </div>

        <div style={{ flex: 1, maxWidth: '600px' }}>
          <h1 style={{ fontSize: '3rem', color: '#0c4a6e', lineHeight: '1.1', fontWeight: '800', marginBottom: '15px' }}>
            Hola, {user?.username || 'Paciente'}
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#334155', marginBottom: '20px', lineHeight: '1.6' }}>
            Hoy es un buen día para cuidar de tu salud. Tienes <strong>{stats.activeAppointments} citas</strong> pendientes para esta semana.
          </p>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <img
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80"
            alt="Salud"
            style={{
              width: '100%',
              maxWidth: '500px',
              borderRadius: '30px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              transform: 'rotate(-2deg)'
            }}
          />
        </div>
      </header>

      {/* --- SECCIÓN DE NOTIFICACIONES --- */}
      {/* Siempre está presente. Si no hay ofertas, el componente devuelve null internamente */}
      <Notifications 
        authHeader={authHeader} 
        patientId={patientId} 
        onRefresh={refreshData} 
      />

      {/* 2. MINI ESTADÍSTICAS (Quick Stats) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {[
          { label: 'Citas Activas', val: stats.activeAppointments, color: '#0ea5e9', icon: '📅' },
          { label: 'Especialistas', val: stats.doctors, color: '#8b5cf6', icon: '👩‍⚕️' },
          { label: 'Próxima Cita', val: stats.timeToNextAppointment, color: '#10b981', icon: '⏰' }
        ].map((stat, i) => (
          <div key={i} className="glass-card" style={{ textAlign: 'center', padding: '25px' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>{stat.icon}</div>
            <div style={{ 
              fontSize: typeof stat.val === 'number' ? '1.8rem' : '1.3rem', 
              fontWeight: '800', 
              color: stat.color,
              lineHeight: '1.4'
            }}>
              {stat.val}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 3. ACCIONES PRINCIPALES */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '25px', color: '#1e293b' }}>¿Qué necesitas hacer?</h2>
      
      <div style={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: '25px',
        alignItems: 'stretch',
        justifyContent: 'space-between'
      }}>
        
        {/* Tarjeta 1: RESERVAR */}
        <div className="glass-card" style={cardStyle}>
          <div style={{...iconBox, backgroundColor: '#e0f2fe', color: '#0369a1'}}>📅</div>
          <h3 style={cardTitle}>Nueva Cita</h3>
          <p style={cardText}>Reserva con tu médico de cabecera o busca un nuevo especialista disponible.</p>
          <button onClick={() => navigate('/reservar')} className="btn-modern btn-primary" style={fullBtn}>
            Explorar Agenda
          </button>
        </div>

        {/* Tarjeta 2: GESTIONAR */}
        <div className="glass-card" style={cardStyle}>
          <div style={{...iconBox, backgroundColor: '#f0fdf4', color: '#15803d'}}>📂</div>
          <h3 style={cardTitle}>Mis Citas</h3>
          <p style={cardText}>Consulta los detalles, descarga justificantes o cancela tus citas programadas.</p>
          <button onClick={() => navigate('/mis-citas')} className="btn-modern" style={{...fullBtn, backgroundColor: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0'}}>
            Ver historial
          </button>
        </div>

        {/* Tarjeta 3: LISTA ESPERA */}
        <div className="glass-card" style={cardStyle}>
          <div style={{...iconBox, backgroundColor: '#fff7ed', color: '#c2410c'}}>⏳</div>
          <h3 style={cardTitle}>Lista de Espera</h3>
          <p style={cardText}>Configura alertas para huecos libres y accede a consultas antes de tiempo.</p>
          <button onClick={() => navigate('/lista-espera')} className="btn-modern" style={{...fullBtn, backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #ffedd5'}}>
            Ver mis esperas
          </button>
        </div>

      </div>
    </div>
  );
}

// --- ESTILOS ---
const cardStyle = {
  padding: '35px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: '12px',
  justifyContent: 'space-between',
  flex: '1 1 300px',
  minWidth: '250px',
  minHeight: '250px'
};

const iconBox = {
  width: '60px',
  height: '60px',
  borderRadius: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.8rem',
  marginBottom: '10px'
};

const cardTitle = { fontSize: '1.4rem', margin: 0, fontWeight: '700' };
const cardText = { color: '#64748b', lineHeight: '1.6', fontSize: '1rem', margin: '0 0 10px 0' };
const fullBtn = { width: '100%', marginTop: 'auto', padding: '14px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer' };

// Estilos del Badge (Punto rojo)
const notificationBadgeContainer = {
    position: 'absolute',
    top: '30px',
    right: '40px',
    backgroundColor: 'white',
    padding: '10px',
    borderRadius: '50%',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};

const badgeStyle = {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    backgroundColor: '#ef4444', // Rojo intenso
    color: 'white',
    borderRadius: '50%',
    width: '22px',
    height: '22px',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid white'
};

export default Home;
