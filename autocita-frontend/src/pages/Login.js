import React, { useState } from 'react';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const API_URL = process.env.REACT_APP_API_URL;

    try {
      // Realizamos la petición al backend
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        // En caso de que el login sea exitoso generamos el token y llamamos a onLogin
        const token = 'Basic ' + btoa(username + ':' + password);
        onLogin({ 
            username: username, 
            authHeader: token 
        });
      } else {
        const errorData = await response.text();
        alert('Error al iniciar sesión: ' + errorData);
      }
    } catch (error) {
      console.error('Error de conexión:', error);
      alert('Error de conexión con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Inyectamos estilos CSS aquí mismo para tener animaciones y hover */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');

        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          font-family: 'Poppins', sans-serif;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 40px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(10px);
          transform: translateY(0);
          transition: transform 0.3s ease;
        }

        .login-card:hover {
          transform: translateY(-5px);
        }

        .brand-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .brand-icon {
          font-size: 3rem;
          margin-bottom: 10px;
          display: block;
        }

        h2 {
          color: #0f172a;
          margin: 0;
          font-weight: 600;
        }

        .subtitle {
          color: #64748b;
          font-size: 0.9rem;
          margin-top: 5px;
        }

        .input-group {
          margin-bottom: 20px;
          position: relative;
        }

        .input-group label {
          display: block;
          margin-bottom: 8px;
          color: #334155;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .input-field {
          width: 100%;
          padding: 12px 15px;
          border: 2px solid #e2e8f0;
          border-radius: 10px;
          font-size: 1rem;
          transition: all 0.3s ease;
          box-sizing: border-box;
          outline: none;
          background-color: #f8fafc;
        }

        .input-field:focus {
          border-color: #3b82f6;
          background-color: #fff;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(to right, #2563eb, #3b82f6);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }

        .login-btn:hover {
          background: linear-gradient(to right, #1d4ed8, #2563eb);
          transform: translateY(-2px);
          box-shadow: 0 6px 15px rgba(37, 99, 235, 0.4);
        }

        .login-btn:active {
          transform: translateY(0);
        }
        
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>

      <div className="login-card">
        <div className="brand-header">
          <span className="brand-icon">🏥</span>
          <h2>AutoCita</h2>
          <p className="subtitle">Gestión médica inteligente</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Usuario</label>
            <input
              className="input-field"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingresa tu usuario"
              required
            />
          </div>

          <div className="input-group">
            <label>Contraseña</label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? 'Accediendo...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;