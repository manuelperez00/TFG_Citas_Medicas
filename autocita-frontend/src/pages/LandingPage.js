import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-wrapper">
      {/* NAVBAR PÚBLICO */}
      <nav className="landing-navbar">
        <div className="navbar-logo">
          <span className="navbar-icon">🏥</span> AutoCita
        </div>
        <div className="navbar-links">
          <Link to="/login" className="nav-link">Iniciar Sesión</Link>
          <Link to="/register" className="btn-modern btn-primary nav-btn">Registrarse</Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="landing-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Tu salud, <br />
            <span className="hero-highlight">sin esperas.</span>
          </h1>
          <p className="hero-text">
            Gestiona tus citas médicas, revisa tu historial y conecta con especialistas desde la comodidad de tu hogar con la tecnología más avanzada.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn-modern btn-primary">
              Empezar ahora
            </Link>
            <Link to="/login" className="btn-modern btn-secondary">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
        
        <div className="hero-image-container">
          <img 
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80" 
            alt="Asistencia Médica" 
            className="hero-image"
          />
        </div>
      </header>

      {/* FEATURES SECTION */}
      <section className="landing-features">
        <div className="features-grid">
          <div className="glass-card">
            <div className="feature-icon">📅</div>
            <h3 className="feature-title">Citas Online</h3>
            <p className="feature-text">Reserva hueco con tu médico en segundos, disponible las 24 horas del día, los 7 días de la semana.</p>
          </div>

          <div className="glass-card">
            <div className="feature-icon">👨‍⚕️</div>
            <h3 className="feature-title">Cuadro Médico</h3>
            <p className="feature-text">Accede a una red de profesionales altamente cualificados en todas las especialidades médicas.</p>
          </div>

          <div className="glass-card">
            <div className="feature-icon">🛡️</div>
            <h3 className="feature-title">Seguro y Privado</h3>
            <p className="feature-text">Tus datos médicos y personales están protegidos bajo los más estrictos estándares de cifrado.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="landing-footer">
        <div className="footer-brand">🏥 AutoCita</div>
        <p className="footer-text">© 2026 AutoCita Salud. Innovación tecnológica en salud pública.</p>
        <p className="footer-subtext">Proyecto de Final de Grado (TFG) - Optimización de flujos médicos.</p>
      </footer>
    </div>
  );
}

export default LandingPage;