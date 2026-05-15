import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useModal } from '../components/AppModal';

const API_URL = process.env.REACT_APP_API_URL;

function Register() {
  const navigate = useNavigate();
  const { showAlert } = useModal();
  const [formData, setFormData] = useState({
    username: '', password: '', firstName: '', lastName: '',
    email: '', phone: '', birthDate: '', documentId: '', gender: 'UNDISCLOSED'
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
    <div className="register-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&display=swap');

        .register-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          font-family: 'Poppins', sans-serif;
          overflow: auto;
          padding: 16px;
          box-sizing: border-box;
        }

        .register-card {
          width: 100%;
          max-width: 520px;
          padding: 32px 36px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(10px);
        }

        .register-brand {
          text-align: center;
          margin-bottom: 22px;
        }

        .register-brand-icon {
          font-size: 2.4rem;
          display: block;
          margin-bottom: 6px;
        }

        .register-brand h2 {
          color: #0f172a;
          margin: 0;
          font-weight: 600;
          font-size: 1.4rem;
        }

        .register-brand .subtitle {
          color: #64748b;
          font-size: 0.82rem;
          margin: 4px 0 0;
        }

        .register-row {
          display: flex;
          gap: 12px;
        }

        .register-field {
          flex: 1;
          margin-bottom: 12px;
        }

        .register-field label {
          display: block;
          margin-bottom: 5px;
          color: #334155;
          font-weight: 500;
          font-size: 0.8rem;
        }

        .register-input {
          width: 100%;
          padding: 9px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.88rem;
          font-family: 'Poppins', sans-serif;
          transition: all 0.3s ease;
          box-sizing: border-box;
          outline: none;
          background-color: #f8fafc;
          color: #0f172a;
        }

        .register-input:focus {
          border-color: #3b82f6;
          background-color: #fff;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .register-divider {
          border: none;
          border-top: 1px solid #e2e8f0;
          margin: 14px 0;
        }

        .register-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(to right, #2563eb, #3b82f6);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          margin-top: 4px;
        }

        .register-btn:hover {
          background: linear-gradient(to right, #1d4ed8, #2563eb);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(37, 99, 235, 0.4);
        }

        .register-btn:active {
          transform: translateY(0);
        }

        .register-footer {
          text-align: center;
          margin-top: 14px;
          margin-bottom: 0;
          font-size: 0.82rem;
          color: #64748b;
        }

        .register-footer a {
          color: #2563eb;
          font-weight: 500;
        }
      `}</style>

      <div className="register-card">
        <div className="register-brand">
          <span className="register-brand-icon">🏥</span>
          <h2>AutoCita</h2>
          <p className="subtitle">Crea tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nombre + Apellidos */}
          <div className="register-row">
            <div className="register-field">
              <label>Nombre</label>
              <input className="register-input" name="firstName" placeholder="Tu nombre" onChange={handleChange} required />
            </div>
            <div className="register-field">
              <label>Apellidos</label>
              <input className="register-input" name="lastName" placeholder="Tus apellidos" onChange={handleChange} required />
            </div>
          </div>

          {/* Email */}
          <div className="register-field">
            <label>Correo Electrónico</label>
            <input className="register-input" name="email" type="email" placeholder="correo@ejemplo.com" onChange={handleChange} required />
          </div>

          {/* Teléfono + Fecha de nacimiento */}
          <div className="register-row">
            <div className="register-field">
              <label>Teléfono</label>
              <input className="register-input" name="phone" placeholder="600 000 000" onChange={handleChange} required />
            </div>
            <div className="register-field">
              <label>Fecha de nacimiento</label>
              <input className="register-input" type="date" name="birthDate" onChange={handleChange} required />
            </div>
          </div>

          {/* DNI + Género */}
          <div className="register-row">
            <div className="register-field">
              <label>DNI / NIE</label>
              <input className="register-input" name="documentId" placeholder="12345678A" onChange={handleChange} required />
            </div>
            <div className="register-field">
              <label>Género</label>
              <select className="register-input" name="gender" onChange={handleChange}>
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Femenino</option>
                <option value="OTHER">Otro</option>
                <option value="UNDISCLOSED">Prefiero no decirlo</option>
              </select>
            </div>
          </div>

          <hr className="register-divider" />

          {/* Usuario + Contraseña */}
          <div className="register-row">
            <div className="register-field">
              <label>Usuario</label>
              <input className="register-input" name="username" placeholder="nombre_usuario" onChange={handleChange} required />
            </div>
            <div className="register-field">
              <label>Contraseña</label>
              <input className="register-input" name="password" type="password" placeholder="••••••••" onChange={handleChange} required />
            </div>
          </div>

          <button type="submit" className="register-btn">Registrarse</button>
        </form>

        <p className="register-footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
