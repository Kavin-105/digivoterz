import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Container, Navbar, Nav, NavDropdown } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

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
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const AppContent = () => {
    const location = useLocation();
    const isVotingPage = location.pathname.startsWith('/vote/');

    return (
      <div className="App">
        {!isVotingPage && (
          <Navbar bg="white" variant="light" expand="lg" className="shadow-sm border-bottom">
            <Container fluid className="px-4">
              {/* Left side - Brand name only */}
              <Navbar.Brand as={Link} to="/" className="fw-bold fs-3 text-primary">
                  DigiVoterz
              </Navbar.Brand>
              
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                {/* Center - Navigation links */}
                <Nav className="mx-auto">
                  <Nav.Link as={Link} to="/" className="mx-3 fw-medium text-dark">
                    Home
                  </Nav.Link>
                  <Nav.Link href="#pricing" className="mx-3 fw-medium text-dark">
                    Pricing
                  </Nav.Link>
                  {!token && (
                    <>
                      <Nav.Link href="#reviews" className="mx-3 fw-medium text-dark">
                        Reviews
                      </Nav.Link>
                      <Nav.Link href="#support" className="mx-3 fw-medium text-dark">
                        Support
                      </Nav.Link>
                    </>
                  )}
                  {token && (
                    <>
                      <Nav.Link as={Link} to="/create-election" className="mx-3 fw-medium text-dark">
                        Create Election
                      </Nav.Link>
                      <Nav.Link as={Link} to="/dashboard" className="mx-3 fw-medium text-dark">
                        Dashboard
                      </Nav.Link>
                    </>
                  )}
                </Nav>
                
                {/* Right side - Auth buttons/user dropdown */}
                <Nav className="ms-auto">
                  {token ? (
                    <NavDropdown 
                      title={<span className="text-dark fw-medium">{user?.name}</span>} 
                      id="user-dropdown"
                      align="end"
                    >
                      <NavDropdown.Item onClick={handleLogout}>
                        Logout
                      </NavDropdown.Item>
                    </NavDropdown>
                  ) : (
                    <>
                      <Nav.Link 
                        as={Link} 
                        to="/login"
                        className="btn btn-outline-primary btn-sm me-2"
                        style={{ textDecoration: 'none' }}
                      >
                        Login
                      </Nav.Link>
                      <Nav.Link 
                        as={Link} 
                        to="/register"
                        className="btn btn-primary btn-sm"
                        style={{ textDecoration: 'none' }}
                      >
                        Register
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

      <style jsx>{`
        .navbar {
          // border:1px solid black;
          background-color: white !important;
          width:100%;
          height:80px;
          position:sticky;
          top:0;
          z-index:10;
        }

        .navbar-brand {
          // border:1px solid black;
          color: #0468ffff !important;
          width:21%;
        }

        .navbar-nav{
          // border:1px solid black;
          // margin-left:100px;
          // width:10%;
        }
        
        .navbar-nav .nav-link {
          transition: color 0.3s ease, transform 0.2s ease;
          color: #333 !important;
          // border:1px solid black;
        }
        
        .navbar-nav .nav-link:hover {
          background-color: #0d6efd !important;
          transform: translateY(-2px);
          color: white !important;
          border-radius: 20px;
          // box-shadow: 0 4px 8px #0d6efd;
        }
        
        .btn-outline-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(13, 110, 253, 0.3);
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(13, 110, 253, 0.4);
        }
        
        .navbar-brand:hover {
          transform: scale(1.05);
          transition: transform 0.2s ease;
        }
        
        .dropdown-toggle::after {
          margin-left: 0.5rem;
        }
        
        .dropdown-menu {
          border: 1px solid #e0e0e0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        .dropdown-item:hover {
          background-color: #f8f9fa;
          color: #dc3545;
        }
        
        @media (max-width: 991px) {
          .navbar-nav {
            text-align: center;
            margin: 1rem 0;
          }
          
          .navbar-nav .nav-link {
            padding: 0.5rem 1rem;
          }
        }
      `}</style>
    </Router>
  );
}

export default App;