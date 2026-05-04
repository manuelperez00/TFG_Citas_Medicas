import React, { useState, useEffect } from 'react';
import PatientProfile from './PatientProfile';

const API_URL = process.env.REACT_APP_API_URL;

function ProfilePage({ authHeader, patientId }) {
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!authHeader) {
        setError('La sesión no está autenticada. Vuelve a iniciar sesión.');
        setLoading(false);
        return;
      }

      const fetchById = async (id) => {
        const resp = await fetch(`${API_URL}/api/patients/${id}`, {
          headers: { Authorization: authHeader }
        });
        if (!resp.ok) {
          throw new Error(`No se pudo cargar paciente por ID: ${resp.status}`);
        }
        return resp.json();
      };

      try {
        const meResp = await fetch(`${API_URL}/api/patients/me`, {
          headers: { Authorization: authHeader }
        });

        if (meResp.ok) {
          const data = await meResp.json();
          setPatientData(data);
          setError(null);
        } else if (meResp.status === 404 && patientId) {
          const data = await fetchById(patientId);
          setPatientData(data);
          setError(null);
        } else {
          throw new Error(`No se pudo cargar el perfil del paciente: ${meResp.status}`);
        }
      } catch (err) {
        console.error('Error fetch patient data:', err);
        setError('No se pudo cargar el perfil de paciente. Comprueba tu acceso.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [authHeader]);

  if (loading) {
    return <div style={{ padding: '20px', color: '#64748b' }}>Cargando perfil de paciente...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: '#b91c1c' }}>Error: {error}</div>;
  }

  const handleUpdate = async (updatedFields) => {
    if (!authHeader) {
      setError('La sesión no está autenticada. Vuelve a iniciar sesión.');
      return;
    }
    try {
      const endpoint = `${API_URL}/api/patients/me`;
      console.log('Updating patient profile:', endpoint, updatedFields);
      const resp = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader
        },
        body: JSON.stringify(updatedFields)
      });

      if (!resp.ok) {
        throw new Error(`No se pudo actualizar el perfil del paciente: ${resp.status}`);
      }

      const updated = await resp.json();
      setPatientData(updated);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error updating patient data:', err);
      setError('No se pudo actualizar el perfil de paciente. Intenta de nuevo.');
      return false;
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <PatientProfile patientData={patientData} onSave={handleUpdate} />
    </div>
  );
}

export default ProfilePage;
