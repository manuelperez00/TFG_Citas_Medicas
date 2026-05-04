import React, { useState, useEffect } from 'react';
import AppointmentTable from './AppointmentTable';
import AppointmentDetailModal from '../../components/AppointmentDetailModal';

const STATUS_LABELS = {
  ALL: 'Todos los estados',
  ASSIGNED: 'Confirmada',
  COMPLETED: 'Completada',
  OFFERED: 'Oferta pendiente',
  REJECTED: 'Cancelada',
  REASSIGNED: 'Reasignada',
  BLOCKED: 'Bloqueado',
  NOT_RESPONDED: 'Sin respuesta',
  AVAILABLE: 'Disponible',
};

function History({ authHeader, doctorId }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    if (doctorId) fetchAppointments();
  }, [doctorId, authHeader]);

  const fetchAppointments = () => {
    setLoading(true);
    fetch(`http://localhost:8080/api/appointments/doctor/${doctorId}`, {
      headers: { 'Authorization': authHeader }
    })
      .then(res => res.json())
      .then(data => { setAppointments(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  const presentStatuses = ['ALL', ...new Set(appointments.map(a => a.status))];

  let filtered = appointments.filter(app => {
    const matchesSearch = !searchTerm || (app.patient
      ? `${app.patient.firstName} ${app.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
      : false);
    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sorted = [...filtered];
  if (sortBy === 'date-asc') sorted.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  else if (sortBy === 'date-desc') sorted.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  else if (sortBy === 'patient') sorted.sort((a, b) => {
    const na = a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : 'Z';
    const nb = b.patient ? `${b.patient.firstName} ${b.patient.lastName}` : 'Z';
    return na.localeCompare(nb);
  });
  else if (sortBy === 'status') {
    const order = { COMPLETED: 0, ASSIGNED: 1, OFFERED: 2, REJECTED: 3, REASSIGNED: 3, BLOCKED: 4 };
    sorted.sort((a, b) => (order[a.status] ?? 5) - (order[b.status] ?? 5));
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>📜 Historial Completo</h3>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Registro de todas las citas</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span style={{ backgroundColor: '#e2e8f0', color: '#475569', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>
              {sorted.length} / {appointments.length} registros
            </span>
            <button onClick={fetchAppointments} style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#475569', fontWeight: '600', fontSize: '13px' }}>
              🔄 Actualizar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div>
            <label style={labelStyle}>🔍 Buscar paciente</label>
            <input
              type="text"
              placeholder="Nombre del paciente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={controlStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>🏷️ Estado</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={controlStyle}>
              {presentStatuses.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>📊 Ordenar por</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={controlStyle}>
              <option value="date-desc">📅 Más recientes primero</option>
              <option value="date-asc">📅 Más antiguas primero</option>
              <option value="patient">👤 Paciente A-Z</option>
              <option value="status">🏷️ Por estado</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Cargando registros...</p>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>📭</div>
            <p style={{ margin: 0, fontSize: '15px' }}>
              {searchTerm || statusFilter !== 'ALL' ? 'No hay citas con los filtros actuales.' : 'No hay registros.'}
            </p>
          </div>
        ) : (
          <AppointmentTable data={sorted} showActions={false} onRowClick={setSelectedAppointment} />
        )}
      </div>

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          role="doctor"
          authHeader={authHeader}
        />
      )}
    </div>
  );
}

const labelStyle = { fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block', textTransform: 'uppercase' };
const controlStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer', boxSizing: 'border-box' };

export default History;
