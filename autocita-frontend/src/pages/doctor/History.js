import React, { useState, useEffect } from 'react';
import AppointmentTable from './AppointmentTable';

function History({ authHeader, doctorId }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    if (doctorId) fetchAppointments();
  }, [doctorId, authHeader]);

  const fetchAppointments = () => {
    setLoading(true);
    fetch(`http://localhost:8080/api/appointments/doctor/${doctorId}`, {
      headers: { 'Authorization': authHeader }
    })
      .then(res => res.json())
      .then(data => {
        setAppointments(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  let filtered = appointments.filter(app => {
    if (!searchTerm) return true;
    const name = app.patient 
      ? `${app.patient.firstName} ${app.patient.lastName}`.toLowerCase() 
      : '';
    return name.includes(searchTerm.toLowerCase());
  });

  let sorted = [...filtered];
  
  if (sortBy === 'date-asc') {
    sorted.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  } else if (sortBy === 'date-desc') {
    sorted.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  } else if (sortBy === 'patient') {
    sorted.sort((a, b) => {
      const nameA = a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : 'Z';
      const nameB = b.patient ? `${b.patient.firstName} ${b.patient.lastName}` : 'Z';
      return nameA.localeCompare(nameB);
    });
  } else if (sortBy === 'status') {
    const order = { 'COMPLETED': 0, 'ASSIGNED': 1, 'OFFERED': 2, 'REJECTED': 3, 'CANCELLED': 3, 'BLOCKED': 4 };
    sorted.sort((a, b) => (order[a.status] || 5) - (order[b.status] || 5));
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>📜 Historial Completo</h3>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
              Listado histórico de todas las citas.
            </p>
          </div>
          <span style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
            Total: {sorted.length} / {appointments.length} registros
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>🔍 Buscar por Paciente</label>
            <input type="text" placeholder="Nombre del paciente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: 'white', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>📊 Ordenar por</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer', boxSizing: 'border-box' }}>
              <option value="date-desc">📅 Fecha (recientes primero)</option>
              <option value="date-asc">📅 Fecha (antiguas primero)</option>
              <option value="patient">👤 Paciente A-Z</option>
              <option value="status">🏷️ Estado</option>
            </select>
          </div>

          {searchTerm && <div><label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block' }}>&nbsp;</label><button onClick={() => setSearchTerm('')} style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#fee2e2', color: '#b91c1c', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxSizing: 'border-box' }}>✕ Limpiar búsqueda</button></div>}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Cargando registros...</p>
        ) : sorted.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            {searchTerm ? '❌ No se encontraron citas.' : '📭 No hay registros.'}
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <AppointmentTable data={sorted} showActions={false} />
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <LegendItem color="#22c55e" text="COMPLETED" />
        <LegendItem color="#ef4444" text="REJECTED/CANCELLED" />
        <LegendItem color="#3b82f6" text="ASSIGNED" />
        <LegendItem color="#f59e0b" text="OFFERED" />
        <LegendItem color="#94a3b8" text="BLOCKED" />
      </div>
    </div>
  );
}

const LegendItem = ({ color, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#64748b', fontWeight: 'bold' }}>
    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }}></div>
    {text}
  </div>
);

export default History;