import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import NotificationsPanel from './NotificationsPanel'; // Asegúrate de crear este archivo (paso 2)

function Navbar({ user, onLogout, offers = [], onRefresh }) {
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const isDoctor = user.role === 'DOCTOR';

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  const linkStyle = {
    textDecoration: 'none',
    color: '#475569',
    fontWeight: '600',
    fontSize: '0.95rem',
    padding: '6px 10px',
    borderRadius: '8px',
    transition: 'background-color 0.2s ease, color 0.2s ease'
  };

  const activeLinkStyle = {
    color: '#0369a1',
    backgroundColor: '#e0f2fe',
    boxShadow: 'inset 0 -2px 0 0 #0369a1'
  };

  const navLinkStyle = ({ isActive }) => ({
    ...linkStyle,
    ...(isActive ? activeLinkStyle : {})
  });

  return (
    <nav style={{
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '15px 40px', 
      backgroundColor: 'white', 
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky', top: 0, zIndex: 1000 // Subí el zIndex para que el panel flote sobre todo
    }}>
      {/* LOGO - Redirige según rol */}
      <div 
        style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0369a1', cursor: 'pointer' }} 
        onClick={() => navigate('/')}
      >
        🏥 AutoCita {isDoctor && <span style={{fontSize: '0.8rem', color: '#64748b'}}>(Panel Médico)</span>}
      </div>
      
      <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
        {/* LINKS PARA PACIENTES */}
        {!isDoctor && (
          <>
            <NavLink to="/" style={navLinkStyle}>Inicio</NavLink>
            <NavLink to="/mis-citas" style={navLinkStyle}>Mis Citas</NavLink>
            <NavLink to="/historial" style={navLinkStyle}>Historial</NavLink>
            <NavLink to="/medicamentos" style={navLinkStyle}>Medicamentos</NavLink>
            <NavLink to="/lista-espera" style={navLinkStyle}>Lista Espera</NavLink>
            <NavLink to="/perfil" style={navLinkStyle}>Perfil</NavLink>
            
            {/* CAMPANA DE NOTIFICACIONES (Solo para pacientes) */}
            <div style={{ position: 'relative', cursor: 'pointer', margin: '0 10px' }} 
                 onClick={() => setShowNotifications(!showNotifications)}>
              <span style={{ 
                fontSize: '1.4rem',
                animation: offers.length > 0 ? 'ring 0.5s ease-in-out infinite' : 'none',
                display: 'inline-block'
              }}>🔔</span>
               
              {/* PUNTO ROJO: Siempre aparece el contenedor si quieres, 
                  pero solo se pinta de rojo si hay ofertas */}
              {offers.length > 0 && (
                <div style={redDotStyle}>
                  {offers.length}
                </div>
              )}

              {/* PANEL DESPLEGABLE */}
              {showNotifications && (
                <NotificationsPanel 
                  offers={offers} 
                  onRefresh={onRefresh} 
                  close={() => setShowNotifications(false)} 
                  authHeader={user.authHeader}
                />
              )}
            </div>

            <NavLink to="/reservar" className="btn-modern btn-primary" style={{ textDecoration: 'none', padding: '8px 20px' }}>
              Nueva Cita
            </NavLink>
          </>
        )}

        {/* LINKS PARA MÉDICOS */}
        {isDoctor && (
          <>
            <NavLink to="/" style={navLinkStyle}>Inicio</NavLink>
            <NavLink to="/agenda" style={navLinkStyle}>Agenda</NavLink>
            <NavLink to="/bloqueos" style={navLinkStyle}>Bloqueos</NavLink>
            <NavLink to="/historial" style={navLinkStyle}>Historial</NavLink>
            <NavLink to="/estadisticas" style={navLinkStyle}>Estadísticas</NavLink>
            <NavLink to="/perfil" style={navLinkStyle}>Perfil</NavLink>
          </>
        )}
        
        {/* PERFIL Y LOGOUT */}
        <div style={{ marginLeft: '15px', paddingLeft: '20px', borderLeft: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{user.username}</div>
            <div style={{ fontSize: '0.7rem', color: '#0369a1' }}>
                {isDoctor ? 'MÉDICO COLEGIADO' : 'PACIENTE'}
            </div>
          </div>
          <button onClick={handleLogout} className="btn-modern" style={{ backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
}

// Estilo para el punto rojo de notificación
const redDotStyle = {
  position: 'absolute',
  top: '-5px',
  right: '-5px',
  backgroundColor: '#ef4444',
  color: 'white',
  borderRadius: '50%',
  width: '18px',
  height: '18px',
  fontSize: '0.65rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '2px solid white',
  fontWeight: 'bold'
};

export default Navbar;