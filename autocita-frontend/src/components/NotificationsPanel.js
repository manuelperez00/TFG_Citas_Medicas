import React, { useState, useEffect } from 'react';
import { useModal } from './AppModal';
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
    <div style={{ fontSize: '0.7rem', color: expired || urgent ? '#ef4444' : '#d97706', fontWeight: 'bold', marginBottom: '6px' }}>
      ⏱️ {expired ? 'Oferta expirada' : `Tiempo restante: ${mins}:${String(secs).padStart(2, '0')}`}
    </div>
  );
}

const API_URL = process.env.REACT_APP_API_URL;

const isExpired = (offeredAt) =>
  offeredAt && Date.now() > new Date(offeredAt).getTime() + 15 * 60 * 1000;

function NotificationsPanel({ offers, onRefresh, close, authHeader }) {
  const { showAlert } = useModal();

  const handleAction = async (id, accepted, offeredAt) => {
    if (isExpired(offeredAt)) {
      showAlert('⏱️ Esta oferta ha expirado. Ya no es posible aceptarla ni rechazarla.');
      onRefresh();
      if (offers.length === 1) close();
      return;
    }
    try {
      console.log(`📤 Enviando respuesta: Cita ID ${id}, Aceptada: ${accepted}`);
      
      const res = await fetch(`${API_URL}/api/appointments/${id}/respond-offer?accepted=${accepted}`, {
        method: 'POST',
        headers: { 'Authorization': authHeader }
      });
      
      if (res.ok) {
        console.log(`✅ Respuesta procesada exitosamente`);
        onRefresh(); // Refresca App.js
        if (offers.length === 1) close(); // Cierra si era la última
      } else {
        const errorText = await res.text();
        console.error(`❌ Error en la respuesta: ${res.status} - ${errorText}`);
        showAlert(`❌ Error al procesar tu respuesta: ${errorText}`);
      }
    } catch (err) {
      console.error("❌ Error de conexión al responder oferta:", err);
      showAlert("❌ Error de conexión. Por favor, intenta de nuevo.");
    }
  };

  return (
    <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
      <div style={headerStyle}>
        <span style={{ fontWeight: '700' }}>Notificaciones</span>
        <button onClick={close} style={closeBtn}>✕</button>
      </div>
      <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
        {offers.length === 0 ? (
          <div style={emptyStyle}>No tienes avisos pendientes</div>
        ) : (
          offers.map(offer => (
            <div key={offer.id} style={itemStyle}>
              <div style={{ fontSize: '0.85rem', marginBottom: '8px' }}>
                🔔 <strong>¡Hueco disponible!</strong> en {translateSpecialty(offer.doctor.specialty)}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '6px' }}>
                Con el Dr. {offer.doctor.lastName} <br/>
                {new Date(offer.startTime).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
              </div>
              <OfferCountdown offeredAt={offer.offeredAt} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleAction(offer.id, true, offer.offeredAt)} style={btnAccept}>✓ Aceptar</button>
                <button onClick={() => handleAction(offer.id, false, offer.offeredAt)} style={btnReject}>✕ Rechazar</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const panelStyle = {
  position: 'absolute', top: '45px', right: '0', width: '300px', 
  backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 1100, overflow: 'hidden'
};
const headerStyle = { padding: '12px 15px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' };
const emptyStyle = { padding: '30px 15px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' };
const itemStyle = { padding: '15px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#fffbeb' };
const closeBtn = { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' };
const btnAccept = { flex: 1, padding: '6px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' };
const btnReject = { flex: 1, padding: '6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' };

export default NotificationsPanel;