import React, { useState, useEffect } from 'react';
import AppointmentDetailModal from '../../components/AppointmentDetailModal';
import { useModal } from '../../components/AppModal';

const API_URL = process.env.REACT_APP_API_URL;

function MyAppointments({ authHeader, patientId }) {
  const { showAlert, showConfirm } = useModal();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas'); // 'todas', 'proximas', 'canceladas'
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    if (patientId) {
      fetchAppointments();
    }
  }, [patientId, authHeader]);

  const fetchAppointments = () => {
    if (!patientId) return;
    setLoading(true);
    fetch(`${API_URL}/api/appointments/patient/${patientId}`, {
      headers: { 'Authorization': authHeader }
    })
      .then(res => res.json())
      .then(data => {
        console.log('📥 Citas recibidas:', data);
        data.forEach(app => {
          console.log(`- ID: ${app.id}, Status: ${app.status}, Fecha: ${app.startTime}`);
        });
        const sorted = data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        setAppointments(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching appointments:', err);
        setLoading(false);
      });
  };

  const canBeCancelled = (startTime) => {
    const now = new Date();
    const appointmentDate = new Date(startTime);
    const diffInHours = (appointmentDate - now) / (1000 * 60 * 60);
    return diffInHours >= 12;
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!await showConfirm("¿Seguro que deseas cancelar esta cita?")) return;

    console.log(`🔄 Cancelando cita ${appointmentId}...`);
    fetch(`${API_URL}/api/appointments/${appointmentId}/cancel`, {
      method: 'POST',
      headers: { 'Authorization': authHeader }
    })
      .then(async res => {
        console.log(`📦 Respuesta del servidor: ${res.status}`);
        if (res.ok) {
          showAlert("✅ Cita cancelada correctamente.");
          console.log('🔄 Refrescando citas...');
          fetchAppointments();
        } else {
          const errorText = await res.text();
          showAlert("❌ Error: " + errorText);
        }
      })
      .catch(err => {
        console.error("Error de red:", err);
        showAlert("❌ Error de conexión");
      });
  };

  const hasPassed = (startTime) => {
    return new Date(startTime) < new Date();
  };

  const now = new Date();
  
  const citasActivas = appointments.filter(app => {
    const isPast = new Date(app.startTime) < now;
    return !isPast && app.status !== 'REJECTED' && app.status !== 'CANCELLED' && app.status !== 'BLOCKED';
  });

  const citasCanceladas = appointments.filter(app => {
    // Solo mostrar citas rechazadas (REJECTED) - Las citas canceladas por el paciente quedan como REJECTED
    return app.status === 'REJECTED';
  });

  // Determinar qué mostrar según el filtro
  let citasAMostrar = [];
  if (filter === 'todas') {
    citasAMostrar = [...citasActivas, ...citasCanceladas];
  } else if (filter === 'proximas') {
    citasAMostrar = citasActivas;
  } else if (filter === 'canceladas') {
    citasAMostrar = citasCanceladas;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setFilter('todas')}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: filter === 'todas' ? '#0369a1' : '#f1f5f9',
              color: filter === 'todas' ? 'white' : '#475569',
              border: '1px solid ' + (filter === 'todas' ? '#0369a1' : '#e2e8f0'),
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            📋 Todas
          </button>
          <button 
            onClick={() => setFilter('proximas')}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: filter === 'proximas' ? '#0369a1' : '#f1f5f9',
              color: filter === 'proximas' ? 'white' : '#475569',
              border: '1px solid ' + (filter === 'proximas' ? '#0369a1' : '#e2e8f0'),
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            📅 Próximas
          </button>
          <button 
            onClick={() => setFilter('canceladas')}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: filter === 'canceladas' ? '#0369a1' : '#f1f5f9',
              color: filter === 'canceladas' ? 'white' : '#475569',
              border: '1px solid ' + (filter === 'canceladas' ? '#0369a1' : '#e2e8f0'),
              borderRadius: '8px', 
              cursor: 'pointer', 
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            🔴 Canceladas
          </button>
        </div>

        {/* Botón Actualizar */}
        <button 
          onClick={fetchAppointments} 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#f1f5f9', 
            border: '1px solid #e2e8f0', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            color: '#475569',
            fontWeight: '600'
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p>Cargando citas...</p>
        </div>
      ) : (
        <>
          {citasAMostrar.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '60px 40px',
              textAlign: 'center',
              color: '#94a3b8',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px', opacity: 0.6 }}>📭</div>
              <p style={{ fontSize: '16px', margin: 0, fontWeight: '500' }}>
                {filter === 'proximas' && 'No tienes próximas citas programadas'}
                {filter === 'canceladas' && 'No tienes citas canceladas'}
                {filter === 'todas' && 'Sin citas. ¡Reserva una ahora!'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {citasAMostrar.map(app => {
                const isActive = app.status !== 'REJECTED';
                const cancelable = isActive && canBeCancelled(app.startTime);
                const isAssigned = app.status === 'ASSIGNED';

                return (
                  <div
                    key={app.id}
                    style={{
                      backgroundColor: '#f8fafc',
                      padding: '16px',
                      borderRadius: '12px',
                      border: `1px solid ${isActive ? (isAssigned ? '#d1fae5' : '#fef3c7') : '#fee2e2'}`,
                      borderLeft: `4px solid ${isActive ? (isAssigned ? '#10b981' : '#f59e0b') : '#ef4444'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer'
                    }}
                    onClick={e => {
                      if (e.target.tagName === 'BUTTON') return;
                      setSelectedAppointment(app);
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    title="Ver detalle de la cita"
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 6px 0', fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>
                        {new Date(app.startTime).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
                      </p>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                        👨‍⚕️ Dr. {app.doctor?.lastName || 'N/A'} • {app.doctor?.specialty || 'N/A'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isActive && (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          backgroundColor: isAssigned ? '#dcfce7' : '#fef3c3',
                          color: isAssigned ? '#166534' : '#854d0e'
                        }}>
                          {isAssigned ? '✅ Confirmada' : '⏳ Pendiente'}
                        </span>
                      )}
                      {!isActive && (
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b'
                        }}>
                          ❌ Cancelada
                        </span>
                      )}
                      {isActive && (
                        <button
                          onClick={() => handleCancelAppointment(app.id)}
                          disabled={!cancelable}
                          style={{
                            background: cancelable ? '#ef4444' : '#e5e7eb',
                            color: cancelable ? 'white' : '#9ca3af',
                            cursor: cancelable ? 'pointer' : 'not-allowed',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            transition: 'all 0.2s ease',
                            opacity: cancelable ? 1 : 0.6
                          }}
                          onMouseEnter={e => {
                            if (cancelable) e.currentTarget.style.background = '#dc2626';
                          }}
                          onMouseLeave={e => {
                            if (cancelable) e.currentTarget.style.background = '#ef4444';
                          }}
                          title={!cancelable ? 'No puedes cancelar con menos de 12 horas' : ''}
                        >
                          ❌ Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
        />
      )}
    </div>
  );
}

export default MyAppointments;
