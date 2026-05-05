import React, { useState, useEffect } from 'react';

const STATUS_LABELS = {
  ASSIGNED: 'Confirmada',
  OFFERED: 'Oferta pendiente',
  AVAILABLE: 'Disponible',
  BLOCKED: 'Bloqueado',
  COMPLETED: 'Completada',
  REJECTED: 'Cancelada',
  REASSIGNED: 'Reasignada',
  NOT_RESPONDED: 'Sin respuesta',
};

const STATUS_COLORS = {
  ASSIGNED: { bg: '#dcfce7', color: '#166534' },
  OFFERED: { bg: '#fef3c7', color: '#854d0e' },
  AVAILABLE: { bg: '#dcfce7', color: '#15803d' },
  BLOCKED: { bg: '#f1f5f9', color: '#475569' },
  COMPLETED: { bg: '#e0f2fe', color: '#0369a1' },
  REJECTED: { bg: '#fee2e2', color: '#991b1b' },
  REASSIGNED: { bg: '#ede9fe', color: '#5b21b6' },
  NOT_RESPONDED: { bg: '#fef9c3', color: '#713f12' },
};

function Field({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ marginBottom: '10px' }}>
      <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{ marginTop: '3px', fontSize: '14px', color: '#1e293b', fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h4>
    </div>
  );
}

const DURATION_OPTIONS = [
  { label: '3 días', days: 3 },
  { label: '5 días', days: 5 },
  { label: '7 días (1 semana)', days: 7 },
  { label: '10 días', days: 10 },
  { label: '14 días (2 semanas)', days: 14 },
  { label: '21 días (3 semanas)', days: 21 },
  { label: '1 mes (30 días)', days: 30 },
  { label: '2 meses (60 días)', days: 60 },
  { label: '3 meses (90 días)', days: 90 },
];

const API_URL = process.env.REACT_APP_API_URL;

function PrescriptionsSection({ appointment, authHeader }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [allMeds, setAllMeds] = useState([]);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [selectedDays, setSelectedDays] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/prescriptions/appointment/${appointment.id}`, {
      headers: { Authorization: authHeader }
    }).then(r => r.json()).then(data => setPrescriptions(Array.isArray(data) ? data : []));

    fetch(`${API_URL}/api/medications`, {
      headers: { Authorization: authHeader }
    }).then(r => r.json()).then(data => setAllMeds(Array.isArray(data) ? data : []));
  }, [appointment.id, authHeader]);

  const prescribedIds = new Set(prescriptions.map(p => p.medication?.id));
  const availableMeds = allMeds.filter(m => !prescribedIds.has(m.id));

  const canAdd = selectedMedId && selectedDays;

  const handleAdd = () => {
    if (!canAdd) return;
    setSaving(true);
    fetch(`${API_URL}/api/prescriptions`, {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId: appointment.id,
        medicationId: parseInt(selectedMedId),
        durationDays: parseInt(selectedDays),
        notes: notes || null
      })
    })
      .then(r => r.json())
      .then(newPresc => {
        setPrescriptions(prev => [...prev, newPresc]);
        setSelectedMedId('');
        setSelectedDays('');
        setNotes('');
        setSaving(false);
      })
      .catch(() => setSaving(false));
  };

  const handleRemove = (prescId) => {
    fetch(`${API_URL}/api/prescriptions/${prescId}`, {
      method: 'DELETE',
      headers: { Authorization: authHeader }
    }).then(r => {
      if (r.ok) setPrescriptions(prev => prev.filter(p => p.id !== prescId));
    });
  };

  return (
    <div style={{ marginTop: '8px' }}>
      <SectionTitle icon="💊" title="Medicamentos recetados" />

      {prescriptions.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 14px 0' }}>Ningún medicamento recetado en esta cita.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {prescriptions.map(p => {
            const isExpired = p.expiresAt && new Date(p.expiresAt) < new Date();
            const expiresLabel = p.expiresAt
              ? new Date(p.expiresAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
              : null;
            return (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: isExpired ? '#f8fafc' : '#f0fdf4', borderRadius: '8px', padding: '10px 14px', border: `1px solid ${isExpired ? '#e2e8f0' : '#bbf7d0'}` }}>
                <div>
                  <span style={{ fontWeight: '700', color: isExpired ? '#94a3b8' : '#166534', fontSize: '14px' }}>💊 {p.medication?.name}</span>
                  {p.medication?.dosage && <span style={{ color: '#6ee7b7', fontSize: '12px', marginLeft: '8px' }}>{p.medication.dosage}</span>}
                  {p.durationDays && (
                    <div style={{ fontSize: '11px', color: isExpired ? '#94a3b8' : '#16a34a', marginTop: '3px' }}>
                      ⏱ {p.durationDays} días{expiresLabel ? ` — ${isExpired ? 'Venció el' : 'Hasta el'} ${expiresLabel}` : ''}
                    </div>
                  )}
                  {p.notes && <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px', fontStyle: 'italic' }}>"{p.notes}"</div>}
                </div>
                <button
                  onClick={() => handleRemove(p.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px', padding: '0 4px', lineHeight: 1, flexShrink: 0 }}
                  title="Eliminar receta"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {availableMeds.length > 0 && (
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '14px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Añadir medicamento</p>
          <select
            value={selectedMedId}
            onChange={e => { setSelectedMedId(e.target.value); setSelectedDays(''); }}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', marginBottom: '8px', backgroundColor: 'white' }}
          >
            <option value="">1. Seleccionar medicamento...</option>
            {availableMeds.map(m => (
              <option key={m.id} value={m.id}>{m.name}{m.dosage ? ` — ${m.dosage}` : ''}</option>
            ))}
          </select>
          <select
            value={selectedDays}
            onChange={e => setSelectedDays(e.target.value)}
            disabled={!selectedMedId}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${selectedMedId ? '#cbd5e1' : '#e2e8f0'}`, fontSize: '14px', marginBottom: '8px', backgroundColor: selectedMedId ? 'white' : '#f1f5f9', color: selectedMedId ? '#1e293b' : '#94a3b8', cursor: selectedMedId ? 'pointer' : 'not-allowed' }}
          >
            <option value="">2. Duración del tratamiento...</option>
            {DURATION_OPTIONS.map(opt => (
              <option key={opt.days} value={opt.days}>{opt.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Indicaciones adicionales (opcional)..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <button
            onClick={handleAdd}
            disabled={!canAdd || saving}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: canAdd ? '#10b981' : '#e2e8f0', color: canAdd ? 'white' : '#94a3b8', fontWeight: '700', cursor: canAdd ? 'pointer' : 'not-allowed', fontSize: '14px' }}
          >
            {saving ? 'Guardando...' : '+ Recetar medicamento'}
          </button>
        </div>
      )}

      {allMeds.length === 0 && (
        <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '8px' }}>No hay medicamentos registrados en el sistema.</p>
      )}
    </div>
  );
}

function StarPicker({ value, onChange, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span
          key={star}
          onClick={() => !readonly && onChange(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            fontSize: '28px',
            cursor: readonly ? 'default' : 'pointer',
            color: star <= (hover || value) ? '#f59e0b' : '#e2e8f0',
            transition: 'color 0.1s',
            lineHeight: 1
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function RatingSection({ appointment, authHeader }) {
  const [rating, setRating] = useState(appointment.rating || 0);
  const [saved, setSaved] = useState(!!appointment.rating);
  const [saving, setSaving] = useState(false);

  const handleRate = (star) => {
    setSaving(true);
    fetch(`${API_URL}/api/appointments/${appointment.id}/rating`, {
      method: 'PATCH',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: star })
    })
      .then(r => r.json())
      .then(() => { setRating(star); setSaved(true); setSaving(false); })
      .catch(() => setSaving(false));
  };

  return (
    <div style={{ marginTop: '8px' }}>
      <SectionTitle icon="⭐" title="Tu valoración" />
      {saved ? (
        <div>
          <StarPicker value={rating} readonly />
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            Valoraste esta cita con {rating} de 5 estrellas.{' '}
            <span
              onClick={() => setSaved(false)}
              style={{ color: '#0369a1', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Cambiar
            </span>
          </p>
        </div>
      ) : (
        <div>
          <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#64748b' }}>
            ¿Cómo fue tu consulta? La valoración es opcional.
          </p>
          <StarPicker value={rating} onChange={handleRate} />
          {saving && <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Guardando...</p>}
        </div>
      )}
    </div>
  );
}

function AppointmentDetailModal({ appointment, onClose, role = 'patient', authHeader }) {
  if (!appointment) return null;

  const statusLabel = STATUS_LABELS[appointment.status] || appointment.status;
  const statusStyle = STATUS_COLORS[appointment.status] || { bg: '#f1f5f9', color: '#475569' };

  const startDate = new Date(appointment.startTime);
  const endDate = new Date(startDate.getTime() + (appointment.durationMinutes || 60) * 60000);

  const formatDate = (d) =>
    d.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const formatTime = (d) =>
    d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  const formatDateTime = (isoStr) => {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    return `${formatDate(d)} a las ${formatTime(d)}`;
  };

  const { doctor, patient } = appointment;
  const showPrescriptions = role === 'doctor' && appointment.status === 'COMPLETED';
  const showRating = role === 'patient' && appointment.status === 'COMPLETED';

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>Detalle de la Cita</h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>ID #{appointment.id}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ padding: '5px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, backgroundColor: statusStyle.bg, color: statusStyle.color }}>
              {statusLabel}
            </span>
            <button
              onClick={onClose}
              style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 28px' }}>

          {/* Fecha y hora */}
          <div style={{ marginBottom: '24px' }}>
            <SectionTitle icon="📅" title="Fecha y hora" />
            <Field label="Fecha" value={formatDate(startDate)} />
            <Field label="Horario" value={`${formatTime(startDate)} – ${formatTime(endDate)}`} />
            <Field label="Duración" value={`${appointment.durationMinutes || 60} minutos`} />
            {appointment.offeredAt && (
              <Field label="Ofrecida el" value={formatDateTime(appointment.offeredAt)} />
            )}
          </div>

          {/* Doctor */}
          {doctor && (
            <div style={{ marginBottom: '24px' }}>
              <SectionTitle icon="👨‍⚕️" title="Médico" />
              <Field label="Nombre" value={`Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()} />
              <Field label="Nº Colegiado" value={doctor.licenseNumber} />
            </div>
          )}

          {/* Paciente */}
          {patient && (
            <div style={{ marginBottom: '24px' }}>
              <SectionTitle icon="🧑" title="Paciente" />
              <Field label="Nombre" value={`${patient.firstName || ''} ${patient.lastName || ''}`.trim()} />
            </div>
          )}

          {/* Info adicional */}
          <div style={{ marginBottom: showPrescriptions ? '24px' : 0 }}>
            <SectionTitle icon="📋" title="Información adicional" />
            <Field label="Reasignada" value={appointment.reassigned || appointment.isReassigned ? 'Sí' : 'No'} />
            {appointment.notes && <Field label="Notas" value={appointment.notes} />}
          </div>

          {/* Medicamentos — solo médico en citas COMPLETED */}
          {showPrescriptions && (
            <PrescriptionsSection appointment={appointment} authHeader={authHeader} />
          )}

          {/* Valoración — solo paciente en citas COMPLETED */}
          {showRating && (
            <RatingSection appointment={appointment} authHeader={authHeader} />
          )}
        </div>
      </div>
    </div>
  );
}

export default AppointmentDetailModal;
