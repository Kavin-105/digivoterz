import React, { useState } from 'react';
import { Form, Button, Card, Alert, Row, Col, Container } from 'react-bootstrap';
import { authAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.location.href = '/dashboard';
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="login-container">
        <Container fluid className="h-100">
          <Row className="justify-content-center align-items-center h-100">
            <Col xs={11} sm={8} md={6} lg={5} xl={4}>
              <Card className="login-card shadow-lg border-0">
                <Card.Body className="p-5">
                  <div className="text-center mb-4">
                    <div className="login-icon mb-3">
                      🗳️
                    </div>
                    <h2 className="login-title mb-2">Welcome Back</h2>
                    <p className="text-muted">Sign in to your DigiVoterz account</p>
                  </div>

                  {error && (
                    <Alert variant="danger" className="alert-custom">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      {error}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Email Address</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="form-input-custom"
                        placeholder="Enter your email"
                      />
                    </Form.Group>

                    <Form.Group className="mb-4">
                      <Form.Label className="form-label-custom">Password</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="form-input-custom"
                        placeholder="Enter your password"
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <Form.Check 
                        type="checkbox" 
                        label="Remember me" 
                        className="text-muted"
                      />
                      <Link to="/forgot-password" className="forgot-password-link">
                        Forgot Password?
                      </Link>
                    </div>

                    <Button 
                      type="submit" 
                      className="login-btn w-100 mb-3" 
                      disabled={loading}
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </Form>

                  <div className="text-center">
                    <p className="register-text">
                      Don't have an account? 
                      <Link to="/register" className="register-link ms-1">
                        Create one here
                      </Link>
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>

      <style jsx>{`
        .login-container {
          height: calc(100vh - 56px); /* Full viewport height minus navbar height */
          background-color: #f8f9fa;
          // padding-top: px; /* Account for navbar height */
          // padding-bottom: 2rem;
        }

        .login-card {
          border-radius: 12px;
          background: white;
          border: 1px solid #e9ecef;
          transition: box-shadow 0.3s ease;
        }

        .login-card:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
        }

        .login-icon {
          font-size: 3rem;
          color: #0d6efd;
        }

        .login-title {
          color: #343a40;
          font-weight: 600;
          font-size: 1.75rem;
        }

        .form-label-custom {
          font-weight: 500;
          color: #495057;
          margin-bottom: 0.5rem;
          font-size: 0.95rem;
        }

        .form-input-custom {
          border: 1px solid #ced4da;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background-color: white;
        }

        .form-input-custom:focus {
          border-color: #0d6efd;
          box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.15);
          outline: none;
        }

        .login-btn {
          background-color: #0d6efd;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          padding: 12px;
          transition: all 0.3s ease;
          font-size: 1rem;
        }

        .login-btn:hover:not(:disabled) {
          background-color: #0b5ed7;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .forgot-password-link {
          color: #0d6efd;
          text-decoration: none;
          font-size: 0.9rem;
          font-weight: 400;
          transition: color 0.3s ease;
        }

        .forgot-password-link:hover {
          color: #0b5ed7;
          text-decoration: underline;
        }

        .register-text {
          color: #6c757d;
          margin: 0;
          font-size: 0.95rem;
        }

        .register-link {
          color: #0d6efd;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .register-link:hover {
          color: #0b5ed7;
          text-decoration: underline;
        }

        .alert-custom {
          border-radius: 8px;
          border: 1px solid #f5c2c7;
          background-color: #f8d7da;
          color: #842029;
          font-size: 0.9rem;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .login-container {
            padding-top: 60px;
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .login-card .card-body {
            padding: 2rem !important;
          }

          .login-title {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 576px) {
          .login-container {
            padding-top: 40px;
          }

          .login-card .card-body {
            padding: 1.5rem !important;
          }
        }
      `}</style>
    </>
  );
};

export default Login;