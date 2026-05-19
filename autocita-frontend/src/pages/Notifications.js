import React, { useState, useEffect } from 'react';
import { useModal } from '../components/AppModal';
import { translateSpecialty } from '../utils/specialtyTranslations';

function OfferCountdown({ offeredAt }) {
  const calcLeft = (at) => {
    if (!at) return 15 * 60;
    return Math.max(0, Math.floor((new Date(at).getTime() + 15 * 60 * 1000 - Date.now()) / 1000));
  };

  const [secondsLeft, setSecondsLeft] = useState(() => calcLeft(offeredAt));

  useEffect(() => {
    setSecondsLeft(calcLeft(offeredAt));
    const id = setInterval(() => setSecondsLeft(calcLeft(offeredAt)), 1000);
    return () => clearInterval(id);
  }, [offeredAt]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const expired = secondsLeft <= 0;
  const urgent = secondsLeft < 60;

  return (
    <p style={{ fontSize: '0.75rem', color: expired || urgent ? '#ef4444' : '#d97706', fontWeight: 'bold', marginTop: '5px', marginBottom: 0 }}>
      ⏱️ {expired ? 'Oferta expirada' : `Tiempo restante: ${mins}:${String(secs).padStart(2, '0')}`}
    </p>
  );
}

const API_URL = process.env.REACT_APP_API_URL;

const isExpired = (offeredAt) =>
  offeredAt && Date.now() > new Date(offeredAt).getTime() + 15 * 60 * 1000;

function Notifications({ authHeader, patientId, onRefresh }) {
  const { showAlert } = useModal();
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
      const res = await fetch(`${API_URL}/api/appointments/patient/${patientId}`, {
        headers: { 'Authorization': authHeader }
      });
      const data = await res.json();
      const now = Date.now();
      const pending = data.filter(app =>
        app.status === 'OFFERED' &&
        app.offeredAt &&
        (new Date(app.offeredAt).getTime() + 15 * 60 * 1000) > now
      );
      setOffers(pending);
    } catch (err) {
      console.error("Error al cargar ofertas:", err);
    }
  };

  const handleResponse = async (appointmentId, accepted, offeredAt) => {
      if (isExpired(offeredAt)) {
        showAlert('⏱️ Esta oferta ha expirado. Ya no es posible aceptarla ni rechazarla.');
        setOffers(prev => prev.filter(o => o.id !== appointmentId));
        if (onRefresh) onRefresh();
        return;
      }
      try {
        console.log(`📤 Respondiendo oferta ${appointmentId}: ${accepted ? 'Aceptar' : 'Rechazar'}`);
        
        const response = await fetch(`${API_URL}/api/appointments/${appointmentId}/respond-offer?accepted=${accepted}`, {
          method: 'POST',
          headers: { 'Authorization': authHeader }
        });

        if (response.ok) {
          console.log(`✅ Respuesta procesada exitosamente`);
          setOffers(prev => prev.filter(o => o.id !== appointmentId));
          showAlert(accepted ? "✅ ¡Cita confirmada!" : "✅ Oferta rechazada correctamente");
          if (onRefresh) onRefresh();
        } else {
          const errorText = await response.text();
          console.error(`❌ Error: ${response.status} - ${errorText}`);
          setOffers(prev => prev.filter(o => o.id !== appointmentId));
          showAlert("⚠️ Lo sentimos, esta oferta ya no está disponible.");
          if (onRefresh) onRefresh();
        }
      } catch (err) {
        console.error("Error de red:", err);
        showAlert("❌ Error de conexión. Por favor, intenta de nuevo.");
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
          <div style={{ textAlign: 'left' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>{translateSpecialty(offer.doctor.specialty)}</p>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#71717a' }}>
              {new Date(offer.startTime).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
            </p>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>Dr. {offer.doctor.lastName}</p>
            
            <OfferCountdown offeredAt={offer.offeredAt} />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => handleResponse(offer.id, true, offer.offeredAt)}
              style={btnAcceptStyle}>✓ Aceptar</button>
            <button
              onClick={() => handleResponse(offer.id, false, offer.offeredAt)}
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