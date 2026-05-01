import React, { useState, useEffect } from 'react';
import DoctorProfile from './DoctorProfile';

function ProfilePage({ authHeader, doctorId }) {
  const [doctorData, setDoctorData] = useState(null);

  useEffect(() => {
    console.log('ProfilePage load, doctorId', doctorId);
    if (doctorId) {
      fetch(`http://localhost:8080/api/doctors/${doctorId}`, {
        headers: { 'Authorization': authHeader }
      })
        .then(res => {
          console.log('profile fetch status', res.status);
          if (!res.ok) {
            throw new Error('Profile request failed ' + res.status);
          }
          return res.json();
        })
        .then(data => {
          console.log('profile data received', data);
          setDoctorData(data);
        })
        .catch(err => {
          console.error('Error fetching doctor data', err);
          // leave doctorData null so UI can show message
        });
    }
  }, [doctorId, authHeader]);

  const handleShiftChange = (newShift) => {
    return fetch(`http://localhost:8080/api/doctors/${doctorId}/shift`, {
      method: 'PUT',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ workShift: newShift })
    }).then(res => {
      if (res.ok) {
        setDoctorData({ ...doctorData, workShift: newShift });
        alert('☀️ Turno actualizado');
      }
      return res.ok;
    });
  };

  const handleUpdate = async (updatedFields) => {
    if (!authHeader) {
      throw new Error('No autenticado');
    }

    const resp = await fetch('http://localhost:8080/api/doctors/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader
      },
      body: JSON.stringify(updatedFields)
    });

    if (!resp.ok) {
      throw new Error(`No se pudo actualizar el perfil del médico: ${resp.status}`);
    }

    const updated = await resp.json();
    setDoctorData(updated);
    return true;
  };

  return (
    <div style={{ padding: '20px' }}>
      <DoctorProfile doctorData={doctorData} onSave={handleUpdate} />
    </div>
  );
}

export default ProfilePage;