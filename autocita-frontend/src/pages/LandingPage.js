import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <div className="landing-wrapper">
      {/* NAVBAR PÚBLICO */}
      <nav style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '15px 60px', 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: '10px' }}>🏥</span> AutoCita
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
          <Link to="/login" style={{ textDecoration: 'none', color: 'var(--secondary)', fontWeight: '600' }}>Iniciar Sesión</Link>
          <Link to="/register" className="btn-modern btn-primary" style={{ textDecoration: 'none' }}>Registrarse</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '100px 60px', 
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
        borderRadius: '0 0 60px 60px',
        minHeight: '60vh'
      }}>
        <div style={{ flex: 1, maxWidth: '600px' }}>
          <h1 style={{ fontSize: '3.8rem', color: '#0c4a6e', lineHeight: '1.1', fontWeight: '800', marginBottom: '25px' }}>
            Tu salud, <br />
            <span style={{ color: 'var(--primary)' }}>sin esperas.</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#334155', marginBottom: '40px', lineHeight: '1.6' }}>
            Gestiona tus citas médicas, revisa tu historial y conecta con especialistas desde la comodidad de tu hogar con la tecnología más avanzada.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/register" className="btn-modern btn-primary" style={{ padding: '18px 35px', fontSize: '1.1rem', textDecoration: 'none', boxShadow: '0 10px 15px -3px rgba(14, 165, 233, 0.3)' }}>
              Empezar ahora
            </Link>
            <Link to="/login" className="btn-modern" style={{ padding: '18px 35px', fontSize: '1.1rem', textDecoration: 'none', backgroundColor: 'white', border: '1px solid #e2e8f0' }}>
              Ya tengo cuenta
            </Link>
          </div>
        </div>
        
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <img 
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80" 
            alt="Asistencia Médica" 
            style={{ 
              width: '100%', 
              maxWidth: '550px', 
              borderRadius: '30px', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              transform: 'rotate(-2deg)'
            }}
          />
        </div>
      </header>

      {/* FEATURES SECTION */}
      <section className="main-container" style={{ marginTop: '-50px' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
          gap: '30px' 
        }}>
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📅</div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '15px' }}>Citas Online</h3>
            <p style={{ color: 'var(--secondary)', lineHeight: '1.5' }}>Reserva hueco con tu médico en segundos, disponible las 24 horas del día, los 7 días de la semana.</p>
          </div>

          <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>👨‍⚕️</div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '15px' }}>Cuadro Médico</h3>
            <p style={{ color: 'var(--secondary)', lineHeight: '1.5' }}>Accede a una red de profesionales altamente cualificados en todas las especialidades médicas.</p>
          </div>

          <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🛡️</div>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '15px' }}>Seguro y Privado</h3>
            <p style={{ color: 'var(--secondary)', lineHeight: '1.5' }}>Tus datos médicos y personales están protegidos bajo los más estrictos estándares de cifrado.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '60px 20px', 
        backgroundColor: '#0f172a', 
        color: '#94a3b8', 
        marginTop: '80px' 
      }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white', marginBottom: '20px' }}>🏥 AutoCita</div>
        <p style={{ marginBottom: '10px' }}>© 2026 AutoCita Salud. Innovación tecnológica en salud pública.</p>
        <p style={{ fontSize: '0.8rem' }}>Proyecto de Final de Grado (TFG) - Optimización de flujos médicos.</p>
      </footer>
    </div>
  );
}

export default LandingPage;