import React, { useState } from 'react';
import { Form, Button, Card, Alert, Row, Col, Container } from 'react-bootstrap';
import { authAPI } from '../services/api';
import { Link } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
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
      const response = await authAPI.register(formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      window.location.href = '/dashboard';
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="register-container">
        <Container fluid className="h-100">
          <Row className="justify-content-center align-items-center h-100">
            <Col xs={11} sm={8} md={6} lg={5} xl={4}>
              <Card className="register-card shadow-sm border-0">
                <Card.Body className="p-5">
                  <div className="text-center mb-4">
                    <div className="register-icon mb-3">
                      🗳️
                    </div>
                    <h2 className="register-title mb-2">Create Account</h2>
                    <p className="text-muted">Join DigiVoterz today</p>
                  </div>

                  {error && (
                    <Alert variant="danger" className="alert-custom">
                      {error}
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label className="form-label-custom">Full Name</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="form-input-custom"
                        placeholder="Enter your full name"
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
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
                        placeholder="Create a password"
                      />
                    </Form.Group>

                    <div className="mb-4">
                      <Form.Check 
                        type="checkbox" 
                        label="I agree to the Terms of Service and Privacy Policy" 
                        className="text-muted"
                        required
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="register-btn w-100 mb-3" 
                      disabled={loading}
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </Form>

                  <div className="text-center">
                    <p className="login-text">
                      Already have an account? 
                      <Link to="/login" className="login-link ms-1">
                        Sign in here
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
        .register-container {
          min-height: 100vh;
          background-color: #f8f9fa;
          padding-top: 25px; /* Account for navbar height */
          // padding-bottom: 2rem;
        }

        .register-card {
          border-radius: 12px;
          background: white;
          border: 1px solid #e9ecef;
          transition: box-shadow 0.3s ease;
        }

        .register-card:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
        }

        .register-icon {
          font-size: 3rem;
          color: #0d6efd;
        }

        .register-title {
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

        .register-btn {
          background-color: #0d6efd;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          padding: 12px;
          transition: all 0.3s ease;
          font-size: 1rem;
        }

        .register-btn:hover:not(:disabled) {
          background-color: #0b5ed7;
          box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
        }

        .register-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-text {
          color: #6c757d;
          margin: 0;
          font-size: 0.95rem;
        }

        .login-link {
          color: #0d6efd;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s ease;
        }

        .login-link:hover {
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

        .form-check-label {
          font-size: 0.9rem;
          color: #6c757d;
        }

        .form-check-input:checked {
          background-color: #0d6efd;
          border-color: #0d6efd;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .register-container {
            padding-top: 80px;
            padding-left: 1rem;
            padding-right: 1rem;
          }

          .register-card .card-body {
            padding: 2rem !important;
          }

          .register-title {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 576px) {
          .register-container {
            padding-top: 60px;
          }

          .register-card .card-body {
            padding: 1.5rem !important;
          }
        }

      `}</style>
    </>
  );
};

export default Register;