import React, { useState, useEffect } from 'react';
import DoctorStats from './DoctorStats';
import AppointmentTable from './AppointmentTable';

const API_URL = process.env.REACT_APP_API_URL;

function Agenda({ authHeader, doctorId }) {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ pending: 0, confirmed: 0 });
  const [loading, setLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [blockReason, setBlockReason] = useState("");

  const [workShift, setWorkShift] = useState(null);

  useEffect(() => {
    if (doctorId) {
      fetchAppointments();
      fetchStats();
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId, authHeader]);

  const fetchProfile = () => {
    console.log('Agenda fetchProfile doctorId', doctorId);
    fetch(`${API_URL}/api/doctors/${doctorId}`, {
      headers: { 'Authorization': authHeader }
    })
      .then(res => {
        console.log('agenda profile status', res.status);
        if (!res.ok) {
          throw new Error('Profile lookup failed ' + res.status);
        }
        return res.json();
      })
      .then(d => {
        console.log('agenda profile data', d);
        setWorkShift(d.workShift);
      })
      .catch(err => console.error('Error fetching profile', err));
  };

  const fetchAppointments = () => {
    setLoading(true);
    fetch(`${API_URL}/api/appointments/doctor/${doctorId}`, {
      headers: { 'Authorization': authHeader }
    })
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
        setAppointments(sorted);
        // derive stats locally in case backend endpoint returns wrong
        const offeredCount = sorted.filter(app => app.status === 'OFFERED').length;
        const confirmedCount = sorted.filter(app => app.status === 'ASSIGNED' || app.status === 'CONFIRMED').length;
        setStats({ pending: offeredCount, confirmed: confirmedCount });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const fetchStats = () => {
    fetch(`${API_URL}/api/appointments/doctor/${doctorId}/stats`, {
      headers: { 'Authorization': authHeader }
    })
      .then(res => res.ok ? res.json() : {})
      .then(data => {
        console.log('stats endpoint returned', data);
        setStats(data);
      })
      .catch(err => console.error('Error fetching stats', err));
  };

  const handleAttend = (id) => {
    fetch(`${API_URL}/api/appointments/${id}/confirm`, {
      method: 'PUT', headers: { 'Authorization': authHeader }
    }).then(res => { if (res.ok) { fetchAppointments(); fetchStats(); } });
  };



  const confirmBlock = () => {
    fetch(`${API_URL}/api/appointments/${selectedAppId}/block`, {
      method: 'POST', headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: blockReason })
    }).then(res => {
      if (res.ok) {
        setShowBlockModal(false);
        setBlockReason("");
        fetchAppointments();
        fetchStats();
      }
    });
  };

  const now = new Date();

  // Prioridad de estados para deduplicar: menor número = más prioritario
  const STATUS_PRIORITY = { ASSIGNED: 1, OFFERED: 2, REASSIGNED: 3, COMPLETED: 4, AVAILABLE: 5 };

  // 1. CITAS ACTIVAS: No pasadas y que no estén canceladas/rechazadas/bloqueadas
  const agendaCitas = (() => {
    const filtered = appointments.filter(app => {
      const isPast = new Date(app.startTime) < now;
      return !isPast && app.status !== 'REJECTED' && app.status !== 'CANCELLED' && app.status !== 'BLOCKED';
    });
    const activeTimes = new Set(
      filtered.filter(a => a.status !== 'AVAILABLE').map(a => String(a.startTime))
    );
    const preFiltered = filtered.filter(a => a.status !== 'AVAILABLE' || !activeTimes.has(String(a.startTime)));
    const toMinuteKey = t => String(t).slice(0, 16);
    const byTime = {};
    for (const app of preFiltered) {
      const key = toMinuteKey(app.startTime);
      const curr = byTime[key];
      const appPriority = STATUS_PRIORITY[app.status] ?? 99;
      const currPriority = curr ? (STATUS_PRIORITY[curr.status] ?? 99) : Infinity;
      if (appPriority < currPriority) byTime[key] = app;
    }
    return Object.values(byTime).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  })();

  // 2. BLOQUEOS ACTIVOS
  const bloqueos = appointments.filter(app => {
    const isPast = new Date(app.startTime) < now;
    return !isPast && app.status === 'BLOCKED';
  });

  // 3. CITAS CANCELADAS O RECHAZADAS (Tu nueva lista)
  const citasCanceladas = appointments.filter(app => {
    return app.status === 'REJECTED' || app.status === 'CANCELLED';
  });

  return (
    <div style={{ padding: '20px' }}>
      <DoctorStats stats={stats} workShift={workShift} />
      <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0 }}>📅 Agenda Actual</h3>
          <button onClick={fetchAppointments} style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#475569' }}>🔄 Actualizar</button>
        </div>
        {loading ? <p style={{textAlign:'center'}}>Cargando...</p> : <AppointmentTable data={agendaCitas} showActions={true} onConfirm={handleAttend} onBlock={(id)=>{ setSelectedAppId(id); setShowBlockModal(true); }} />}
      </div>

      {bloqueos.length > 0 && (
        <div style={{ 
          marginTop: '40px',
          backgroundColor: '#fefce8', 
          padding: '24px', 
          borderRadius: '16px', 
          border: '2px solid #eab308',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            marginBottom: '20px',
            borderBottom: '2px solid #facc15',
            paddingBottom: '10px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>🔒</span>
            <h3 style={{ margin: 0, color: '#854d0e', fontSize: '1.1rem', fontWeight: '600' }}>
              Horarios Bloqueados
            </h3>
            <span style={{ 
              backgroundColor: '#fef3c3', 
              color: '#854d0e', 
              padding: '2px 8px', 
              borderRadius: '12px', 
              fontSize: '0.75rem',
              fontWeight: 'bold',
              marginLeft: 'auto'
            }}>
              {bloqueos.length}
            </span>
          </div>
          <AppointmentTable 
            data={bloqueos} 
            showActions={false}
          />
        </div>
      )}

      {citasCanceladas.length > 0 && (
        <div style={{ 
          marginTop: '40px', // Separación clara de la agenda activa
          backgroundColor: '#ffffff', 
          padding: '24px', 
          borderRadius: '16px', 
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          opacity: 0.8 // Un poco más tenue para indicar que es secundario
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            marginBottom: '20px',
            borderBottom: '2px solid #f1f5f9',
            paddingBottom: '10px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>🚫</span>
            <h3 style={{ margin: 0, color: '#64748b', fontSize: '1.1rem', fontWeight: '600' }}>
              Historial de Citas Anuladas
            </h3>
            <span style={{ 
              backgroundColor: '#fee2e2', 
              color: '#b91c1c', 
              padding: '2px 8px', 
              borderRadius: '12px', 
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {citasCanceladas.length}
            </span>
          </div>

          <div style={{ filter: 'grayscale(0.5)' }}> {/* Toque sutil para "enfriar" visualmente la tabla */}
            <AppointmentTable 
              data={citasCanceladas} 
              showActions={false} 
            />
          </div>
        </div>
      )}

      {showBlockModal && (
        <div style={{ position: 'fixed', top:0,left:0,width:'100%',height:'100%',backgroundColor:'rgba(15,23,42,0.75)',display:'flex',justifyContent:'center',alignItems:'center',zIndex:1000 }}>
          <div style={{ backgroundColor:'white', padding:'32px', borderRadius:'16px', width:'400px' }}>
            <h3 style={{ marginTop:0 }}>🚫 Bloquear Horario</h3>
            <textarea style={{ width:'100%', minHeight:'100px', padding:'12px', borderRadius:'8px', border:'1px solid #e2e8f0', marginBottom:'16px' }} value={blockReason} onChange={(e)=>setBlockReason(e.target.value)} placeholder="Motivo..." />
            <div style={{ display:'flex', justifyContent:'flex-end', gap:'12px' }}>
              <button onClick={()=>setShowBlockModal(false)} style={{ padding:'10px 20px', backgroundColor:'#f1f5f9',border:'none',borderRadius:'8px',cursor:'pointer' }}>Cancelar</button>
              <button onClick={confirmBlock} style={{ padding:'10px 20px', backgroundColor:'#1e293b',color:'white',border:'none',borderRadius:'8px',cursor:'pointer' }}>Bloquear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Agenda;