import React, { useState, useEffect } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

const REASON_LABELS = {
  OFERTA_ENVIADA:                        'Oferta enviada',
  OFERTA_ACEPTADA:                       'Oferta aceptada',
  OFERTA_RECHAZADA:                      'Oferta rechazada',
  NOT_RESPONDED:                         'Sin respuesta (expirada)',
  SIN_CANDIDATOS_DISPONIBLES:            'Sin candidatos',
  LIBERADA_POR_ACEPTACION_LISTA_ESPERA_ANTERIOR: 'Liberada (paciente aceptó cita anterior)',
  CANCELADA_POR_ASIGNACION_LISTA_ESPERA: 'Cancelada (asignación lista espera)',
};

const REASON_COLORS = {
  OFERTA_ENVIADA:             { bg: '#dbeafe', text: '#1d4ed8' },
  OFERTA_ACEPTADA:            { bg: '#dcfce7', text: '#15803d' },
  OFERTA_RECHAZADA:           { bg: '#fee2e2', text: '#b91c1c' },
  NOT_RESPONDED:              { bg: '#fef3c7', text: '#92400e' },
  SIN_CANDIDATOS_DISPONIBLES: { bg: '#f1f5f9', text: '#475569' },
};

function StatCard({ icon, value, label, color }) {
  return (
    <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ width: '52px', height: '52px', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.4rem', backgroundColor: color.bg, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <h4 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '700', color: '#1e293b' }}>{value}</h4>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>{label}</p>
      </div>
    </div>
  );
}

function StarDisplay({ rating, total }) {
  if (!total) return <span style={{ color: '#94a3b8', fontSize: '13px' }}>Sin valoraciones</span>;
  const rounded = Math.round(rating);
  return (
    <div>
      <div style={{ color: '#f59e0b', fontSize: '22px', letterSpacing: '-1px', lineHeight: 1 }}>
        {'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}
      </div>
      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
        {rating.toFixed(1)} / 5 · {total} valoracion{total !== 1 ? 'es' : ''}
      </div>
    </div>
  );
}

function DoctorReassignmentStats({ authHeader, doctorId }) {
  const [stats, setStats]       = useState(null);
  const [history, setHistory]   = useState([]);
  const [ratingData, setRating] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [searchTerm, setSearch] = useState('');

  useEffect(() => {
    if (!doctorId) return;
    setLoading(true);
    Promise.all([
      fetch(`${API_URL}/api/reassignment/doctor/${doctorId}/stats`, { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch(`${API_URL}/api/reassignment/doctor/${doctorId}/history`, { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch(`${API_URL}/api/appointments/doctor/${doctorId}/rating`, { headers: { Authorization: authHeader } }).then(r => r.json()),
    ])
      .then(([s, h, r]) => { setStats(s); setHistory(Array.isArray(h) ? h : []); setRating(r); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [doctorId, authHeader]);

  const filtered = history.filter(log => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.originalPatient?.toLowerCase().includes(term) ||
      log.newPatient?.toLowerCase().includes(term) ||
      REASON_LABELS[log.reason]?.toLowerCase().includes(term)
    );
  });

  if (loading) return <p style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Cargando estadísticas...</p>;

  const tasa = stats.ofertasEnviadas > 0
    ? Math.round((stats.aprovechados / stats.ofertasEnviadas) * 100)
    : 0;

  return (
    <div style={{ padding: '24px 0' }}>

      {/* KPIs - Primera Fila */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        <StatCard icon="♻️" value={stats.aprovechados}    label="Huecos aprovechados"        color={{ bg: '#dcfce7' }} />
        <StatCard icon="📤" value={stats.ofertasEnviadas} label="Ofertas enviadas"            color={{ bg: '#dbeafe' }} />
        <StatCard icon="❌" value={stats.rechazadas}       label="Ofertas rechazadas"          color={{ bg: '#fee2e2' }} />
        <StatCard icon="⏳" value={stats.noRespondidas}   label="Sin respuesta (expiradas)"   color={{ bg: '#fef3c7' }} />
      </div>

      {/* KPIs - Segunda Fila (corregido) */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'stretch',   // 👈 AÑADIDO
        gap: '20px',
        flexWrap: 'wrap',
        marginBottom: '32px'
      }}>
        
        <div style={{ flex: '1 1 240px', maxWidth: '320px', minHeight: '120px' }}>
          <StatCard icon="🚫" value={stats.sinCandidatos} label="Sin candidatos disponibles" color={{ bg: '#f1f5f9' }} />
        </div>
        
        <div style={{ flex: '1 1 240px', maxWidth: '320px', minHeight: '120px' }}>
          <StatCard icon="📊" value={`${tasa}%`} label="Tasa de aprovechamiento" color={{ bg: '#f3e8ff' }} />
        </div>
        
        <div style={{ flex: '1 1 240px', maxWidth: '320px', minHeight: '120px' }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.4rem', backgroundColor: '#fef9c3', flexShrink: 0 }}>
              ⭐
            </div>
            <div>
              <p style={{ margin: '0 0 4px 0', color: '#64748b', fontSize: '0.875rem', fontWeight: '600' }}>Valoración de pacientes</p>
              <StarDisplay rating={ratingData?.avgRating ?? 0} total={ratingData?.totalRatings ?? 0} />
            </div>
          </div>
        </div>

      </div>

      {/* Historial */}
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, color: '#1e293b' }}>📋 Historial de reasignaciones</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
              {filtered.length} / {history.length} registros
            </p>
          </div>
          <input
            type="text"
            placeholder="Buscar por paciente o motivo..."
            value={searchTerm}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', minWidth: '240px' }}
          />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Fecha evento', 'Fecha cita', 'Paciente original', 'Candidato ofertado', 'Motivo'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.8rem', fontWeight: '600', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>No hay registros.</td></tr>
              ) : filtered.map(log => {
                const colors = REASON_COLORS[log.reason] ?? { bg: '#f8fafc', text: '#475569' };
                return (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#475569' }}>
                      {new Date(log.timestamp + 'Z').toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.875rem', color: '#475569' }}>
                      {new Date(log.appointmentDate).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: '500', color: '#1e293b' }}>{log.originalPatient}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '500', color: '#1e293b' }}>{log.newPatient}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ backgroundColor: colors.bg, color: colors.text, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>
                        {REASON_LABELS[log.reason] ?? log.reason}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DoctorReassignmentStats;
