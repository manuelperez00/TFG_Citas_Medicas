import React from 'react';

function DoctorStats({ stats, workShift }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' }}>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', backgroundColor: '#fef3c7', color: '#d97706' }}>⏳</div>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{stats.pending ?? 0}</h4>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Por Confirmar</p>
        </div>
      </div>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', backgroundColor: '#dcfce7', color: '#16a34a' }}>✅</div>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{stats.confirmed ?? 0}</h4>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Confirmadas</p>
        </div>
      </div>
      <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', backgroundColor: '#e0f2fe', color: '#0284c7' }}>☀️</div>
        <div>
          <h4 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>{workShift}</h4>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Turno</p>
        </div>
      </div>
    </div>
  );
}

export default DoctorStats;
