import React, { useState, useEffect } from 'react';
import AppointmentDetailModal from '../../components/AppointmentDetailModal';

const STATUS_LABELS = {
  ASSIGNED: 'Confirmada',
  OFFERED: 'Oferta pendiente',
  COMPLETED: 'Completada',
  REJECTED: 'Cancelada',
  REASSIGNED: 'Reasignada',
  BLOCKED: 'Bloqueado',
  NOT_RESPONDED: 'Sin respuesta',
  AVAILABLE: 'Disponible',
};

const STATUS_COLORS = {
  ASSIGNED: '#10b981',
  OFFERED: '#f59e0b',
  COMPLETED: '#0ea5e9',
  REJECTED: '#ef4444',
  REASSIGNED: '#8b5cf6',
  BLOCKED: '#475569',
  AVAILABLE: '#22c55e',
  NOT_RESPONDED: '#fbbf24',
};

const SPECIALTY_ES = {
  PEDIATRICS: 'Pediatría', DERMATOLOGY: 'Dermatología', CARDIOLOGY: 'Cardiología',
  GYNECOLOGY: 'Ginecología', DIGESTIVE: 'Digestivo', FAMILY_MEDICINE: 'Medicina de Familia',
  TRAUMATOLOGY: 'Traumatología', OPHTHALMOLOGY: 'Oftalmología', ENDOCRINOLOGY: 'Endocrinología',
  ENT: 'Otorrinolaringología', NEUROLOGY: 'Neurología', PSYCHIATRY: 'Psiquiatría',
  PSYCHOLOGY: 'Psicología', GENERAL_SURGERY: 'Cirugía General', RADIOLOGY: 'Radiología',
  UROLOGY: 'Urología', ALLERGY: 'Alergología',
};

function History({ authHeader, patientId }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('date-desc');
  const [doctorFilter, setDoctorFilter] = useState('ALL');
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    if (patientId) fetchAppointments();
  }, [patientId, authHeader]);

  const fetchAppointments = () => {
    if (!patientId) return;
    setLoading(true);
    fetch(`http://localhost:8080/api/appointments/patient/${patientId}`, {
      headers: { 'Authorization': authHeader }
    })
      .then(res => res.json())
      .then(data => { setAppointments(data); setLoading(false); })
      .catch(err => { console.error(err); setLoading(false); });
  };

  // Médicos únicos para el filtro
  const uniqueDoctors = [];
  const seenIds = new Set();
  appointments.forEach(app => {
    if (app.doctor && !seenIds.has(app.doctor.id)) {
      seenIds.add(app.doctor.id);
      uniqueDoctors.push(app.doctor);
    }
  });

  let filtered = appointments.filter(app =>
    doctorFilter === 'ALL' || String(app.doctor?.id) === doctorFilter
  );

  const sorted = [...filtered];
  if (sortBy === 'date-asc') sorted.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  else sorted.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.5rem' }}>📜 Mi Historial</h3>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>Todas tus citas registradas</p>
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <div>
            <label style={labelStyle}>👨‍⚕️ Filtrar por médico</label>
            <select value={doctorFilter} onChange={e => setDoctorFilter(e.target.value)} style={controlStyle}>
              <option value="ALL">Todos los médicos</option>
              {uniqueDoctors.map(doc => (
                <option key={doc.id} value={String(doc.id)}>
                  Dr. {doc.firstName} {doc.lastName} — {SPECIALTY_ES[doc.specialty] || doc.specialty}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>📊 Ordenar por</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={controlStyle}>
              <option value="date-desc">📅 Más recientes primero</option>
              <option value="date-asc">📅 Más antiguas primero</option>
            </select>
          </div>
        </div>

        {/* Tabla */}
        {loading ? (
          <p style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Cargando historial...</p>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>📭</div>
            <p style={{ margin: 0, fontSize: '15px' }}>
              {doctorFilter !== 'ALL' ? 'No hay citas con este médico.' : 'Aún no tienes citas registradas.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Fecha / Hora', 'Médico', 'Especialidad', 'Estado', 'Valoración'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '14px 16px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map(app => (
                  <tr
                    key={app.id}
                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.15s' }}
                    onClick={() => setSelectedAppointment(app)}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                    title="Ver detalle de la cita"
                  >
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>
                        {new Date(app.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {new Date(app.startTime).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <div style={{ fontWeight: '600', color: '#334155', fontSize: '14px' }}>
                        Dr. {app.doctor?.firstName} {app.doctor?.lastName}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle', color: '#64748b', fontSize: '13px' }}>
                      {SPECIALTY_ES[app.doctor?.specialty] || app.doctor?.specialty || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '12px', color: 'white', fontSize: '0.7rem', fontWeight: '700', backgroundColor: STATUS_COLORS[app.status] || '#94a3b8' }}>
                        {STATUS_LABELS[app.status] || app.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                      {app.status === 'COMPLETED' ? (
                        app.rating ? (
                          <span style={{ color: '#f59e0b', fontSize: '16px', letterSpacing: '-1px' }} title={`${app.rating}/5`}>
                            {'★'.repeat(app.rating)}{'☆'.repeat(5 - app.rating)}
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>Sin valorar</span>
                        )
                      ) : (
                        <span style={{ color: '#e2e8f0' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => { setSelectedAppointment(null); fetchAppointments(); }}
          role="patient"
          authHeader={authHeader}
        />
      )}
    </div>
  );
}

const labelStyle = { fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '8px', display: 'block', textTransform: 'uppercase' };
const controlStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: 'white', cursor: 'pointer', boxSizing: 'border-box' };

export default History;
