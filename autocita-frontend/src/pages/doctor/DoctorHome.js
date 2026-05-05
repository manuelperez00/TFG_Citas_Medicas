import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL;

const SPECIALTY_ES = {
  PEDIATRICS: 'Pediatría', DERMATOLOGY: 'Dermatología', CARDIOLOGY: 'Cardiología',
  GYNECOLOGY: 'Ginecología', DIGESTIVE: 'Digestivo', FAMILY_MEDICINE: 'Medicina de Familia',
  TRAUMATOLOGY: 'Traumatología', OPHTHALMOLOGY: 'Oftalmología', ENDOCRINOLOGY: 'Endocrinología',
  ENT: 'Otorrinolaringología', NEUROLOGY: 'Neurología', PSYCHIATRY: 'Psiquiatría',
  PSYCHOLOGY: 'Psicología', GENERAL_SURGERY: 'Cirugía General', RADIOLOGY: 'Radiología',
  UROLOGY: 'Urología', ALLERGY: 'Alergología',
};

function DoctorHome({ authHeader, doctorId }) {
  const navigate = useNavigate();
  const [doctorData, setDoctorData] = useState(null);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    totalPatients: 0,
    nextAppointment: null,
    blockingPercentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!doctorId) {
      console.log('DoctorHome: doctorId is not set yet', doctorId);
      return;
    }
    
    console.log('DoctorHome: Loading data for doctorId:', doctorId);

    // Cargar datos del doctor
    fetch(`${API_URL}/api/doctors/${doctorId}`, {
      headers: { 'Authorization': authHeader }
    })
    .then(res => res.json())
    .then(data => setDoctorData(data))
    .catch(err => console.error('Error fetching doctor data:', err));

    // Cargar citas del doctor
    fetch(`${API_URL}/api/appointments/doctor/${doctorId}`, {
      headers: { 'Authorization': authHeader }
    })
    .then(res => res.json())
    .then(appointments => {
      const now = new Date();

      // Citas de HOY (todas las que estén hoy, sin importar estado)
      const todayAppointments = appointments.filter(a => {
        const aptDate = new Date(a.startTime);
        return aptDate.toDateString() === now.toDateString() && 
               ['ASSIGNED', 'OFFERED'].includes(a.status);
      });

      // Total de PACIENTES ÚNICOS (todos con citas asignadas o completadas)
      const uniquePatients = new Set(
        appointments
          .filter(a => a.patient && ['ASSIGNED', 'COMPLETED'].includes(a.status))
          .map(a => a.patient.id)
      );

      // PRÓXIMA CITA
      const futureAppointments = appointments
        .filter(a => {
          const aptDate = new Date(a.startTime);
          return aptDate > now && ['ASSIGNED', 'OFFERED'].includes(a.status);
        })
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

      let nextAppointment = null;
      if (futureAppointments.length > 0) {
        nextAppointment = futureAppointments[0];
      }

      // PORCENTAJE DE TIEMPO BLOQUEADO (hoy)
      const todayBlocked = appointments.filter(a => {
        const aptDate = new Date(a.startTime);
        return aptDate.toDateString() === now.toDateString() && 
               a.status === 'BLOCKED';
      }).length;

      // Total de slots de hoy (todos los de hoy sin importar estado)
      const totalTodaySlots = appointments.filter(a => {
        const aptDate = new Date(a.startTime);
        return aptDate.toDateString() === now.toDateString();
      }).length;

      const blockingPercentage = totalTodaySlots > 0 ? Math.round((todayBlocked / totalTodaySlots) * 100) : 0;

      setStats({
        todayAppointments: todayAppointments.length,
        totalPatients: uniquePatients.size,
        nextAppointment,
        blockingPercentage
      });

      setLoading(false);
    })
    .catch(err => {
      console.error('Error fetching appointments:', err);
      setLoading(false);
    });
  }, [doctorId, authHeader]);

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getNextAppointmentText = () => {
    if (!stats.nextAppointment) return 'Sin próximas citas';

    const now = new Date();
    const nextTime = new Date(stats.nextAppointment.startTime);
    const diffMs = nextTime - now;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const remainingHours = diffHours % 24;

    if (diffDays === 0) {
      if (diffHours === 0) {
        return 'Hoy en breve';
      } else if (diffHours === 1) {
        return 'En 1 hora';
      } else {
        return `En ${diffHours} horas`;
      }
    } else if (diffDays === 1) {
      return `Mañana${remainingHours > 0 ? ` en ${remainingHours}h` : ''}`;
    } else {
      return `En ${diffDays} días`;
    }
  };

  const gridCardStyle = {
    padding: '25px',
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    ':hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 20px -4px rgb(0 0 0 / 0.15)' }
  };

  const actionCardStyle = {
    padding: '30px',
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center'
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '80px 20px', color: '#94a3b8' }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: '20px', animation: 'fadeIn 0.5s ease-in' }}>
      {/* HERO BANNER */}
      <header style={{
        display: 'grid',
        gridTemplateColumns: window.innerWidth < 900 ? '1fr' : '1fr 1fr',
        alignItems: 'center',
        gap: '40px',
        padding: '60px 40px',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        borderRadius: '0 0 60px 60px',
        marginBottom: '40px',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '100%' }}>
          <h1 style={{ fontSize: '3rem', color: '#166534', lineHeight: '1.1', fontWeight: '800', marginBottom: '15px' }}>
            Hola, Dr. {doctorData?.lastName}
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#334155', marginBottom: '20px', lineHeight: '1.6' }}>
            Bienvenido a tu panel de control. Aquí puedes gestionar tus citas, disponibilidad y más.
          </p>
          <p style={{ fontSize: '0.95rem', color: '#64748b', fontStyle: 'italic' }}>
            📋 {SPECIALTY_ES[doctorData?.specialty] || doctorData?.specialty || 'Especialista'} | 🕐 {doctorData?.workShift === 'MORNING' ? 'Turno Mañana' : doctorData?.workShift === 'AFTERNOON' ? 'Turno Tarde' : 'Ambos Turnos'}
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{
            width: '280px',
            height: '300px',
            background: 'linear-gradient(160deg, #ffffff 0%, #dcfce7 100%)',
            borderRadius: '24px',
            boxShadow: '0 20px 40px -10px rgba(16, 185, 129, 0.25)',
            border: '2px solid rgba(16, 185, 129, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              fontWeight: '800',
              color: 'white',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)',
              letterSpacing: '-1px'
            }}>
              {doctorData ? `${(doctorData.firstName || '')[0] || ''}${(doctorData.lastName || '')[0] || ''}`.toUpperCase() : '👨‍⚕️'}
            </div>
            <div style={{ textAlign: 'center', padding: '0 20px' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#166534' }}>
                Dr. {doctorData?.firstName} {doctorData?.lastName}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: '500', marginTop: '4px' }}>
                {SPECIALTY_ES[doctorData?.specialty] || doctorData?.specialty}
              </div>
            </div>
            <div style={{ fontSize: '2.2rem', marginTop: '4px' }}>🩺</div>
            <div style={{
              fontSize: '0.75rem',
              color: '#6ee7b7',
              fontWeight: '600',
              letterSpacing: '0.1em',
              textTransform: 'uppercase'
            }}>
              {doctorData?.licenseNumber}
            </div>
          </div>
        </div>
      </header>

      {/* ESTADÍSTICAS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {[
          { label: 'Citas Hoy', val: stats.todayAppointments, color: '#0ea5e9', icon: '📅' },
          { label: 'Pacientes', val: stats.totalPatients, color: '#10b981', icon: '👥' },
          { label: 'Próxima Cita', val: getNextAppointmentText(), color: '#f59e0b', icon: '⏰' },
          { label: 'Bloqueado Hoy', val: `${stats.blockingPercentage}%`, color: '#8b5cf6', icon: '🔒' }
        ].map((stat, i) => (
          <div key={i} style={{...gridCardStyle, paddingTop: '30px', paddingBottom: '30px'}}>
            <div style={{ fontSize: '2.2rem', marginBottom: '10px' }}>{stat.icon}</div>
            <div style={{
              fontSize: typeof stat.val === 'number' ? '1.8rem' : '1.3rem',
              fontWeight: '800',
              color: stat.color,
              lineHeight: '1.4'
            }}>
              {stat.val}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', marginTop: '10px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* PRÓXIMA CITA DESTACADA */}
      {stats.nextAppointment && (
        <div style={{
          padding: '30px',
          background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
          borderRadius: '16px',
          marginBottom: '40px',
          border: '2px solid #0ea5e9'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <h3 style={{ margin: '0 0 10px 0', color: '#0369a1', fontSize: '1.2rem' }}>📌 Próxima Cita</h3>
              <p style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1.1rem', fontWeight: '600' }}>
                {stats.nextAppointment.patient?.firstName} {stats.nextAppointment.patient?.lastName}
              </p>
              <p style={{ margin: '0', color: '#64748b', fontSize: '0.95rem' }}>
                🕐 {formatTime(stats.nextAppointment.startTime)} • 📅 {formatDate(stats.nextAppointment.startTime)}
              </p>
            </div>
            <button
              onClick={() => navigate('/agenda')}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
              }}
              onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
            >
              Ver Agenda →
            </button>
          </div>
        </div>
      )}

      {/* ACCIONES PRINCIPALES */}
      <h2 style={{ fontSize: '1.5rem', marginBottom: '25px', color: '#1e293b' }}>¿Qué necesitas hacer?</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '25px',
        marginBottom: '40px'
      }}>
        {/* Tarjeta 1: AGENDA */}
        <div
          onClick={() => navigate('/agenda')}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
          }}
          style={actionCardStyle}
        >
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📅</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.3rem', fontWeight: '700' }}>Mi Agenda</h3>
          <p style={{ margin: '0', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Revisa tus citas del día, próximos pacientes y horarios reservados.
          </p>
          <div style={{ marginTop: '20px', color: '#0ea5e9', fontWeight: '600' }}>Ver agenda →</div>
        </div>

        {/* Tarjeta 2: BLOQUEOS */}
        <div
          onClick={() => navigate('/bloqueos')}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
          }}
          style={actionCardStyle}
        >
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔒</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.3rem', fontWeight: '700' }}>Bloqueos</h3>
          <p style={{ margin: '0', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Gestiona tu disponibilidad. Bloquea horas para reuniones, descansos o conferencias.
          </p>
          <div style={{ marginTop: '20px', color: '#8b5cf6', fontWeight: '600' }}>Gestionar bloqueos →</div>
        </div>

        {/* Tarjeta 3: HISTORIAL */}
        <div
          onClick={() => navigate('/historial')}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
          }}
          style={actionCardStyle}
        >
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📜</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.3rem', fontWeight: '700' }}>Historial</h3>
          <p style={{ margin: '0', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Consulta el historial de citas completadas con tus pacientes.
          </p>
          <div style={{ marginTop: '20px', color: '#10b981', fontWeight: '600' }}>Ver historial →</div>
        </div>

        {/* Tarjeta 4: PERFIL */}
        <div
          onClick={() => navigate('/perfil')}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-8px)';
            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.2)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1)';
          }}
          style={actionCardStyle}
        >
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚙️</div>
          <h3 style={{ margin: '0 0 10px 0', color: '#1e293b', fontSize: '1.3rem', fontWeight: '700' }}>Perfil</h3>
          <p style={{ margin: '0', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Edita tu información, turno de trabajo y configuración personal.
          </p>
          <div style={{ marginTop: '20px', color: '#f59e0b', fontWeight: '600' }}>Ajustes →</div>
        </div>
      </div>

      {/* DATOS RÁPIDOS */}
      <section style={{
        padding: '30px',
        backgroundColor: '#f8fafc',
        borderRadius: '16px',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#1e293b', fontSize: '1.2rem', fontWeight: '700' }}>📊 Resumen de Hoy</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
          <div>
            <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Citas Asignadas</p>
            <p style={{ margin: '0', color: '#0ea5e9', fontSize: '1.8rem', fontWeight: '800' }}>{stats.todayAppointments}</p>
          </div>

          <div>
            <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Pacientes Únicos</p>
            <p style={{ margin: '0', color: '#10b981', fontSize: '1.8rem', fontWeight: '800' }}>{stats.totalPatients}</p>
          </div>

          <div>
            <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>Tiempo Bloqueado</p>
            <p style={{ margin: '0', color: '#f59e0b', fontSize: '1.8rem', fontWeight: '800' }}>{stats.blockingPercentage}%</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DoctorHome;
