import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLogin.css';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Small delay for better UX
    setTimeout(() => {
      const result = login(password);
      if (!result.success) {
        setError(result.message);
        setPassword('');
      }
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <h1>Admin Access</h1>
          <p>Enter the admin password to access the dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              required
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-lg"
            disabled={isLoading || !password.trim()}
          >
            {isLoading ? 'Verifying...' : 'Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            <small>
              🔒 This is a secure admin area for site management.
            </small>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
