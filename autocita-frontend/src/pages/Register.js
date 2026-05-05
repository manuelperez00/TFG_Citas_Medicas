import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useModal } from '../components/AppModal';

const API_URL = process.env.REACT_APP_API_URL;

function Register() {
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const [formData, setFormData] = useState({
    username: '', password: '', firstName: '', lastName: '', email: '', phone: '', birthDate: '', documentId: '', gender: 'UNDISCLOSED'
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        await showAlert("✅ ¡Registro exitoso! Ahora puedes iniciar sesión.");
        navigate('/login');
      } else {
        const errorText = await response.text();
        showAlert("❌ Error del servidor: " + errorText);
      }
    } catch (error) {
      console.error(error);
      showAlert("❌ Error de conexión con el servidor");
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <form onSubmit={handleSubmit} style={{ backgroundColor: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h2 style={{ textAlign: 'center', color: '#333' }}>Crear Cuenta</h2>
        
        <input name="firstName" placeholder="Nombre" onChange={handleChange} required style={styles.input} />
        <input name="lastName" placeholder="Apellidos" onChange={handleChange} required style={styles.input} />
        <input name="email" type="email" placeholder="Correo Electrónico" onChange={handleChange} required style={styles.input} />
        <input name="phone" placeholder="Teléfono" onChange={handleChange} required style={styles.input} />
        <input 
            type="date" 
            name="birthDate" 
            onChange={handleChange} 
            required 
            style={styles.input} 
        />
        <p style={{fontSize: '0.8rem', color: '#666'}}>Fecha de nacimiento</p>
        <input 
            name="documentId" 
            placeholder="DNI / NIE" 
            onChange={handleChange} 
            required 
            style={styles.input} 
        />

        <select name="gender" onChange={handleChange} style={styles.input}>
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Femenino</option>
            <option value="OTHER">Otro</option>
        </select>
        
        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />
        
        <input name="username" placeholder="Usuario" onChange={handleChange} required style={styles.input} />
        <input name="password" type="password" placeholder="Contraseña" onChange={handleChange} required style={styles.input} />

        <button type="submit" style={styles.button}>Registrarse</button>
        
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </form>
    </div>
  );
}

const styles = {
  input: { width: '100%', padding: '12px', margin: '8px 0', borderRadius: '5px', border: '1px solid #ddd', boxSizing: 'border-box' },
  button: { width: '100%', padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', marginTop: '20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }
};

export default Register;