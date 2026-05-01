import React, { useState, useEffect } from 'react';

function History({ authHeader, patientId }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      fetchAppointments();
    }
  }, [patientId, authHeader]);

  const fetchAppointments = () => {
    if (!patientId) return;
    setLoading(true);
    fetch(`http://localhost:8080/api/appointments/patient/${patientId}`, {
      headers: { 'Authorization': authHeader }
    })
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        setAppointments(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching appointments:', err);
        setLoading(false);
      });
  };

  const citasCompletadas = appointments.filter(app => app.status === 'COMPLETED');

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h2 style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '700' }}>
          📜 Historial de Citas
        </h2>
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
          <p style={{ color: '#64748b' }}>Cargando historial...</p>
        </div>
      ) : (
        <>
          {citasCompletadas.length === 0 ? (
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
              <p style={{ fontSize: '16px', margin: 0, fontWeight: '500' }}>Aún no tienes citas completadas</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {citasCompletadas.map(app => (
                <div
                  key={app.id}
                  style={{
                    backgroundColor: 'white',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #10b981',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '16px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 6px 0', fontWeight: '600', color: '#1e293b', fontSize: '15px' }}>
                      {new Date(app.startTime).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                      👨‍⚕️ Dr. {app.doctor?.lastName || 'N/A'} • {app.doctor?.specialty || 'N/A'}
                    </p>
                  </div>

                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    backgroundColor: '#dcfce7',
                    color: '#166534'
                  }}>
                    ✅ Completada
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default History;
