import React, { useState, useEffect } from 'react';
import { useModal } from '../../components/AppModal';

const SPECIALTY_ES = {
  PEDIATRICS: 'Pediatría',
  DERMATOLOGY: 'Dermatología',
  CARDIOLOGY: 'Cardiología',
  GYNECOLOGY: 'Ginecología',
  DIGESTIVE: 'Digestivo',
  FAMILY_MEDICINE: 'Medicina de Familia',
  TRAUMATOLOGY: 'Traumatología',
  OPHTHALMOLOGY: 'Oftalmología',
  ENDOCRINOLOGY: 'Endocrinología',
  ENT: 'Otorrinolaringología',
  NEUROLOGY: 'Neurología',
  PSYCHIATRY: 'Psiquiatría',
  PSYCHOLOGY: 'Psicología',
  GENERAL_SURGERY: 'Cirugía General',
  RADIOLOGY: 'Radiología',
  UROLOGY: 'Urología',
  ALLERGY: 'Alergología',
};

const specialtyEs = (value) => SPECIALTY_ES[value] ?? value;

const API_URL = process.env.REACT_APP_API_URL;

function StarsBadge({ avgRating, totalRatings }) {
  if (!totalRatings) return <span style={{ fontSize: '11px', color: '#94a3b8' }}>Sin valoraciones</span>;
  const rounded = Math.round(avgRating);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
      <span style={{ color: '#f59e0b', fontSize: '13px', letterSpacing: '-1px' }}>
        {'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}
      </span>
      <span style={{ fontSize: '11px', color: '#94a3b8' }}>
        {avgRating.toFixed(1)} ({totalRatings})
      </span>
    </div>
  );
}

function BookAppointment({ authHeader, patientId }) {
  const { showAlert } = useModal();
  const [doctors, setDoctors] = useState([]);
  const [doctorRatings, setDoctorRatings] = useState({});
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const morningSlots = ["09:00", "10:00", "11:00", "12:00", "13:00"];
  const afternoonSlots = ["16:00", "17:00", "18:00", "19:00", "20:00"];

  // Función para calcular la fecha máxima permitida (3 meses desde hoy)
  const getMaximumDateForAppointment = () => {
    const now = new Date();
    const maxDate = new Date(now);
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  // Inyectar estilos de animación
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      input[type="date"]:focus {
        border-color: #667eea !important;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
      }
      /* Estilos para desabilitar fechas después de 3 meses */
      input[type="date"]:disabled {
        background-color: #f1f5f9 !important;
        color: #94a3b8 !important;
        cursor: not-allowed !important;
      }
      button:hover:not(:disabled) {
        transform: translateY(-2px);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/api/doctors`, { headers: { 'Authorization': authHeader } })
      .then(res => res.json())
      .then(data => {
        setDoctors(data);
        return fetch(`${API_URL}/api/appointments/ratings/all`, { headers: { 'Authorization': authHeader } });
      })
      .then(res => res.json())
      .then(ratings => setDoctorRatings(ratings || {}))
      .catch(() => {});
  }, [authHeader]);

  // Cargar citas del paciente
  useEffect(() => {
    // Primero obtener el ID del paciente
    fetch(`${API_URL}/api/appointments/my-id`, {
      headers: { 'Authorization': authHeader }
    })
    .then(res => res.json())
    .then(myPatientId => {
      // Luego obtener sus citas
      return fetch(`${API_URL}/api/appointments/patient/${myPatientId}`, {
        headers: { 'Authorization': authHeader }
      })
      .then(res => res.json())
      .then(data => {
        setPatientAppointments(Array.isArray(data) ? data : []);
        console.log('Citas del paciente cargadas:', data);
      });
    })
    .catch(err => {
      console.warn('Error fetching patient appointments:', err);
      setPatientAppointments([]);
    });
  }, [authHeader]);

  const fetchDoctorAppointments = (doctorId) => {
    fetch(`${API_URL}/api/appointments/doctor/${doctorId}`, {
      headers: { 'Authorization': authHeader }
    })
    .then(res => res.json())
    .then(data => {
      console.log('📊 Citas del doctor cargadas:', data);
      setDoctorAppointments(Array.isArray(data) ? data : []);
    })
    .catch(err => {
      console.error('❌ Error cargando citas del doctor:', err);
      setDoctorAppointments([]);
    });
  };

  const handleSelectDoctor = (doc) => {
    setSelectedDoctor(doc);
    setSelectedTime(null);
    fetchDoctorAppointments(doc.id);
  };

  useEffect(() => {
    if (!selectedDoctor?.id) return;

    const pollInterval = setInterval(() => {
      fetchDoctorAppointments(selectedDoctor.id);
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [selectedDoctor?.id, authHeader]);

  const executeBooking = () => {
    if (isSubmitting) return;

    // Validar antes de enviar
    if (!canBookSlot(selectedTime)) {
      showAlert("❌ Esta cita viola las limitaciones diarias:\n\n• Máximo 1 cita por especialidad por día\n• Máximo 2 citas de diferentes especialidades por día\n• Evita overlaps de horarios\n\nSelecciona otro día u hora.");
      return;
    }

    setIsSubmitting(true);

    const request = {
      doctorId: selectedDoctor.id,
      patientId: patientId,
      startTime: `${selectedDate}T${selectedTime}`
    };

    fetch(`${API_URL}/api/appointments`, {
      method: 'POST',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    })
    .then(async res => {
      if (!res.ok) throw new Error(await res.text());
      setShowModal(false);
      setSelectedTime(null);
      showAlert("✅ Solicitud enviada con éxito");

      // Recargar citas del paciente después de confirmar
      fetch(`${API_URL}/api/appointments/patient/${patientId}`, {
        headers: { 'Authorization': authHeader }
      })
      .then(res => res.json())
      .then(data => setPatientAppointments(Array.isArray(data) ? data : []))
      .catch(err => console.warn('Error reloading appointments:', err));

      fetchDoctorAppointments(selectedDoctor.id);
    })
    .catch(err => showAlert("❌ Error: " + err.message))
    .finally(() => setIsSubmitting(false));
  };

  const getSlotStatus = (time) => {
    const targetDateTime = `${selectedDate} ${time}`;

    // Verificación de tiempo pasado
    if (new Date(`${selectedDate}T${time}`) < new Date()) return 'PAST';

    const normalizeForComparison = (dateStr) => {
      if (!dateStr) return "";
      return dateStr.replace('T', ' ').substring(0, 16);
    };

    const currentSlotNormalized = normalizeForComparison(targetDateTime);

    const activeOccupiedStatuses = ['BLOCKED', 'OFFERED', 'ASSIGNED', 'REASSIGNED', 'COMPLETED'];
    const doctorAppsAtTime = Array.isArray(doctorAppointments)
      ? doctorAppointments.filter(a => normalizeForComparison(a.startTime) === currentSlotNormalized)
      : [];
    const doctorApp = doctorAppsAtTime.find(a => activeOccupiedStatuses.includes(a.status))
      ?? doctorAppsAtTime[0] ?? null;

    const activeMineStatuses = ['ASSIGNED', 'REASSIGNED', 'OFFERED'];
    const myAppsAtTime = Array.isArray(patientAppointments)
      ? patientAppointments.filter(a => normalizeForComparison(a.startTime) === currentSlotNormalized)
      : [];
    const myApp = myAppsAtTime.find(a => activeMineStatuses.includes(a.status))
      ?? myAppsAtTime[0] ?? null;

    // 1. Bloqueos manuales
    if (doctorApp?.status === 'BLOCKED') return 'BLOCKED';

    // 2. Si la cita es del paciente logueado (Prioridad sobre Ocupado)
    if (myApp && ['ASSIGNED', 'REASSIGNED', 'OFFERED'].includes(myApp.status)) {
      return 'MINE';
    }

    // 3. Si hay una cita de otra persona (Estado ASSIGNED como en tu DB)
    if (doctorApp && ['OFFERED', 'ASSIGNED', 'REASSIGNED', 'COMPLETED'].includes(doctorApp.status)) {
      return 'OCCUPIED';
    }

    return 'FREE';
  };

  // Obtener citas del paciente para una fecha específica
  const getPatientAppointmentsForDate = (date) => {
    if (!Array.isArray(patientAppointments)) return [];
    
    return patientAppointments.filter(apt => {
      if (!apt.startTime) return false;
      const aptDate = apt.startTime.split('T')[0];
      return aptDate === date && ['ASSIGNED', 'REASSIGNED', 'OFFERED'].includes(apt.status);
    });
  };

  // Validar si el paciente puede reservar este slot
  const canBookSlot = (time) => {
    if (!selectedDoctor) return false;
    
    const slotStatus = getSlotStatus(time);
    
    // Si el slot no está libre, no puede reservar
    if (slotStatus !== 'FREE' && slotStatus !== 'MINE') return false;

    // Obtener citas del paciente para ese día
    const appointmentsThisDay = getPatientAppointmentsForDate(selectedDate);
    
    // Contar citas de la MISMA especialidad
    const sameSpecialtyCount = appointmentsThisDay.filter(
      apt => apt.doctor?.specialty === selectedDoctor.specialty
    ).length;

    // Si ya tiene 1 cita de esta especialidad hoy, no puede tener otra
    if (sameSpecialtyCount >= 1) return false;

    // Si ya tiene 2 citas de diferentes especialidades, no puede más
    if (appointmentsThisDay.length >= 2) return false;

    // Validar que no hay overlap de horarios
    const [slotHour] = time.split(':').map(Number);
    const slotStart = new Date(`${selectedDate}T${time}`);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000); // 1 hora de duración

    const hasOverlap = appointmentsThisDay.some(apt => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(aptStart.getTime() + 60 * 60 * 1000);
      return !(slotEnd <= aptStart || slotStart >= aptEnd);
    });

    return !hasOverlap;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px' }}>
      
      {/* --- MODAL DE CONFIRMACIÓN --- */}
      {showModal && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>✓</div>
            <h3 style={{ margin: '0 0 15px 0', fontSize: '22px', color: '#1e293b' }}>Confirmar solicitud de cita</h3>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '25px', textAlign: 'left' }}>
              <p style={{ margin: '8px 0', color: '#475569', fontSize: '14px' }}>
                <strong>Médico:</strong> Dr. {selectedDoctor.lastName}
              </p>
              <p style={{ margin: '8px 0', color: '#475569', fontSize: '14px' }}>
                <strong>Fecha:</strong> {new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p style={{ margin: '8px 0', color: '#475569', fontSize: '14px' }}>
                <strong>Hora:</strong> {selectedTime}h
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
              <button onClick={() => setShowModal(false)} style={btnCancelStyle} disabled={isSubmitting}>Cancelar</button>
              <button
                onClick={executeBooking}
                style={{ ...btnConfirmStyle, opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Confirmar solicitud'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <header style={{ marginBottom: '40px', color: '#1e293b', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📅</div>
          <h1 style={{ margin: 0, fontSize: '40px', fontWeight: 'bold', marginBottom: '10px' }}>Reserva tu Cita</h1>
          <p style={{ margin: 0, fontSize: '18px', opacity: 0.75, fontWeight: '300', color: '#64748b' }}>Selecciona tu médico y horario preferido</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 900 ? '1fr' : '340px 1fr', gap: '30px' }}>
          
          {/* LISTA MÉDICOS */}
          <div>
            <h3 style={{ color: 'white', marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '600' }}>Médicos Disponibles</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {doctors.map(doc => (
                <div 
                  key={doc.id}
                  onClick={() => handleSelectDoctor(doc)}
                  style={{
                    ...cardStyle, 
                    backgroundColor: selectedDoctor?.id === doc.id ? 'white' : 'rgba(255, 255, 255, 0.95)',
                    color: '#1e293b',
                    boxShadow: selectedDoctor?.id === doc.id ? '0 8px 32px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.1)',
                    border: selectedDoctor?.id === doc.id ? '2px solid #667eea' : '1px solid rgba(0,0,0,0.1)',
                    transform: selectedDoctor?.id === doc.id ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '18px', flexShrink: 0 }}>
                      👨‍⚕️
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '2px' }}>Dr. {doc.firstName} {doc.lastName}</div>
                      <div style={{ fontSize: '12px', opacity: 0.7, color: '#667eea', fontWeight: '500', marginBottom: '2px' }}>{specialtyEs(doc.specialty)}</div>
                      <StarsBadge
                        avgRating={doctorRatings[doc.id]?.avgRating ?? 0}
                        totalRatings={doctorRatings[doc.id]?.totalRatings ?? 0}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CALENDARIO / SLOTS */}
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
            {!selectedDoctor ? (
              <div style={{ textAlign: 'center', padding: '80px 40px', color: '#cbd5e1' }}>
                <div style={{ fontSize: '60px', marginBottom: '20px' }}>👈</div>
                <p style={{ fontSize: '18px', margin: 0 }}>Selecciona un médico para ver disponibilidad</p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingBottom: '25px', borderBottom: '2px solid #e2e8f0' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '20px', color: '#1e293b', marginBottom: '5px' }}>Dr. {selectedDoctor.lastName}</h3>
                    <p style={{ margin: 0, fontSize: '13px', color: '#667eea', fontWeight: '600' }}>{specialtyEs(selectedDoctor.specialty)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>Selecciona fecha:</label>
                    <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)} 
                      min={new Date().toISOString().split('T')[0]}
                      max={getMaximumDateForAppointment()}
                      style={inputStyle} 
                    />
                    <small style={{ display: 'block', fontSize: '11px', color: '#667eea', marginTop: '6px', fontWeight: '500' }}>
                      ℹ️ Máximo 3 meses desde hoy
                    </small>
                  </div>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: selectedDoctor.workShift === 'ANY' ? '1fr 1fr' : '1fr', gap: '40px' }}>
                    {(selectedDoctor.workShift === 'MORNING' || selectedDoctor.workShift === 'ANY') && (
                      <TimeGroup title="☀️ Mañana" slots={morningSlots} getStatus={getSlotStatus} canBook={canBookSlot} selected={selectedTime} onSelect={setSelectedTime} />
                    )}
                    {(selectedDoctor.workShift === 'AFTERNOON' || selectedDoctor.workShift === 'ANY') && (
                      <TimeGroup title="🌅 Tarde" slots={afternoonSlots} getStatus={getSlotStatus} canBook={canBookSlot} selected={selectedTime} onSelect={setSelectedTime} />
                    )}
                  </div>
                </div>

                {/* LEYENDA */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#dcfce7' }}></div>
                    <span style={{ color: '#64748b' }}>Disponible</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#fee2e2' }}></div>
                    <span style={{ color: '#64748b' }}>Ocupado</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#fef9c3' }}></div>
                    <span style={{ color: '#64748b' }}>Mi solicitud</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#e2e8f0' }}></div>
                    <span style={{ color: '#64748b' }}>No disponible</span>
                  </div>
                </div>

                {selectedTime && (
                  <button onClick={() => setShowModal(true)} style={actionButtonStyle}>
                    ✓ Solicitar cita para las {selectedTime}h
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  backdropFilter: 'blur(6px)'
};

const modalContentStyle = {
  backgroundColor: 'white', padding: '50px', borderRadius: '24px',
  textAlign: 'center', maxWidth: '450px', width: '90%',
  boxShadow: '0 25px 50px -12px rgba(102, 126, 234, 0.3)', 
  animation: 'slideDown 0.4s ease-out'
};

const cardStyle = { 
  padding: '16px', 
  borderRadius: '14px', 
  cursor: 'pointer', 
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  ':hover': { transform: 'translateY(-2px)' }
};

const inputStyle = { 
  padding: '12px 16px', 
  borderRadius: '10px', 
  border: '2px solid #e2e8f0',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  outline: 'none',
  cursor: 'pointer',
  backgroundColor: 'white'
};

const actionButtonStyle = {
  width: '100%', 
  marginTop: '15px', 
  padding: '18px', 
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white', 
  border: 'none', 
  borderRadius: '12px', 
  fontWeight: '600', 
  cursor: 'pointer',
  fontSize: '16px',
  transition: 'all 0.3s ease',
  boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
  ':hover': { transform: 'translateY(-2px)', boxShadow: '0 12px 36px rgba(102, 126, 234, 0.4)' }
};

const btnConfirmStyle = { 
  flex: 1, 
  padding: '14px', 
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white', 
  border: 'none', 
  borderRadius: '10px', 
  cursor: 'pointer', 
  fontWeight: '600',
  fontSize: '14px',
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
};

const btnCancelStyle = { 
  flex: 1, 
  padding: '14px', 
  backgroundColor: '#e2e8f0', 
  color: '#475569', 
  border: 'none', 
  borderRadius: '10px', 
  cursor: 'pointer', 
  fontWeight: '600',
  fontSize: '14px',
  transition: 'all 0.3s ease'
};

const TimeGroup = ({ title, slots, getStatus, canBook, selected, onSelect }) => (
  <div>
    <h4 style={{ color: '#1e293b', marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
      {title}
    </h4>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '10px' }}>
      {slots.map(time => {
        const status = getStatus(time);
        const canBookThisSlot = canBook(time);
        const isSelected = selected === time;
        
        let displayStatus = status;
        const colorMap = { 
          FREE: { bg: '#dcfce7', border: '#86efac', text: '#15803d', icon: '✓' },
          OCCUPIED: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', icon: '×' },
          MINE: { bg: '#fef9c3', border: '#facc15', text: '#854d0e', icon: '📌' },
          BLOCKED: { bg: '#e2e8f0', border: '#cbd5e1', text: '#64748b', icon: '🔒' },
          PAST: { bg: '#f1f5f9', border: '#cbd5e1', text: '#94a3b8', icon: '⏱' },
          LIMIT: { bg: '#f3e8ff', border: '#d8b4fe', text: '#6b21a8', icon: '⚠️' }
        };
        
        if (status === 'FREE' && !canBookThisSlot) {
          displayStatus = 'LIMIT';
        }
        
        const colors = colorMap[displayStatus];
        
        return (
          <button
            key={time} 
            disabled={!canBookThisSlot || status !== 'FREE'} 
            onClick={() => onSelect(time)}
            style={{
              padding: '14px 8px', 
              borderRadius: '10px', 
              border: isSelected ? `2px solid #667eea` : `2px solid ${colors.border}`,
              backgroundColor: isSelected ? '#eff6ff' : colors.bg, 
              cursor: (canBookThisSlot && status === 'FREE') ? 'pointer' : 'not-allowed',
              fontWeight: '600', 
              fontSize: '14px',
              color: colors.text,
              transition: 'all 0.2s ease',
              transform: (canBookThisSlot && status === 'FREE') ? 'scale(1)' : 'scale(0.95)',
              opacity: (canBookThisSlot && status === 'FREE') ? 1 : 0.6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              boxShadow: isSelected ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
            }}
            title={displayStatus === 'LIMIT' ? 'Ya tienes cita ese día (máx 2 por día, 1 por especialidad)' : status === 'PAST' ? 'Hora pasada' : status === 'OCCUPIED' ? 'Ocupado' : status === 'BLOCKED' ? 'Bloqueado' : ''}
          >
            <span style={{ fontSize: '16px' }}>{colors.icon}</span>
            <span>{time}</span>
          </button>
        );
      })}
    </div>
  </div>
);

export default BookAppointment;