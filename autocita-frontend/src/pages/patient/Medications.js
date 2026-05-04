import React, { useState, useEffect } from 'react';

const CATEGORY_ICONS = {
  'Analgésico': '💊',
  'Antibiótico': '🦠',
  'Antiinflamatorio': '🔥',
  'Antiácido': '🛡️',
  'Antihipertensivo': '❤️',
  'Antidiabético': '🩸',
  'Ansiolítico': '🧠',
  'Antidepresivo': '🧠',
  'Antihistamínico': '🌿',
  'Broncodilatador': '💨',
  'Vitamina': '⭐',
};

const categoryIcon = (cat) => CATEGORY_ICONS[cat] || '💊';

function Medications({ authHeader, patientId }) {
  const [medications, setMedications] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas');

  useEffect(() => {
    if (!patientId) return;
    Promise.all([
      fetch('http://localhost:8080/api/medications', { headers: { Authorization: authHeader } }).then(r => r.json()),
      fetch(`http://localhost:8080/api/prescriptions/patient/${patientId}`, { headers: { Authorization: authHeader } }).then(r => r.json()),
    ])
      .then(([meds, presc]) => {
        setMedications(Array.isArray(meds) ? meds : []);
        setPrescriptions(Array.isArray(presc) ? presc : []);
        setLoading(false);
      })
      .catch(err => { console.error(err); setLoading(false); });
  }, [patientId, authHeader]);

  const now = new Date();

  const isActive = (presc) => {
    if (!presc) return false;
    if (!presc.expiresAt) return true;
    return new Date(presc.expiresAt) > now;
  };

  const prescriptionByMedId = {};
  prescriptions.forEach(p => {
    const medId = p.medication?.id;
    if (!medId) return;
    const existing = prescriptionByMedId[medId];
    
    if (!existing || (isActive(p) && !isActive(existing)) ||
        (isActive(p) === isActive(existing) && new Date(p.prescribedAt) > new Date(existing.prescribedAt))) {
      prescriptionByMedId[medId] = p;
    }
  });

  const activePrescribedCount = Object.values(prescriptionByMedId).filter(isActive).length;

  const filtered = medications.filter(med => {
    const presc = prescriptionByMedId[med.id];
    const isPrescribed = isActive(presc);
    if (filter === 'recetadas') return isPrescribed;
    if (filter === 'sin_receta') return !isPrescribed;
    return true;
  });

  return (
    <div style={{ padding: '20px' }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: '1.6rem', fontWeight: '800' }}>💊 Medicamentos</h2>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
            Catálogo de medicamentos disponibles y los que te han recetado tus médicos
          </p>
        </div>
        <span style={{ backgroundColor: activePrescribedCount > 0 ? '#dcfce7' : '#e2e8f0', color: activePrescribedCount > 0 ? '#166534' : '#475569', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
          {activePrescribedCount} receta{activePrescribedCount !== 1 ? 's' : ''} activa{activePrescribedCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[
          { key: 'todas', label: '📋 Todos', count: medications.length },
          { key: 'recetadas', label: '✅ Recetados', count: activePrescribedCount },
          { key: 'sin_receta', label: '📦 Sin receta', count: medications.length - activePrescribedCount },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: `1px solid ${filter === f.key ? '#0369a1' : '#e2e8f0'}`,
              backgroundColor: filter === f.key ? '#0369a1' : '#f8fafc',
              color: filter === f.key ? 'white' : '#475569',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
          >
            {f.label} <span style={{ opacity: 0.75, fontSize: '12px' }}>({f.count})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', padding: '60px', color: '#94a3b8' }}>Cargando medicamentos...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <div style={{ fontSize: '52px', marginBottom: '12px', opacity: 0.5 }}>📭</div>
          <p style={{ margin: 0, fontSize: '15px' }}>
            {filter === 'recetadas' ? 'Aún no tienes medicamentos recetados.' : 'No hay medicamentos disponibles.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {filtered.map(med => {
            const presc = prescriptionByMedId[med.id];
            const active = isActive(presc);
            return (
              <div
                key={med.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '14px',
                  padding: '20px',
                  border: active ? '2px solid #10b981' : '1px solid #e2e8f0',
                  boxShadow: active ? '0 4px 16px rgba(16,185,129,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
                  position: 'relative',
                  transition: 'box-shadow 0.2s'
                }}
              >
                {active && (
                  <div style={{
                    position: 'absolute', top: '14px', right: '14px',
                    backgroundColor: '#dcfce7', color: '#166534',
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '11px', fontWeight: '700'
                  }}>
                    ✅ RECETADO
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{
                    width: '56px', height: '56px', borderRadius: '12px',
                    backgroundColor: active ? '#dcfce7' : '#f1f5f9',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px', flexShrink: 0, overflow: 'hidden'
                  }}>
                    {med.imageUrl ? (
                      <img
                        src={med.imageUrl}
                        alt={med.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }}
                        onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = categoryIcon(med.category); }}
                      />
                    ) : (
                      categoryIcon(med.category)
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '15px' }}>{med.name}</div>
                    {med.category && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{med.category}</div>}
                  </div>
                </div>

                {med.activeIngredient && (
                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600' }}>Principio activo:</span> {med.activeIngredient}
                  </div>
                )}
                {med.dosage && (
                  <div style={{ fontSize: '13px', color: '#475569', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600' }}>Dosificación:</span> {med.dosage}
                  </div>
                )}
                {med.description && (
                  <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px', lineHeight: '1.5' }}>{med.description}</div>
                )}

                {presc && (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${active ? '#dcfce7' : '#e2e8f0'}` }}>
                    <div style={{ fontSize: '12px', color: active ? '#16a34a' : '#94a3b8', fontWeight: '600' }}>
                      👨‍⚕️ Dr. {presc.doctor?.firstName} {presc.doctor?.lastName}
                    </div>
                    {presc.appointment?.startTime && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                        📅 Cita del {new Date(presc.appointment.startTime).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                    {presc.durationDays && (
                      <div style={{ fontSize: '11px', color: active ? '#16a34a' : '#94a3b8', marginTop: '3px', fontWeight: '600' }}>
                        ⏱ {presc.durationDays} días
                        {presc.expiresAt && (
                          <span style={{ fontWeight: '400', color: active ? '#64748b' : '#ef4444', marginLeft: '4px' }}>
                            — {active ? 'Hasta el' : 'Venció el'} {new Date(presc.expiresAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                        )}
                      </div>
                    )}
                    {!active && presc.expiresAt && (
                      <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px', fontWeight: '600' }}>
                        ⚠️ Tratamiento finalizado
                      </div>
                    )}
                    {presc.notes && (
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px', fontStyle: 'italic' }}>
                        "{presc.notes}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Medications;
