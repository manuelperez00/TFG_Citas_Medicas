import React from 'react';
import { translateStatus, isExpiredAvailable } from '../../utils/statusTranslations';

const getStatusColor = (status, expired = false) => {
  if (expired) return '#94a3b8';
  switch(status) {
    case 'AVAILABLE':  return '#22c55e'; // verde   – libre
    case 'OFFERED':    return '#f59e0b'; // ámbar   – pendiente de confirmar
    case 'ASSIGNED':   return '#3b82f6'; // azul    – paciente asignado
    case 'CONFIRMED':  return '#7c3aed'; // morado  – cita confirmada
    case 'BLOCKED':    return '#ea580c'; // naranja – horario bloqueado
    case 'CANCELLED': case 'REJECTED': return '#ef4444'; // rojo
    default: return '#94a3b8';
  }
};

function AppointmentTable({ data, showActions, onConfirm, onBlock, onRowClick }) {
  const now = new Date();
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '16px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>HORA</th>
            <th style={{ textAlign: 'left', padding: '16px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>PACIENTE</th>
            <th style={{ textAlign: 'left', padding: '16px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' }}>ESTADO</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? data.map(app => (
            <tr
              key={app.id}
              style={{ borderBottom: '1px solid #f1f5f9', cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.15s' }}
              onClick={() => onRowClick && onRowClick(app)}
              onMouseEnter={e => { if (onRowClick) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
              onMouseLeave={e => { if (onRowClick) e.currentTarget.style.backgroundColor = ''; }}
              title={onRowClick ? 'Ver detalle de la cita' : ''}
            >
              <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                <div style={{ fontWeight: '700', color: '#1e293b' }}>{new Date(app.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{new Date(app.startTime).toLocaleDateString()}</div>
              </td>
              <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                {app.status === 'BLOCKED' ? (
                  <span style={{ color: '#64748b', fontStyle: 'italic' }}>🚫 Bloqueado: {app.notes || "Sin motivo"}</span>
                ) : app.patient ? (
                  <div style={{ fontWeight: '600', color: '#334155' }}>{app.patient.firstName} {app.patient.lastName}</div>
                ) : (
                  isExpiredAvailable(app)
                    ? <span style={{ color: '#94a3b8', fontWeight: '600' }}>⚪ Sin asignar</span>
                    : <span style={{ color: '#10b981', fontWeight: '600' }}>🟢 Disponible</span>
                )}
              </td>
              <td style={{ padding: '16px', verticalAlign: 'middle' }}>
                <span style={{ padding: '4px 12px', borderRadius: '12px', color: 'white', fontSize: '0.7rem', fontWeight: '700', backgroundColor: getStatusColor(app.status, isExpiredAvailable(app)) }}>{isExpiredAvailable(app) ? 'Expirada' : translateStatus(app.status)}</span>
              </td>
            </tr>
          )) : (
            <tr><td colSpan="3" style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>No hay registros disponibles.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AppointmentTable;
