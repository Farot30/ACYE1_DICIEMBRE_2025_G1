import React, { useState } from 'react';
import { Shield, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import '../styles/LoginPage.css';

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Credenciales institucionales
  const CREDENTIALS = {
    username: 'fiusac_datacenter',
    password: 'SecurePass2025'
  };

  const handleLogin = () => {
    setIsLoading(true);
    setLoginError('');

    setTimeout(() => {
      if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
        onLogin(username);
        setLoginError('');
      } else {
        setLoginError('Credenciales inválidas. Acceso denegado.');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <div className="login-container">
      <div className="login-background-pattern"></div>

      <div className="login-card-wrapper">
        <div className="login-glow"></div>
        
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon-wrapper">
              <Shield size={32} color="#60a5fa" />
            </div>
            <h1 className="login-title">DataCenter Monitoring</h1>
            <p className="login-subtitle">Sistema de Monitoreo y Control</p>
            <div className="login-security-badge">
              <Lock size={12} />
              <span>Acceso Seguro - FIUSAC</span>
            </div>
          </div>

          <div className="login-form">
            <div className="form-group">
              <label className="form-label">Usuario Institucional</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                className="form-input"
                placeholder="fiusac_datacenter"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="form-input"
                  placeholder="••••••••"
                  style={{ paddingRight: '3rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle-btn"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="error-message">
                <AlertTriangle size={16} />
                <span>{loginError}</span>
              </div>
            )}

            <button onClick={handleLogin} disabled={isLoading} className="login-button">
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <Lock size={20} />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </div>

          <div className="login-footer">
            <p className="footer-text">Acceso restringido a personal autorizado</p>
            <p className="footer-text-muted">© 2024 FIUSAC - Todos los derechos reservados</p>
          </div>

          <div className="credentials-box">
            <p className="credentials-title">Credenciales de prueba:</p>
            <p className="credentials-text">Usuario: fiusac_datacenter</p>
            <p className="credentials-text">Contraseña: SecurePass2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;