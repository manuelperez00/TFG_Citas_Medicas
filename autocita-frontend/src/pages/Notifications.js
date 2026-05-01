import React, { useState, useEffect } from 'react';

function Notifications({ authHeader, patientId, onRefresh }) {
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    if (patientId) {
      fetchOffers();
      // Actualizar ofertas cada 10 segundos para detectar nuevas reasignaciones
      const interval = setInterval(fetchOffers, 10000);
      return () => clearInterval(interval);
    }
  }, [patientId, authHeader]);

  const fetchOffers = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/appointments/patient/${patientId}`, {
        headers: { 'Authorization': authHeader }
      });
      const data = await res.json();
      // Filtramos solo las que están esperando respuesta
      const pending = data.filter(app => app.status === 'OFFERED');
      setOffers(pending);
    } catch (err) {
      console.error("Error al cargar ofertas:", err);
    }
  };

  const handleResponse = async (appointmentId, accepted) => {
      try {
        console.log(`📤 Respondiendo oferta ${appointmentId}: ${accepted ? 'Aceptar' : 'Rechazar'}`);
        
        const response = await fetch(`http://localhost:8080/api/appointments/${appointmentId}/respond-offer?accepted=${accepted}`, {
          method: 'POST',
          headers: { 'Authorization': authHeader }
        });

        if (response.ok) {
          console.log(`✅ Respuesta procesada exitosamente`);
          setOffers(prev => prev.filter(o => o.id !== appointmentId));
          alert(accepted ? "✅ ¡Cita confirmada!" : "❌ Oferta rechazada - Se ofrecerá a otro paciente");
          if (onRefresh) onRefresh();
        } else {
          const errorText = await response.text();
          console.error(`❌ Error: ${response.status} - ${errorText}`);
          setOffers(prev => prev.filter(o => o.id !== appointmentId));
          alert("Lo sentimos, esta oferta ya no está disponible.");
          if (onRefresh) onRefresh();
        }
      } catch (err) {
        console.error("Error de red:", err);
        alert("Error de conexión. Por favor, intenta de nuevo.");
      }
  };

  if (offers.length === 0) return null;

  return (
    <div style={containerStyle}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', color: '#854d0e' }}>
        ✨ ¡Tienes una oportunidad de adelantar tu cita!
      </h3>
      {offers.map(offer => (
        <div key={offer.id} className="glass-card" style={offerCardStyle}>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{offer.doctor.specialty.replace('_', ' ')}</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#71717a' }}>
              {new Date(offer.startTime).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>Dr. {offer.doctor.lastName}</p>
            
            {/* AQUÍ VA EL AVISO DE TIEMPO */}
            <p style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 'bold', marginTop: '5px', marginBottom: 0 }}>
              ⏱️ Tienes 15 minutos para responder
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => handleResponse(offer.id, true)} 
              style={btnAcceptStyle}>✓ Aceptar</button>
            <button 
              onClick={() => handleResponse(offer.id, false)} 
              style={btnRejectStyle}>✕ Rechazar</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const containerStyle = {
  backgroundColor: '#fefce8',
  border: '1px solid #fef08a',
  borderRadius: '16px',
  padding: '20px',
  marginBottom: '25px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
};

const offerCardStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: 'white',
  padding: '15px',
  margin: '10px 0',
  borderLeft: '4px solid #eab308'
};

const btnAcceptStyle = { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const btnRejectStyle = { backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };

export default Notifications;