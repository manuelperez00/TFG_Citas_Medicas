import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DoctorStats from './DoctorStats';
import AppointmentTable from './AppointmentTable';
import DoctorProfile from './DoctorProfile';
import DoctorReassignmentStats from './DoctorReassignmentStats';
import AppointmentDetailModal from '../../components/AppointmentDetailModal';
import History from './History';
import { useModal } from '../../components/AppModal';

const API_URL = process.env.REACT_APP_API_URL;

function DoctorDashboard({ authHeader, doctorId, onLogout }) {
  const { showAlert, showConfirm } = useModal();
  const [appointments, setAppointments] = useState([]);
  const [doctorData, setDoctorData] = useState(null);
  const [stats, setStats] = useState({ pending: 0, confirmed: 0 }); // nuevos datos
  const [activeTab, setActiveTab] = useState('agenda'); // agenda, bloqueos, historial, perfil, estadisticas
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockMode, setBlockMode] = useState('hour'); // hour or day
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split('T')[0]);
  const [blockTime, setBlockTime] = useState('09:00');
  const [blockShift, setBlockShift] = useState('MORNING'); // MORNING, AFTERNOON, ANY
  const [blockedAppointments, setBlockedAppointments] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' o 'desc' para ordenamiento de agenda
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [blockGridDate, setBlockGridDate] = useState(null); // inicializar en useEffect
  const [selectedHoursToBlock, setSelectedHoursToBlock] = useState([]); // array de horas seleccionadas

  // Calcular fecha mínima (24 horas desde ahora)
  const getMinimumBlockDate = () => {
    const now = new Date();
    const minimum24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return minimum24h.toISOString().split('T')[0];
  };

  // Inicializar blockGridDate con la fecha mínima permitida
  useEffect(() => {
    setBlockGridDate(getMinimumBlockDate());
  }, []);

  useEffect(() => {
    if (doctorId) {
      fetch(`${API_URL}/api/doctors/${doctorId}`, {
        headers: { 'Authorization': authHeader }
      })
      .then(res => res.json())
      .then(data => setDoctorData(data));

      fetchAppointments();
      fetchStats();
      fetchBlocked();
    }
  }, [doctorId, authHeader]);

  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/bloqueos')) setActiveTab('bloqueos');
    else if (path.includes('/historial')) setActiveTab('historial');
    else if (path.includes('/perfil')) setActiveTab('perfil');
    else if (path.includes('/estadisticas')) setActiveTab('estadisticas');
    else setActiveTab('agenda');
  }, [location.pathname]);

  const fetchAppointments = () => {
    setLoading(true);
    fetch(`${API_URL}/api/appointments/doctor/${doctorId}`, {
      headers: { 'Authorization': authHeader }
    })
    .then(res => res.json())
    .then(data => {
      // Ordenamos por fecha: los más recientes arriba
      const sorted = data.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
      setAppointments(sorted);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const fetchStats = () => {
    console.log('Requesting stats for doctor', doctorId);
    fetch(`${API_URL}/api/appointments/doctor/${doctorId}/stats`, {
      headers: { 'Authorization': authHeader }
    })
    .then(res => {
      if (!res.ok) {
        console.error('Stats request failed', res.status);
        return {}; // avoid crash
      }
      return res.json();
    })
    .then(data => {
      console.log('Stats received', data);
      setStats(data);
    })
    .catch(err => console.error('Error fetching stats', err));
  };

  const fetchBlocked = () => {
    console.log('🔍 fetchBlocked: Solicitando lista de bloques del doctor', doctorId);
    fetch(`${API_URL}/api/appointments/doctor/${doctorId}`, {
      headers: { 'Authorization': authHeader }
    })
    .then(res => {
      console.log(`📥 fetchBlocked respuesta: Status ${res.status}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res.json();
    })
    .then(data => {
      console.log(`✅ fetchBlocked datos recibidos:`, data);
      const blocked = data.filter(app => app.status === 'BLOCKED');
      // Ordenar por fecha/hora más cercana primero
      blocked.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      console.log(`🔒 Bloques encontrados:`, blocked.length);
      blocked.forEach((b, idx) => {
        console.log(`   Bloqueo ${idx + 1}: ${b.startTime} - Motivo: "${b.notes}"`);
      });
      setBlockedAppointments(blocked);
    })
    .catch(err => {
      console.error('❌ Error fetching blocked:', err);
      showAlert('⚠️ Error al cargar bloques: ' + err.message);
    });
  };

  // --- LÓGICA DE FILTRADO PARA LAS TABLAS ---
  const now = new Date();

  const agendaCitas = appointments.filter(app => {
    const isPast = new Date(app.startTime) < now;
    // En agenda solo lo que NO ha pasado
    return !isPast && app.status !== 'REJECTED' && app.status !== 'CANCELLED';
  }).sort((a, b) => {
    // Ordenar por hora más próxima o más lejana
    const timeA = new Date(a.startTime).getTime();
    const timeB = new Date(b.startTime).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  const handleAttend = (appointmentId) => {
    fetch(`${API_URL}/api/appointments/${appointmentId}/confirm`, {
      method: 'PUT',
      headers: { 'Authorization': authHeader }
    }).then(res => { if (res.ok) { fetchAppointments(); fetchStats(); } });
  };

  const handleCancel = async (appointmentId) => {
    if (!await showConfirm("¿Deseas anular la cita y liberar el hueco?")) return;
    fetch(`${API_URL}/api/appointments/${appointmentId}/reject`, {
      method: 'PUT',
      headers: { 'Authorization': authHeader }
    }).then(res => { if (res.ok) { fetchAppointments(); fetchStats(); fetchBlocked(); } });
  };

  const handleProfileUpdate = async (updatedFields) => {
    try {
      const resp = await fetch('${API_URL}/api/doctors/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader },
        body: JSON.stringify(updatedFields)
      });
      if (!resp.ok) return false;
      const updated = await resp.json();
      setDoctorData(updated);
      return true;
    } catch {
      return false;
    }
  };

  const handleChangeShift = (newShift) => {
    fetch(`${API_URL}/api/doctors/${doctorId}/shift`, {
      method: 'PUT',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ workShift: newShift })
    }).then(res => {
      if (res.ok) {
        setDoctorData({ ...doctorData, workShift: newShift });
        showAlert("✅ Turno actualizado correctamente");
      }
    });
  };

  // 🔧 Obtener estado de cada hora para el grid de bloqueos
  const getHourStatusForBlock = (date, hour) => {
    const now = new Date();
    const minimum24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Helper para crear fecha local
    const createLocalDate = (dateStr, timeStr) => {
      const [year, month, day] = dateStr.split('-');
      const [h, m] = timeStr.split(':');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(h), parseInt(m), 0);
    };

    const checkTime = createLocalDate(date, hour);

    // Si está en el pasado
    if (new Date(date) < new Date(now.toISOString().split('T')[0])) {
      return 'PAST';
    }

    // Si está dentro de 24 horas - La hora DEBE estar COMPLETAMENTE después de las 24h
    // Esto significa el INICIO debe ser estrictamente MAYOR a minimum24h (no igual)
    if (checkTime <= minimum24h) {
      return 'WITHIN_24H';
    }

    // Buscar si hay cita asignada/ofrecida en esa hora
    const slotDateTime = `${date}T${hour}`;
    const existingApp = appointments.find(a => a.startTime.startsWith(slotDateTime));
    
    if (existingApp) {
      // Si está bloqueada (por el doctor), devolveremos estado específico BLOCKED_SLOT
      if (existingApp.status === 'BLOCKED') {
        return 'BLOCKED_SLOT';
      }
      // Si está asignada, ofrecida o reasignada, está OCUPADA
      if (['ASSIGNED', 'REASSIGNED', 'OFFERED'].includes(existingApp.status)) {
        return 'OCCUPIED';
      }
    }

    // Si pasó todas las restricciones, está disponible
    return 'AVAILABLE';
  };

  // 🔧 Obtener turnos disponibles según el turno del médico
  const getAvailableShifts = () => {
    if (!doctorData) return [];
    const shift = doctorData.workShift;
    
    if (shift === 'MORNING') return ['MORNING'];
    if (shift === 'AFTERNOON') return ['AFTERNOON'];
    if (shift === 'ANY') return ['MORNING', 'AFTERNOON'];
    return [];
  };

  // 🔧 Obtener horas disponibles según el turno seleccionado (mostrar todas pero marcar las inválidas)
  const getAvailableHours = (shift) => {
    const hours = [];
    const now = new Date();
    const minimum24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Helper para crear fecha local
    const createLocalDate = (dateStr, timeStr) => {
      const [year, month, day] = dateStr.split('-');
      const [h, m] = timeStr.split(':');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(h), parseInt(m), 0);
    };
    
    if (shift === 'MORNING') {
      // 09:00 - 13:00 (5 horas)
      for (let h = 9; h <= 13; h++) {
        const hourStr = `${h.toString().padStart(2, '0')}:00`;
        hours.push(hourStr);
      }
    } else if (shift === 'AFTERNOON') {
      // 16:00 - 20:00 (5 horas)
      for (let h = 16; h <= 20; h++) {
        const hourStr = `${h.toString().padStart(2, '0')}:00`;
        hours.push(hourStr);
      }
    }
    
    return hours;
  };

  // 🔧 Verificar si un turno está DENTRO de las próximas 24 horas (deshabilitado)
  const isShiftPassed = (shift) => {
    const now = new Date();
    const minimum24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const selectedDateStr = blockDate;
    
    // Construir fecha local correctamente
    const createLocalDate = (dateStr, timeStr) => {
      const [year, month, day] = dateStr.split('-');
      const [hours, minutes] = timeStr.split(':');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0);
    };
    
    let checkTime;
    if (shift === 'MORNING') {
      checkTime = createLocalDate(selectedDateStr, '13:00'); // Última hora de la mañana
    } else if (shift === 'AFTERNOON') {
      checkTime = createLocalDate(selectedDateStr, '20:00'); // Última hora de la tarde
    }
    
    // Retorna true (deshabilitado) si ESTÁ dentro de las próximas 24 horas
    return checkTime < minimum24h;
  };

  // 🔧 Verificar si una hora específica está DENTRO de las próximas 24 horas (deshabilitada)
  const isHourPassed = (hour) => {
    const now = new Date();
    const minimum24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const selectedDateStr = blockDate;
    
    // Construir fecha local correctamente
    const createLocalDate = (dateStr, timeStr) => {
      const [year, month, day] = dateStr.split('-');
      const [hours, minutes] = timeStr.split(':');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0);
    };
    
    const checkTime = createLocalDate(selectedDateStr, hour);
    
    // Retorna true (deshabilitado) si ESTÁ dentro de las próximas 24 horas
    return checkTime < minimum24h;
  };

  // 🔧 Inicializar el turno del bloqueo basado en el turno del médico
  const initializeBlockShift = () => {
    if (!doctorData) return;
    const availableShifts = getAvailableShifts();
    if (availableShifts.length > 0) {
      setBlockShift(availableShifts[0]);
      const hours = getAvailableHours(availableShifts[0]);
      if (hours.length > 0) {
        setBlockTime(hours[0]);
      }
    }
  };

  // Inicializar cuando cambie doctorData
  useEffect(() => {
    initializeBlockShift();
  }, [doctorData]);

  const confirmBlock = () => {
    const now = new Date();
    const minimum24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    let validationError = null;
    let blocksToCreate = []; // Para manejar múltiples bloques

    // Helper function para crear fecha local correctamente
    const createLocalDate = (dateStr, timeStr = null) => {
      const [year, month, day] = dateStr.split('-');
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), 0);
      } else {
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0);
      }
    };

    if (blockMode === 'day') {
      // Si bloquea el día, bloquear el turno correspondiente
      if (blockShift === 'MORNING') {
        const startTime = createLocalDate(blockDate, '09:00');
        const endTime = createLocalDate(blockDate, '14:00');
        
        if (startTime >= minimum24h) {
          blocksToCreate.push({ startTime, endTime });
        } else {
          validationError = '❌ El bloqueo debe ser de mínimo 24 horas desde ahora.';
        }
      } else if (blockShift === 'AFTERNOON') {
        const startTime = createLocalDate(blockDate, '16:00');
        const endTime = createLocalDate(blockDate, '21:00');
        
        if (startTime >= minimum24h) {
          blocksToCreate.push({ startTime, endTime });
        } else {
          validationError = '❌ El bloqueo debe ser de mínimo 24 horas desde ahora.';
        }
      } else if (blockShift === 'BOTH') {
        // Bloquear ambos turnos
        const morningStart = createLocalDate(blockDate, '09:00');
        const morningEnd = createLocalDate(blockDate, '14:00');
        const afternoonStart = createLocalDate(blockDate, '16:00');
        const afternoonEnd = createLocalDate(blockDate, '21:00');
        
        if (morningStart >= minimum24h) {
          blocksToCreate.push({ startTime: morningStart, endTime: morningEnd });
        }
        if (afternoonStart >= minimum24h) {
          blocksToCreate.push({ startTime: afternoonStart, endTime: afternoonEnd });
        }
        
        if (blocksToCreate.length === 0) {
          validationError = '❌ El bloqueo debe ser de mínimo 24 horas desde ahora.';
        }
      }
    } else {
      // Si bloquea 1 hora
      const startTime = createLocalDate(blockDate, blockTime);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hora
      
      if (startTime >= minimum24h) {
        blocksToCreate.push({ startTime, endTime });
      } else {
        validationError = '❌ El bloqueo debe ser de mínimo 24 horas desde ahora.';
      }
    }

    // Mostrar error si hay alguno
    if (validationError) {
      showAlert(validationError);
      return;
    }

    // Validar que haya bloques para crear
    if (blocksToCreate.length === 0) {
      showAlert('❌ No hay bloques válidos para crear.');
      return;
    }

    // Crear los bloques (posiblemente múltiples si es BOTH)
    let completedBlocks = 0;
    const totalBlocks = blocksToCreate.length;

    blocksToCreate.forEach((block) => {
      fetch(`${API_URL}/api/appointments/doctor/${doctorId}/block`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime: block.startTime.toISOString(), endTime: block.endTime.toISOString(), reason: blockReason })
      }).then(async res => {
        if (res.ok) {
          completedBlocks++;
          if (completedBlocks === totalBlocks) {
            // Todos los bloques creados exitosamente
            setShowBlockModal(false);
            setBlockReason("");
            setSelectedAppId(null);
            showAlert("✅ Bloqueo" + (totalBlocks > 1 ? "s" : "") + " creado exitosamente");
            fetchAppointments();
            fetchStats();
            fetchBlocked();
          }
        } else {
          const text = await res.text();
          // Mostrar el mensaje del backend de forma más legible
          showAlert('⚠️ No se puede crear el bloqueo:\n\n' + text);
        }
      });
    });
  };

  // 🔧 Crear bloques basado en horas seleccionadas del grid visual
  const createBlocksFromSelection = () => {
    if (selectedHoursToBlock.length === 0) {
      showAlert("❌ Selecciona al menos una hora para bloquear.");
      return;
    }

    const now = new Date();
    const minimum24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Helper para crear fecha local SIN convertir a ISO
    const createLocalDateTimeString = (dateStr, timeStr) => {
      // dateStr formato: "2026-04-09"
      // timeStr formato: "09:00"
      // Devolvemos: "2026-04-09T09:00:00"
      return `${dateStr}T${timeStr}:00`;
    };

    let blocksToCreate = [];

    // Validar todas las horas seleccionadas
    for (let hour of selectedHoursToBlock) {
      const status = getHourStatusForBlock(blockGridDate, hour);
      if (status === 'OCCUPIED' || status === 'WITHIN_24H' || status === 'PAST') {
        showAlert(`❌ No puedes bloquear ${hour}: ${status === 'OCCUPIED' ? 'Hay una cita asignada' : status === 'WITHIN_24H' ? 'Está dentro de las 24 horas' : 'La hora ha pasado'}`);
        return;
      }

      blocksToCreate.push({
        startTime: createLocalDateTimeString(blockGridDate, hour),
        endTime: createLocalDateTimeString(blockGridDate, `${parseInt(hour.split(':')[0]) + 1}:00`)
      });
    }

    console.log('🔒 Creando bloques:', blocksToCreate.length, 'bloques');
    console.log('   blockGridDate:', blockGridDate);
    console.log('   selectedHours:', selectedHoursToBlock);

    // Crear todos los bloques
    let completedBlocks = 0;
    const totalBlocks = blocksToCreate.length;

    blocksToCreate.forEach((block, index) => {
      const payload = { 
        startTime: block.startTime, 
        endTime: block.endTime, 
        reason: blockReason 
      };
      console.log(`📤 Enviando bloque ${index + 1}/${totalBlocks}:`, JSON.stringify(payload, null, 2));
      console.log(`   URL: POST ${API_URL}/api/appointments/doctor/${doctorId}/block`);
      console.log(`   Auth Header: ${authHeader ? 'Presente' : 'FALTA'}`);

      fetch(`${API_URL}/api/appointments/doctor/${doctorId}/block`, {
        method: 'POST',
        headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(async res => {
        const resText = await res.text();
        console.log(`📥 Respuesta bloque ${index + 1}:`);
        console.log(`   Status: ${res.status} (${res.ok ? 'OK ✅' : 'ERROR ❌'})`);
        console.log(`   Response Body: ${resText}`);
        console.log(`   Content-Type: ${res.headers.get('content-type')}`);
        
        if (res.ok) {
          completedBlocks++;
          console.log(`✅ Bloque ${index + 1} creado. Progreso: ${completedBlocks}/${totalBlocks}`);
          
          if (completedBlocks === totalBlocks) {
            // Todos los bloques creados exitosamente
            setSelectedHoursToBlock([]);
            setBlockReason("");
            showAlert(`✅ ${totalBlocks} bloqueo${totalBlocks > 1 ? 's' : ''} creado${totalBlocks > 1 ? 's' : ''} exitosamente`);
            console.log('🔄 Refrescando datos...');
            fetchAppointments();
            fetchStats();
            fetchBlocked();
          }
        } else {
          console.error(`❌ Error en bloque ${index + 1}`);
          console.error(`   Status: ${res.status}`);
          console.error(`   Response: ${resText}`);
          // Mostrar error específico al usuario incluyendo el motivo
          showAlert(`⚠️ Error al crear bloqueo (${index + 1}/${totalBlocks}):\n\nStatus: ${res.status}\n\n${resText}`);
        }
      })
      .catch(err => {
        console.error('❌ Error de fetch en bloque', index + 1);
        console.error('   Error:', err);
        console.error('   Message:', err.message);
        showAlert('❌ Error de conexión al crear bloqueo ' + (index + 1) + ':\n' + err.message);
      });
    });
  };

  // --- FUNCIÓN PARA RENDERIZAR TABLAS REUTILIZABLE ---
  const renderAppointmentsTable = (dataList, showActions) => (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>HORA</th>
            <th style={styles.th}>PACIENTE</th>
            <th style={styles.th}>ESTADO</th>
            {showActions && <th style={{...styles.th, textAlign: 'right'}}>ACCIONES</th>}
          </tr>
        </thead>
        <tbody>
          {dataList.length > 0 ? dataList.map(app => (
            <tr key={app.id} style={styles.tr}>
              <td style={styles.td}>
                <div style={styles.timeText}>{new Date(app.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                <div style={styles.dateText}>{new Date(app.startTime).toLocaleDateString()}</div>
              </td>
              <td style={styles.td}>
                {app.status === 'BLOCKED' ? (
                  <span style={styles.blockedText}>🚫 Bloqueado: {app.notes || "Sin motivo"}</span>
                ) : app.patient ? (
                  <div style={styles.patientName}>{app.patient.firstName} {app.patient.lastName}</div>
                ) : (
                  <span style={styles.availableText}>🟢 Disponible</span>
                )}
              </td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, backgroundColor: getStatusColor(app.status) }}>{app.status}</span>
              </td>
              {showActions && (
                <td style={{...styles.td, textAlign: 'right'}}>
                  <div style={styles.actionGroup}>
                    {(app.status === 'OFFERED') && (
                      <>
                        <button style={styles.btnActionConfirm} onClick={() => handleAttend(app.id)}>Confirmar</button>
                        <button style={styles.btnActionReject} onClick={() => handleCancel(app.id)}>Anular</button>
                      </>
                    )}
                    {(app.status === 'CONFIRMED' || app.status === 'ASSIGNED') && (
                      <button style={styles.btnActionReject} onClick={() => handleCancel(app.id)}>Anular</button>
                    )}
                    {app.status === 'AVAILABLE' && (
                      <button style={styles.btnActionBlock} onClick={() => { setSelectedAppId(app.id); setShowBlockModal(true); }}>Bloquear</button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          )) : (
            <tr><td colSpan="4" style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>No hay registros disponibles.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div style={styles.dashboardLayout}>
      <main style={styles.mainAreaFull}>
        <header style={styles.topHeader}>
          <div>
            <h2 style={{ margin: 0, color: '#1e293b' }}>Dr. {doctorData?.lastName}</h2>
            <p style={{ margin: 0, color: '#64748b' }}>{activeTab === 'agenda' ? 'Próximas citas' : activeTab === 'bloqueos' ? 'Control de disponibilidad' : activeTab === 'historial' ? 'Registro de actividad' : activeTab === 'estadisticas' ? 'Estadísticas de reasignación' : 'Ajustes de perfil'}</p>
          </div>
          <div style={styles.userBadge}>{doctorData?.specialty}</div>
        </header>

        {activeTab === 'agenda' && (
          <div style={styles.pageContent}>
            <DoctorStats stats={stats} workShift={doctorData?.workShift} />
            <div style={styles.contentSection}>
              <div style={styles.sectionHeader}>
                <h3 style={{ margin: 0 }}>📅 Agenda Actual</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setSortOrder('asc')}
                    style={{...styles.btnRefresh, backgroundColor: sortOrder === 'asc' ? '#3b82f6' : '#e2e8f0', color: sortOrder === 'asc' ? '#fff' : '#64748b'}}
                    title="Ordenar por más próximas"
                  >
                    ⏱ Próximas
                  </button>
                  <button 
                    onClick={() => setSortOrder('desc')}
                    style={{...styles.btnRefresh, backgroundColor: sortOrder === 'desc' ? '#3b82f6' : '#e2e8f0', color: sortOrder === 'desc' ? '#fff' : '#64748b'}}
                    title="Ordenar por más lejanas"
                  >
                    📅 Lejanas
                  </button>
                  <button onClick={fetchAppointments} style={styles.btnRefresh}>🔄 Actualizar</button>
                </div>
              </div>

              {loading ? <p style={{textAlign:'center'}}>Cargando...</p> : <AppointmentTable data={agendaCitas} showActions={true} onConfirm={handleAttend} onReject={handleCancel} onRowClick={setSelectedAppointment} />}
            </div>
          </div>
        )}

        {activeTab === 'bloqueos' && (
          <div style={styles.pageContent}>
            <div style={styles.contentSection}>
              <div style={styles.sectionHeader}>
                <h3 style={{ margin: 0 }}>⏱ Control de disponibilidad</h3>
                <button onClick={fetchBlocked} style={styles.btnRefresh}>🔄 Actualizar</button>
              </div>

              {/* SELECTOR DE FECHA Y GRID VISUAL */}
              <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)', marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', paddingBottom: '25px', borderBottom: '2px solid #e2e8f0' }}>
                  <h3 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>🕐 Crear bloqueo horario</h3>
                  <div style={{ textAlign: 'right' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>Selecciona fecha:</label>
                    <input 
                      type="date" 
                      value={blockGridDate} 
                      onChange={(e) => {
                        setBlockGridDate(e.target.value);
                        setSelectedHoursToBlock([]); // Limpiar selección al cambiar fecha
                      }}
                      min={getMinimumBlockDate()} 
                      style={{ padding: '12px 16px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '14px', fontWeight: '500', outline: 'none', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {/* MAÑANA */}
                {(doctorData?.workShift === 'MORNING' || doctorData?.workShift === 'ANY') && (
                  <div style={{ marginBottom: '40px' }}>
                    <h4 style={{ color: '#1e293b', marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>☀️ Mañana (09:00-13:00)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '10px' }}>
                      {['09:00', '10:00', '11:00', '12:00', '13:00'].map(hour => {
                        const status = getHourStatusForBlock(blockGridDate, hour);
                        const isSelected = selectedHoursToBlock.includes(hour);
                        
                        const colorMap = {
                          AVAILABLE: { bg: '#dcfce7', border: '#86efac', text: '#15803d', icon: '✓' },
                          OCCUPIED: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', icon: '×' },
                          BLOCKED_SLOT: { bg: '#fefce8', border: '#eab308', text: '#854d0e', icon: '🔒' },
                          WITHIN_24H: { bg: '#e2e8f0', border: '#cbd5e1', text: '#64748b', icon: '⏳' },
                          PAST: { bg: '#f1f5f9', border: '#cbd5e1', text: '#94a3b8', icon: '⏱' }
                        };
                        
                        const colors = colorMap[status];
                        const canSelect = status === 'AVAILABLE';

                        return (
                          <button
                            key={hour}
                            onClick={() => {
                              if (canSelect) {
                                if (isSelected) {
                                  setSelectedHoursToBlock(selectedHoursToBlock.filter(h => h !== hour));
                                } else {
                                  setSelectedHoursToBlock([...selectedHoursToBlock, hour]);
                                }
                              }
                            }}
                            disabled={!canSelect}
                            style={{
                              padding: '14px 8px',
                              borderRadius: '10px',
                              border: isSelected ? '2px solid #667eea' : `2px solid ${colors.border}`,
                              backgroundColor: isSelected ? '#eff6ff' : colors.bg,
                              cursor: canSelect ? 'pointer' : 'not-allowed',
                              fontWeight: '600',
                              fontSize: '14px',
                              color: colors.text,
                              transition: 'all 0.2s ease',
                              transform: canSelect ? 'scale(1)' : 'scale(0.95)',
                              opacity: canSelect ? 1 : 0.6,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: isSelected ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                            }}
                            title={status === 'OCCUPIED' ? 'Hay una cita asignada' : status === 'BLOCKED_SLOT' ? 'Bloque existente de doctor' : status === 'WITHIN_24H' ? 'Dentro de 24 horas' : status === 'PAST' ? 'Hora pasada' : ''}
                          >
                            <span style={{ fontSize: '16px' }}>{colors.icon}</span>
                            <span>{hour}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TARDE */}
                {(doctorData?.workShift === 'AFTERNOON' || doctorData?.workShift === 'ANY') && (
                  <div style={{ marginBottom: '40px' }}>
                    <h4 style={{ color: '#1e293b', marginTop: 0, marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>🌅 Tarde (16:00-20:00)</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '10px' }}>
                      {['16:00', '17:00', '18:00', '19:00', '20:00'].map(hour => {
                        const status = getHourStatusForBlock(blockGridDate, hour);
                        const isSelected = selectedHoursToBlock.includes(hour);
                        
                        const colorMap = {
                          AVAILABLE: { bg: '#dcfce7', border: '#86efac', text: '#15803d', icon: '✓' },
                          OCCUPIED: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b', icon: '×' },
                          BLOCKED_SLOT: { bg: '#fefce8', border: '#eab308', text: '#854d0e', icon: '🔒' },
                          WITHIN_24H: { bg: '#e2e8f0', border: '#cbd5e1', text: '#64748b', icon: '⏳' },
                          PAST: { bg: '#f1f5f9', border: '#cbd5e1', text: '#94a3b8', icon: '⏱' }
                        };
                        
                        const colors = colorMap[status];
                        const canSelect = status === 'AVAILABLE';

                        return (
                          <button
                            key={hour}
                            onClick={() => {
                              if (canSelect) {
                                if (isSelected) {
                                  setSelectedHoursToBlock(selectedHoursToBlock.filter(h => h !== hour));
                                } else {
                                  setSelectedHoursToBlock([...selectedHoursToBlock, hour]);
                                }
                              }
                            }}
                            disabled={!canSelect}
                            style={{
                              padding: '14px 8px',
                              borderRadius: '10px',
                              border: isSelected ? '2px solid #667eea' : `2px solid ${colors.border}`,
                              backgroundColor: isSelected ? '#eff6ff' : colors.bg,
                              cursor: canSelect ? 'pointer' : 'not-allowed',
                              fontWeight: '600',
                              fontSize: '14px',
                              color: colors.text,
                              transition: 'all 0.2s ease',
                              transform: canSelect ? 'scale(1)' : 'scale(0.95)',
                              opacity: canSelect ? 1 : 0.6,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: isSelected ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                            }}
                            title={status === 'OCCUPIED' ? 'Hay una cita asignada' : status === 'BLOCKED_SLOT' ? 'Bloque existente de doctor' : status === 'WITHIN_24H' ? 'Dentro de 24 horas' : status === 'PAST' ? 'Hora pasada' : ''}
                          >
                            <span style={{ fontSize: '16px' }}>{colors.icon}</span>
                            <span>{hour}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* LEYENDA */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '30px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#dcfce7' }}></div>
                    <span style={{ color: '#64748b' }}>Disponible</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#fee2e2' }}></div>
                    <span style={{ color: '#64748b' }}>Con cita asignada</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#fefce8' }}></div>
                    <span style={{ color: '#64748b' }}>Bloque del doctor</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#e2e8f0' }}></div>
                    <span style={{ color: '#64748b' }}>Dentro de 24h</span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#f1f5f9' }}></div>
                    <span style={{ color: '#64748b' }}>Pasada</span>
                  </div>
                </div>

                {/* SECCIÓN DE MOTIVO Y BOTÓN */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '600' }}>Motivo (opcional):</label>
                    <input
                      type='text'
                      placeholder='Ej: Conferencia, Descanso...'
                      value={blockReason}
                      onChange={e => setBlockReason(e.target.value)}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '2px solid #e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    onClick={createBlocksFromSelection}
                    disabled={selectedHoursToBlock.length === 0}
                    style={{
                      padding: '12px 24px',
                      background: selectedHoursToBlock.length > 0 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#cbd5e1',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: selectedHoursToBlock.length > 0 ? 'pointer' : 'not-allowed',
                      fontWeight: '600',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      boxShadow: selectedHoursToBlock.length > 0 ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                    }}
                  >
                    🔒 Bloquear {selectedHoursToBlock.length > 0 ? selectedHoursToBlock.length : ''} hora{selectedHoursToBlock.length !== 1 ? 's' : ''}
                  </button>
                </div>
              </div>

              {/* TABLA DE BLOQUEOS EXISTENTES */}
              {(() => {
                const nowTs = new Date();
                const futureBlocks = blockedAppointments.filter(app => new Date(app.startTime) >= nowTs);
                const pastBlocks = blockedAppointments.filter(app => new Date(app.startTime) < nowTs);
                return (
                  <>
                    {/* Bloques futuros */}
                    <div style={styles.tableWrapper}>
                      <div style={{ ...styles.sectionHeader, marginBottom: '16px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9' }}>
                        <div>
                          <h4 style={{ margin: 0, color: '#1e293b' }}>🔒 Bloques activos</h4>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>Total de horarios bloqueados: <strong>{futureBlocks.length}</strong></p>
                        </div>
                        <button onClick={() => { console.log('Actualizando bloques...'); fetchBlocked(); }} style={{ padding: '8px 16px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>🔄 Refrescar ahora</button>
                      </div>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>FECHA/HORA</th>
                            <th style={styles.th}>MOTIVO</th>
                            <th style={styles.th}>ACCIONES</th>
                          </tr>
                        </thead>
                        <tbody>
                          {futureBlocks.length > 0 ? futureBlocks.map(app => (
                            <tr key={app.id} style={styles.tr}>
                              <td style={styles.td}>
                                <div style={styles.timeText}>{new Date(app.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                <div style={styles.dateText}>{new Date(app.startTime).toLocaleDateString()}</div>
                              </td>
                              <td style={styles.td}>{app.notes || "Sin motivo"}</td>
                              <td style={styles.td}>
                                <button style={styles.btnActionReject} onClick={() => handleCancel(app.id)}>Eliminar bloqueo</button>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan="3" style={{textAlign: 'center', padding: '20px', color: '#94a3b8'}}>No hay bloqueos futuros activos.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Bloques pasados */}
                    {pastBlocks.length > 0 && (
                      <div style={{ ...styles.tableWrapper, marginTop: '24px' }}>
                        <div style={{ ...styles.sectionHeader, marginBottom: '16px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9' }}>
                          <div>
                            <h4 style={{ margin: 0, color: '#94a3b8' }}>📋 Bloqueos pasados</h4>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>Historial de huecos bloqueados: <strong>{pastBlocks.length}</strong></p>
                          </div>
                        </div>
                        <table style={styles.table}>
                          <thead>
                            <tr>
                              <th style={styles.th}>FECHA/HORA</th>
                              <th style={styles.th}>MOTIVO</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pastBlocks.map(app => (
                              <tr key={app.id} style={{ ...styles.tr, opacity: 0.6 }}>
                                <td style={styles.td}>
                                  <div style={styles.timeText}>{new Date(app.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                                  <div style={styles.dateText}>{new Date(app.startTime).toLocaleDateString()}</div>
                                </td>
                                <td style={styles.td}>{app.notes || "Sin motivo"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'historial' && (
          <History authHeader={authHeader} doctorId={doctorId} />
        )}

        {activeTab === 'perfil' && doctorData && (
          <DoctorProfile doctorData={doctorData} onShiftChange={handleChangeShift} onSave={handleProfileUpdate} />
        )}

        {activeTab === 'estadisticas' && (
          <DoctorReassignmentStats authHeader={authHeader} doctorId={doctorId} />
        )}
      </main>

      {/* MODAL DETALLE CITA */}
      {selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          role="doctor"
          authHeader={authHeader}
        />
      )}

      {/* MODAL BLOQUEO */}
      {showBlockModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={{ marginTop: 0 }}>🚫 Bloquear Horario</h3>
            <textarea style={styles.textarea} value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Motivo..." />
            <div style={styles.modalButtons}>
              <button onClick={() => setShowBlockModal(false)} style={styles.btnSecondary}>Cancelar</button>
              <button onClick={confirmBlock} style={styles.btnBlockConfirm}>Bloquear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const getStatusColor = (status) => {
  switch(status) {
    case 'CONFIRMED': case 'ASSIGNED': return '#10b981';
    case 'OFFERED': return '#f59e0b';
    case 'CANCELLED': case 'REJECTED': return '#ef4444';
    case 'BLOCKED': return '#475569';
    case 'AVAILABLE': return '#22c55e';
    default: return '#94a3b8';
  }
};

const styles = {
  dashboardLayout: { minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'sans-serif' },
  mainAreaFull: { flex: 1, padding: '24px 40px 40px', maxWidth: '1200px', margin: '0 auto' },
  sidebar: { width: '260px', backgroundColor: '#1e293b', color: 'white', display: 'none' },
  sidebarBrand: { fontSize: '1.5rem', fontWeight: '800', marginBottom: '48px', textAlign: 'center' },
  sidebarNav: { display: 'none' },
  sideLink: { display: 'none' },
  sideLinkActive: { display: 'none' },
  sideLogout: { display: 'none' },
  mainArea: { marginLeft: '0px', flex: 1, padding: '40px' },
  topHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  userBadge: { padding: '6px 16px', backgroundColor: '#e0f2fe', color: '#0369a1', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600' },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '40px' },
  statCard: { backgroundColor: 'white', padding: '24px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  statIcon: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem' },
  statValue: { margin: 0, fontSize: '1.5rem', fontWeight: '700' },
  statLabel: { margin: 0, color: '#64748b', fontSize: '0.9rem' },
  contentSection: { backgroundColor: 'white', padding: '32px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  btnRefresh: { padding: '8px 16px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', color: '#475569' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '16px', borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '16px', verticalAlign: 'middle' },
  timeText: { fontWeight: '700', color: '#1e293b' },
  dateText: { fontSize: '0.8rem', color: '#64748b' },
  patientName: { fontWeight: '600', color: '#334155' },
  availableText: { color: '#10b981', fontWeight: '600' },
  blockedText: { color: '#64748b', fontStyle: 'italic' },
  badge: { padding: '4px 12px', borderRadius: '12px', color: 'white', fontSize: '0.7rem', fontWeight: '700' },
  actionGroup: { display: 'flex', gap: '8px', justifyContent: 'flex-end' },
  btnActionConfirm: { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  btnActionReject: { backgroundColor: '#fee2e2', color: '#ef4444', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  btnActionBlock: { backgroundColor: '#f1f5f9', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  profileGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '20px' },
  label: { display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' },
  profileValue: { padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', color: '#1e293b' },
  select: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '400px' },
  textarea: { width: '100%', minHeight: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' },
  modalButtons: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  btnSecondary: { padding: '10px 20px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  btnBlockConfirm: { padding: '10px 20px', backgroundColor: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};

export default DoctorDashboard;