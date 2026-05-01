import React, { useState, useEffect } from 'react';

function WaitingList({ authHeader, patientId }) {
  const [activeItems, setActiveItems] = useState([]);
  const [offeredItems, setOfferedItems] = useState([]);
  const [acceptedItems, setAcceptedItems] = useState([]);
  const [rejectedItems, setRejectedItems] = useState([]);
  const [expiredItems, setExpiredItems] = useState([]);
  const [cancelledItems, setCancelledItems] = useState([]);
  
  // Función para determinar la fecha mínima permitida
  const getMinimumDate = () => {
    const now = new Date();
    const hour = now.getHours();
    // Si son más de las 20:00, la fecha mínima es mañana
    if (hour >= 20) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    // Si no, la fecha mínima es hoy
    return now.toISOString().split('T')[0];
  };

  // Función para determinar la fecha máxima permitida (3 meses desde hoy)
  const getMaximumDate = () => {
    const now = new Date();
    const maxDate = new Date(now);
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };
  
  // Estado formulario inicio
  const [specialty, setSpecialty] = useState('CARDIOLOGY');
  const [urgency, setUrgency] = useState('LOW');
  const [timePref, setTimePref] = useState('ANY');
  const [preferredDate, setPreferredDate] = useState(getMinimumDate()); 

  // Inyectar estilos de animación
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
      input[type="date"]:focus, select:focus {
        border-color: #667eea !important;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
        outline: none;
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
      .waiting-list-card {
        animation: slideUp 0.5s ease-out;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const specialties = [
    { value: 'PEDIATRICS', label: 'Pediatría' },
    { value: 'DERMATOLOGY', label: 'Dermatología' },
    { value: 'CARDIOLOGY', label: 'Cardiología' },
    { value: 'GYNECOLOGY', label: 'Ginecología' },
    { value: 'DIGESTIVE', label: 'Aparato Digestivo' }
  ];

  const urgencies = [
    { value: 'LOW', label: 'Baja (Revisión de rutina)' },
    { value: 'MEDIUM', label: 'Media (Molestias leves)' },
    { value: 'HIGH', label: 'Alta (Necesidad urgente)' }
  ];

  const timePrefs = [
    { value: 'MORNING', label: 'Mañana' },
    { value: 'AFTERNOON', label: 'Tarde' },
    { value: 'ANY', label: 'Cualquier horario' }
  ];

  // Función para determinar qué horarios son válidos basado en hora actual y fecha seleccionada
  const getValidTimePreferences = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const today = new Date().toISOString().split('T')[0];
    
    // Si ha seleccionado hoy
    if (preferredDate === today) {
      // Si es por la tarde (después de las 14:00), solo permite tardes
      if (currentHour >= 14) {
        return timePrefs.filter(t => t.value === 'AFTERNOON');
      }
      // Si es por la mañana, permite todo
      return timePrefs;
    }
    
    // Para cualquier otra fecha (mañana o posterior), permite TODO
    // Porque ya hay tiempo suficiente
    return timePrefs;
  };

  // Si el horario actual no es válido para la fecha seleccionada, cambiar a un válido
  useEffect(() => {
    const validPrefs = getValidTimePreferences();
    if (!validPrefs.find(p => p.value === timePref)) {
      setTimePref(validPrefs[validPrefs.length - 1].value);
    }
  }, [preferredDate]);

  useEffect(() => {
    fetchMyList();
  }, [patientId]);

  const fetchMyList = () => {
    if (!patientId) return;
    fetch(`http://localhost:8080/api/waiting-list/patient/${patientId}`, {
      headers: { 'Authorization': authHeader }
    })
    .then(res => res.json())
    .then(data => {
      setActiveItems(data.active || []);
      setOfferedItems(data.offered || []);
      setAcceptedItems(data.accepted || []);
      setRejectedItems(data.rejected || []);
      setExpiredItems(data.expired || []);
      setCancelledItems(data.cancelled || []);
    })
    .catch(err => console.error("Error cargando lista:", err));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = new URL('http://localhost:8080/api/waiting-list');
    url.searchParams.append('patientId', patientId);
    url.searchParams.append('specialty', specialty);
    url.searchParams.append('urgency', urgency);
    url.searchParams.append('timePref', timePref);
    url.searchParams.append('preferredDate', preferredDate);

    fetch(url, {
      method: 'POST',
      headers: { 'Authorization': authHeader }
    })
    .then(async res => {
      if (!res.ok) throw new Error(await res.text());
      alert("✅ ¡Añadido a la lista de espera con éxito!");
      fetchMyList();
    })
    .catch(err => alert("❌ Error: " + err.message));
  };

  const handleDeleteWaitingList = (waitingListId) => {
    const confirmed = window.confirm(
      "¿Estás seguro de que deseas eliminar esta solicitud de lista de espera? No podrás recuperarla."
    );
    
    if (!confirmed) return;

    const url = new URL(`http://localhost:8080/api/waiting-list/${waitingListId}`);
    url.searchParams.append('patientId', patientId);

    fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': authHeader }
    })
    .then(async res => {
      if (!res.ok) throw new Error(await res.text());
      alert("✅ ¡Solicitud eliminada correctamente!");
      fetchMyList();
    })
    .catch(err => alert("❌ Error al eliminar la solicitud: " + err.message));
  };

  // Función para renderizar tarjetas de solicitudes
  const renderWaitingListItem = (item, bgColor, textColor, statusLabel) => (
    <div 
      key={item.id} 
      className="waiting-list-card"
      style={{ 
        backgroundColor: bgColor, 
        borderRadius: '12px', 
        padding: '20px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid rgba(0,0,0,0.05)',
        position: 'relative',
        overflow: 'hidden',
        opacity: 0.85
      }}
    >
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
          <span style={{ 
            padding: '6px 12px', 
            borderRadius: '6px', 
            fontSize: '10px', 
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            backgroundColor: bgColor,
            color: textColor,
            border: `1px solid ${textColor}33`
          }}>
            {statusLabel}
          </span>
          <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '500' }}>
            {new Date(item.requestDate).toLocaleDateString('es-ES')}
          </span>
        </div>

        <h4 style={{ margin: '0 0 15px 0', fontSize: '16px', color: '#1e293b', fontWeight: '600' }}>
          {item.specialty.replace(/_/g, ' ')}
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🕐</span>
            <span>{item.timePreference === 'MORNING' ? 'Mañana' : item.timePreference === 'AFTERNOON' ? 'Tarde' : 'Cualquier horario'}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>📅</span>
            <span>{new Date(item.preferredDate).toLocaleDateString('es-ES')}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>⚡</span>
            <span>{item.urgency === 'HIGH' ? 'Urgencia Alta' : item.urgency === 'MEDIUM' ? 'Urgencia Media' : 'Urgencia Baja'}</span>
          </div>
        </div>

        <button
          onClick={() => handleDeleteWaitingList(item.id)}
          style={{
            width: '100%',
            marginTop: '15px',
            padding: '10px 12px',
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontWeight: '600',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.3px'
          }}
          onMouseEnter={e => {
            e.target.style.backgroundColor = '#e2e8f0';
            e.target.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.target.style.backgroundColor = '#f1f5f9';
            e.target.style.transform = 'translateY(0)';
          }}
        >
          <span>🗑️</span>
          Eliminar
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* HEADER */}
        <header style={{ marginBottom: '50px', color: '#1e293b', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px', animation: 'bounce 2s infinite' }}>⏳</div>
          <h1 style={{ margin: 0, fontSize: '40px', fontWeight: 'bold', marginBottom: '15px' }}>Lista de Espera Inteligente</h1>
          <p style={{ margin: 0, fontSize: '16px', opacity: 0.85, fontWeight: '300', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto', color: '#64748b' }}>
            ¿No encuentras cita disponible? Nuestro sistema te reasignará automáticamente cuando alguien cancele una cita que se ajuste a tus preferencias.
          </p>
        </header>

        {/* BANNER INFORMATIVO */}
        <div style={{
          backgroundColor: '#e0f2fe',
          border: '2px solid #0ea5e9',
          borderRadius: '16px',
          padding: '20px 24px',
          marginBottom: '40px',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
          boxShadow: '0 4px 12px rgba(6, 182, 212, 0.1)'
        }}>
          <div style={{ fontSize: '24px', flexShrink: 0, marginTop: '2px' }}>💡</div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#0369a1', fontSize: '15px', fontWeight: '600' }}>
              Consejo: Verifica primero si hay citas disponibles
            </h4>
            <p style={{ margin: 0, color: '#0c4a6e', fontSize: '14px', lineHeight: '1.5', fontWeight: '400' }}>
              Antes de apuntarte a la lista de espera, te recomendamos que compruebes si todavía hay huecos disponibles para los días que te interesan en la sección de <strong>"Nueva Cita"</strong>. 
              Si encuentras un hueco libre, podrás reservarlo directamente y obtener tu cita al instante, sin necesidad de esperar. 
              Solo apúntate a esta lista si <strong>todos los huecos están ocupados</strong>.
            </p>
          </div>
        </div>

        {/* --- FORMULARIO DE ALTA --- */}
        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', marginBottom: '50px' }}>
          <h3 style={{ margin: '0 0 30px 0', fontSize: '22px', color: '#1e293b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '28px' }}>📝</span>
            Solicitar un hueco
          </h3>
          
          <form onSubmit={handleSubmit} style={{ 
            display: 'grid', 
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : 'repeat(4, 1fr)', 
            gap: '20px', 
            alignItems: 'flex-start' 
          }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <label style={{ fontWeight: '600', marginBottom: '10px', display: 'block', fontSize: '13px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🏥 Especialidad
              </label>
              <select 
                value={specialty} 
                onChange={e => setSpecialty(e.target.value)} 
                style={{ 
                  padding: '12px 16px', 
                  borderRadius: '10px', 
                  border: '2px solid #e2e8f0', 
                  fontSize: '14px',
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  outline: 'none',
                  flex: 1
                }}
              >
                {specialties.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <label style={{ fontWeight: '600', marginBottom: '10px', display: 'block', fontSize: '13px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ⚠️ Urgencia
              </label>
              <select 
                value={urgency} 
                onChange={e => setUrgency(e.target.value)} 
                style={{ 
                  padding: '12px 16px', 
                  borderRadius: '10px', 
                  border: '2px solid #e2e8f0', 
                  fontSize: '14px',
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  outline: 'none',
                  flex: 1
                }}
              >
                {urgencies.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <label style={{ fontWeight: '600', marginBottom: '10px', display: 'block', fontSize: '13px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📅 Fecha Preferente
              </label>
              <input
                type="date"
                value={preferredDate}
                min={getMinimumDate()}
                max={getMaximumDate()}
                onChange={e => setPreferredDate(e.target.value)}
                style={{ 
                  padding: '12px 16px', 
                  borderRadius: '10px', 
                  border: '2px solid #e2e8f0', 
                  fontSize: '14px',
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  outline: 'none',
                  flex: 1
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <label style={{ fontWeight: '600', marginBottom: '10px', display: 'block', fontSize: '13px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                🕐 Horario Preferente
              </label>
              <select 
                value={timePref} 
                onChange={e => setTimePref(e.target.value)} 
                style={{ 
                  padding: '12px 16px', 
                  borderRadius: '10px', 
                  border: '2px solid #e2e8f0', 
                  fontSize: '14px',
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  outline: 'none',
                  flex: 1
                }}
              >
                {getValidTimePreferences().map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {/* Mensaje informativo debajo de todos los campos */}
            {(() => {
              const now = new Date();
              const hour = now.getHours();
              const today = new Date().toISOString().split('T')[0];
              const messages = [];
              
              // Mensaje de hora
              if (preferredDate === today && hour >= 14) {
                messages.push({
                  type: 'time',
                  text: 'Debido a la hora actual, solo puedes seleccionar "Tarde" para hoy.'
                });
              }
              
              // Mensaje de rango de 3 meses
              messages.push({
                type: 'range',
                text: `Puedes solicitar citas desde hoy hasta ${new Date(new Date().setMonth(new Date().getMonth() + 3)).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} (máximo 3 meses).`
              });
              
              return messages.length > 0 ? (
                <div style={{ gridColumn: '1 / -1', marginTop: '-10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {messages.map((msg, idx) => (
                    <small key={idx} style={{ 
                      color: msg.type === 'time' ? '#f97316' : '#667eea', 
                      fontSize: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      fontWeight: '500' 
                    }}>
                      <span style={{ fontSize: '14px' }}>
                        {msg.type === 'time' ? '⚠️' : 'ℹ️'}
                      </span>
                      {msg.text}
                    </small>
                  ))}
                </div>
              ) : null;
            })()}

            <button 
              type="submit" 
              style={{ 
                gridColumn: '1 / -1',
                height: '48px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={e => {
                e.target.style.boxShadow = '0 12px 36px rgba(102, 126, 234, 0.4)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.target.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.3)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              ✓ Anotarme ahora
            </button>
          </form>
        </div>

        {/* MIS SOLICITUDES */}
        <div>
          {/* SOLICITUDES ACTIVAS */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
            <h3 style={{ margin: 0, color: '#1e293b', fontSize: '24px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>📂</span>
              Tus solicitudes en curso
            </h3>
            <button
              onClick={() => fetchMyList()}
              style={{
                padding: '10px 18px',
                backgroundColor: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={e => {
                e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.4)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <span>🔄</span>
              Actualizar
            </button>
          </div>
          
          {activeItems.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '80px 40px', 
              backgroundColor: 'rgba(255, 255, 255, 0.95)', 
              borderRadius: '20px', 
              color: '#94a3b8',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px', opacity: 0.6 }}>📋</div>
              <p style={{ fontSize: '16px', margin: 0, fontWeight: '500' }}>Aún no tienes solicitudes activas en la lista de espera</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {activeItems.map(item => (
                <div 
                  key={item.id} 
                  className="waiting-list-card"
                  style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '16px', 
                    padding: '28px', 
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    border: '2px solid #f1f5f9',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.boxShadow = '0 12px 36px rgba(102, 126, 234, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Fondo decorativo */}
                  <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    right: 0, 
                    width: '100px', 
                    height: '100px', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    opacity: 0.05,
                    borderRadius: '50%',
                    transform: 'translate(30px, -30px)'
                  }}></div>

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Header con urgencia y fecha */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <span style={{ 
                        padding: '8px 16px', 
                        borderRadius: '8px', 
                        fontSize: '11px', 
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        backgroundColor: item.urgency === 'HIGH' ? '#fee2e2' : item.urgency === 'MEDIUM' ? '#fef3c7' : '#dcfce7',
                        color: item.urgency === 'HIGH' ? '#991b1b' : item.urgency === 'MEDIUM' ? '#854d0e' : '#166534'
                      }}>
                        {item.urgency === 'HIGH' ? '🔴 Urgente' : item.urgency === 'MEDIUM' ? '🟡 Media' : '🟢 Baja'}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500' }}>
                        Solicitado: {new Date(item.requestDate).toLocaleDateString('es-ES')}
                      </span>
                    </div>

                    {/* Especialidad */}
                    <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b', fontWeight: '600' }}>
                      {item.specialty.replace(/_/g, ' ')}
                    </h4>

                    {/* Detalles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        <span style={{ fontSize: '16px' }}>🕐</span>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}>Horario:</span>
                          <p style={{ margin: '4px 0 0 0', color: '#1e293b', fontWeight: '600' }}>{item.timePreference === 'MORNING' ? 'Mañana' : item.timePreference === 'AFTERNOON' ? 'Tarde' : 'Cualquier horario'}</p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                        <span style={{ fontSize: '16px' }}>📅</span>
                        <div>
                          <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '500' }}>Fecha preferente:</span>
                          <p style={{ margin: '4px 0 0 0', color: '#1e293b', fontWeight: '600' }}>{new Date(item.preferredDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteWaitingList(item.id)}
                        style={{
                          width: '100%',
                          marginTop: '20px',
                          padding: '12px 16px',
                          backgroundColor: '#fee2e2',
                          color: '#991b1b',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          fontWeight: '600',
                          fontSize: '13px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                        onMouseEnter={e => {
                          e.target.style.backgroundColor = '#fecaca';
                          e.target.style.transform = 'translateY(-2px)';
                        }}
                        onMouseLeave={e => {
                          e.target.style.backgroundColor = '#fee2e2';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        <span>🗑️</span>
                        Eliminar solicitud
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* OTRAS SOLICITUDES (No activas) */}
          {(offeredItems.length > 0 || acceptedItems.length > 0 || rejectedItems.length > 0 || expiredItems.length > 0 || cancelledItems.length > 0) && (
            <div style={{ marginTop: '60px' }}>
              <h3 style={{ marginBottom: '25px', color: '#1e293b', fontSize: '20px', fontWeight: '600', marginTop: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>📋</span>
                Otras solicitudes
              </h3>

              {/* OFRECIDAS (Esperando respuesta) */}
              {offeredItems.length > 0 && (
                <div style={{ marginBottom: '50px' }}>
                  <h4 style={{ color: '#f59e0b', fontSize: '16px', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⏳</span> Cita ofrecida (esperando respuesta)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                    {offeredItems.map(item => renderWaitingListItem(item, '#fef3c7', '#f59e0b', '⏳ Ofrecida'))}
                  </div>
                </div>
              )}

              {/* ACEPTADAS */}
              {acceptedItems.length > 0 && (
                <div style={{ marginBottom: '50px' }}>
                  <h4 style={{ color: '#10b981', fontSize: '16px', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✓</span> Citas aceptadas
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                    {acceptedItems.map(item => renderWaitingListItem(item, '#dcfce7', '#10b981', '✓ Aceptada'))}
                  </div>
                </div>
              )}

              {/* RECHAZADAS */}
              {rejectedItems.length > 0 && (
                <div style={{ marginBottom: '50px' }}>
                  <h4 style={{ color: '#ef4444', fontSize: '16px', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✗</span> Citas rechazadas
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                    {rejectedItems.map(item => renderWaitingListItem(item, '#fee2e2', '#ef4444', '✗ Rechazada'))}
                  </div>
                </div>
              )}

              {/* EXPIRADAS */}
              {expiredItems.length > 0 && (
                <div style={{ marginBottom: '50px' }}>
                  <h4 style={{ color: '#94a3b8', fontSize: '16px', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⏱️</span> Solicitudes expiradas
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                    {expiredItems.map(item => renderWaitingListItem(item, '#f1f5f9', '#64748b', '⏱️ Expirada'))}
                  </div>
                </div>
              )}

              {/* CANCELADAS */}
              {cancelledItems.length > 0 && (
                <div style={{ marginBottom: '50px' }}>
                  <h4 style={{ color: '#6b7280', fontSize: '16px', fontWeight: '600', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🚫</span> Solicitudes canceladas
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                    {cancelledItems.map(item => renderWaitingListItem(item, '#f3f4f6', '#6b7280', '🚫 Cancelada'))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WaitingList;