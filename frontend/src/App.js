import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateElection from './pages/CreateElection';
import VotingPage from './pages/VotingPage';
import ResultsPage from './pages/ResultsPage';


function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="dv-loading-screen">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div style={{ marginTop: '1rem', fontWeight: 600, color: 'var(--brand-primary)', fontSize: '0.95rem' }}>
            Loading DigiVoterz...
          </div>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const AppContent = () => {
    const location = useLocation();
    const isVotingPage = location.pathname.startsWith('/vote/');

    return (
      <div className="App">
        {!isVotingPage && (
          <Navbar className="dv-navbar" expand="lg">
            <Container fluid className="px-4">
              {/* Brand */}
              <Navbar.Brand as={Link} to="/" className="dv-brand">
                🗳️ <span className="dv-brand-text">DigiVoterzz</span>
              </Navbar.Brand>

              <Navbar.Toggle aria-controls="main-navbar-nav" style={{ border: '1.5px solid var(--border-light)', borderRadius: 'var(--radius-sm)' }} />
              <Navbar.Collapse id="main-navbar-nav">
                {/* Center nav links */}
                <Nav className="mx-auto gap-1">
                  <Nav.Link
                    as={Link}
                    to="/"
                    className={`dv-nav-link ${location.pathname === '/' ? 'active' : ''}`}
                  >
                    Home
                  </Nav.Link>
                  <Nav.Link href="#pricing" className="dv-nav-link">
                    Pricing
                  </Nav.Link>
                  {!token && (
                    <>
                      <Nav.Link href="#reviews" className="dv-nav-link">
                        Reviews
                      </Nav.Link>
                      <Nav.Link href="#support" className="dv-nav-link">
                        Support
                      </Nav.Link>
                    </>
                  )}
                  {token && (
                    <>
                      <Nav.Link
                        as={Link}
                        to="/create-election"
                        className={`dv-nav-link ${location.pathname === '/create-election' ? 'active' : ''}`}
                      >
                        Create Election
                      </Nav.Link>
                      <Nav.Link
                        as={Link}
                        to="/dashboard"
                        className={`dv-nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                      >
                        Dashboard
                      </Nav.Link>
                    </>
                  )}
                </Nav>

                {/* Right - Auth area */}
                <Nav className="ms-auto align-items-center gap-2">
                  {token ? (
                    <NavDropdown
                      title={
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                          <span className="dv-user-avatar">{getInitials(user?.name)}</span>
                          {user?.name}
                        </span>
                      }
                      id="user-dropdown"
                      align="end"
                    >
                      <NavDropdown.Item
                        as={Link}
                        to="/dashboard"
                        style={{ fontSize: '0.9rem' }}
                      >
                        Dashboard
                      </NavDropdown.Item>
                      <NavDropdown.Divider />
                      <NavDropdown.Item onClick={handleLogout}>
                        Logout
                      </NavDropdown.Item>
                    </NavDropdown>
                  ) : (
                    <>
                      <Nav.Link
                        as={Link}
                        to="/login"
                        className="dv-btn-login"
                      >
                        Login
                      </Nav.Link>
                      <Nav.Link
                        as={Link}
                        to="/register"
                        className="dv-btn-register"
                      >
                        Get Started
                      </Nav.Link>
                    </>
                  )}
                </Nav>
              </Navbar.Collapse>
            </Container>
          </Navbar>
        )}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={token ? <Navigate to="/dashboard" /> : <Login setToken={setToken} setUser={setUser} />}
          />
          <Route
            path="/register"
            element={token ? <Navigate to="/dashboard" /> : <Register />}
          />
          <Route
            path="/dashboard"
            element={token ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/create-election"
            element={token ? <CreateElection /> : <Navigate to="/login" />}
          />
          <Route path="/vote/:votingUrl" element={<VotingPage />} />
          <Route path="/results/:electionId" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    );
  };

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;