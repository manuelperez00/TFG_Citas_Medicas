import React, { useState, useEffect } from 'react';
import DoctorProfile from './DoctorProfile';
import { useModal } from '../../components/AppModal';

const API_URL = process.env.REACT_APP_API_URL;

function ProfilePage({ authHeader, doctorId }) {
  const { showAlert } = useModal();
  const [doctorData, setDoctorData] = useState(null);

  useEffect(() => {
    console.log('ProfilePage load, doctorId', doctorId);
    if (doctorId) {
      fetch(`${API_URL}/api/doctors/${doctorId}`, {
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
    return fetch(`${API_URL}/api/doctors/${doctorId}/shift`, {
      method: 'PUT',
      headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({ workShift: newShift })
    }).then(res => {
      if (res.ok) {
        setDoctorData({ ...doctorData, workShift: newShift });
        showAlert('✅ Turno actualizado correctamente');
      }
      return res.ok;
    });
  };

  const handleUpdate = async (updatedFields) => {
    if (!authHeader) return false;
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

  return (
    <div style={{ padding: '20px' }}>
      <DoctorProfile doctorData={doctorData} onSave={handleUpdate} />
    </div>
  );
}

export default ProfilePage;