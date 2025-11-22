import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div style={{fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"}}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
        color: 'white',
        padding: '5rem 0',
        marginBottom: '5rem'
      }}>
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h1 style={{fontSize: '3.5rem', fontWeight: '800', marginBottom: '1.5rem'}}>
                Secure Digital Voting Platform
              </h1>
              <p style={{fontSize: '1.25rem', marginBottom: '2rem', opacity: '0.9'}}>
                Empower your organization with transparent, secure, and accessible 
                electronic voting solutions. Trusted by institutions worldwide for 
                fair and verifiable elections.
              </p>
              <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                <Button 
                  as={Link} 
                  to="/register" 
                  variant="light" 
                  size="lg" 
                  style={{
                    padding: '0.75rem 2rem',
                    fontWeight: '600',
                    borderRadius: '8px'
                  }}
                >
                  Get Started Free
                </Button>
                <Button 
                  as={Link} 
                  to="/login" 
                  variant="outline-light" 
                  size="lg"
                  style={{
                    padding: '0.75rem 2rem',
                    fontWeight: '600',
                    borderRadius: '8px'
                  }}
                >
                  Sign In
                </Button>
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <div style={{fontSize: '8rem', opacity: '0.8'}}>🗳️</div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features Section */}
      <Container style={{marginBottom: '5rem'}}>
        <Row className="text-center mb-5">
          <Col>
            <h2 style={{fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem', color: '#2c3e50'}}>
              Why Choose Our Platform?
            </h2>
            <p style={{fontSize: '1.1rem', color: '#6c757d'}}>
              Designed for organizations that demand security, transparency, and ease of use
            </p>
          </Col>
        </Row>
        
        <Row className="g-4">
          <Col md={4}>
            <Card style={{
              height: '100%',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
              transition: 'transform 0.2s ease'
            }} className="hover-shadow">
              <Card.Body className="text-center p-4">
                <div style={{fontSize: '3rem', marginBottom: '1.5rem', color: '#4361ee'}}>🔒</div>
                <Card.Title style={{fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#2c3e50'}}>
                  Military-Grade Security
                </Card.Title>
                <Card.Text style={{color: '#6c757d', lineHeight: '1.6'}}>
                  End-to-end encryption, blockchain verification, and multi-factor authentication 
                  ensure your election results are tamper-proof and verifiable.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card style={{
              height: '100%',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
              transition: 'transform 0.2s ease'
            }} className="hover-shadow">
              <Card.Body className="text-center p-4">
                <div style={{fontSize: '3rem', marginBottom: '1.5rem', color: '#4361ee'}}>⚡</div>
                <Card.Title style={{fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#2c3e50'}}>
                  Instant Results
                </Card.Title>
                <Card.Text style={{color: '#6c757d', lineHeight: '1.6'}}>
                  Real-time vote counting and immediate results after polls close. 
                  Comprehensive analytics and exportable reports for post-election analysis.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card style={{
              height: '100%',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.08)',
              transition: 'transform 0.2s ease'
            }} className="hover-shadow">
              <Card.Body className="text-center p-4">
                <div style={{fontSize: '3rem', marginBottom: '1.5rem', color: '#4361ee'}}>🌍</div>
                <Card.Title style={{fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: '#2c3e50'}}>
                  Global Accessibility
                </Card.Title>
                <Card.Text style={{color: '#6c757d', lineHeight: '1.6'}}>
                  Fully responsive design works on any device. Multi-language support and 
                  accessibility features ensure everyone can participate in your elections.
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Stats Section */}
      <div style={{backgroundColor: '#f8f9fa', padding: '4rem 0', marginBottom: '5rem'}}>
        <Container>
          <Row className="text-center">
            <Col md={3} className="mb-4">
              <h2 style={{fontSize: '3rem', fontWeight: '700', color: '#4361ee', marginBottom: '0.5rem'}}>500+</h2>
              <p style={{color: '#6c757d', fontWeight: '500'}}>Organizations</p>
            </Col>
            <Col md={3} className="mb-4">
              <h2 style={{fontSize: '3rem', fontWeight: '700', color: '#4361ee', marginBottom: '0.5rem'}}>10K+</h2>
              <p style={{color: '#6c757d', fontWeight: '500'}}>Elections Conducted</p>
            </Col>
            <Col md={3} className="mb-4">
              <h2 style={{fontSize: '3rem', fontWeight: '700', color: '#4361ee', marginBottom: '0.5rem'}}>2M+</h2>
              <p style={{color: '#6c757d', fontWeight: '500'}}>Votes Cast</p>
            </Col>
            <Col md={3} className="mb-4">
              <h2 style={{fontSize: '3rem', fontWeight: '700', color: '#4361ee', marginBottom: '0.5rem'}}>99.9%</h2>
              <p style={{color: '#6c757d', fontWeight: '500'}}>Uptime Reliability</p>
            </Col>
          </Row>
        </Container>
      </div>

      {/* CTA Section */}
      <Container style={{marginBottom: '5rem'}}>
        <Row className="text-center">
          <Col lg={8} className="mx-auto">
            <h2 style={{fontSize: '2.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#2c3e50'}}>
              Ready to Transform Your Voting Process?
            </h2>
            <p style={{fontSize: '1.1rem', color: '#6c757d', marginBottom: '2rem'}}>
              Join thousands of organizations that trust our platform for their most important elections
            </p>
            <Button 
              as={Link} 
              to="/register" 
              variant="primary" 
              size="lg"
              style={{
                padding: '1rem 2.5rem',
                fontWeight: '600',
                borderRadius: '8px',
                fontSize: '1.1rem',
                background: 'linear-gradient(135deg, #4361ee 0%, #3a0ca3 100%)',
                border: 'none'
              }}
            >
              Create Your First Election
            </Button>
          </Col>
        </Row>
      </Container>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '4rem 0 2rem'
      }}>
        <Container>
          <Row className="gy-4">
            {/* Company Info */}
            <Col lg={4} md={6}>
              <h5 style={{color: '#4361ee', marginBottom: '1.5rem', fontWeight: '600'}}>SecureVote Platform</h5>
              <p style={{color: '#bdc3c7', marginBottom: '1.5rem', lineHeight: '1.6'}}>
                Leading the digital transformation of democratic processes with 
                cutting-edge technology that ensures security, transparency, 
                and accessibility for all.
              </p>
              <div style={{display: 'flex', gap: '1rem'}}>
                <span role="button" tabIndex={0} style={{color: '#bdc3c7', fontSize: '1.5rem', cursor: 'pointer'}}>📧</span>
                <span role="button" tabIndex={0} style={{color: '#bdc3c7', fontSize: '1.5rem', cursor: 'pointer'}}>📱</span>
                <span role="button" tabIndex={0} style={{color: '#bdc3c7', fontSize: '1.5rem', cursor: 'pointer'}}>🐦</span>
                <span role="button" tabIndex={0} style={{color: '#bdc3c7', fontSize: '1.5rem', cursor: 'pointer'}}>💼</span>
              </div>
            </Col>
            
            {/* Platform Links */}
            <Col lg={2} md={6}>
              <h6 style={{textTransform: 'uppercase', marginBottom: '1.5rem', fontWeight: '600'}}>Platform</h6>
              <ul style={{listStyle: 'none', padding: 0}}>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Features</span></li>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Security</span></li>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Pricing</span></li>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Case Studies</span></li>
              </ul>
            </Col>
            
            {/* Resources */}
            <Col lg={2} md={6}>
              <h6 style={{textTransform: 'uppercase', marginBottom: '1.5rem', fontWeight: '600'}}>Resources</h6>
              <ul style={{listStyle: 'none', padding: 0}}>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Documentation</span></li>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>API</span></li>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Blog</span></li>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Webinars</span></li>
              </ul>
            </Col>
            
            {/* Support */}
            <Col lg={2} md={6}>
              <h6 style={{textTransform: 'uppercase', marginBottom: '1.5rem', fontWeight: '600'}}>Support</h6>
              <ul style={{listStyle: 'none', padding: 0}}>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Help Center</span></li>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Contact Us</span></li>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Status</span></li>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Training</span></li>
              </ul>
            </Col>
            
            {/* Legal */}
            <Col lg={2} md={6}>
              <h6 style={{textTransform: 'uppercase', marginBottom: '1.5rem', fontWeight: '600'}}>Legal</h6>
              <ul style={{listStyle: 'none', padding: 0}}>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Privacy Policy</span></li>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Terms of Service</span></li>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Compliance</span></li>
                <li style={{marginBottom: '0.75rem'}}><span style={{color: '#bdc3c7', cursor: 'pointer'}}>Security</span></li>
              </ul>
            </Col>
          </Row>
          
          {/* Bottom Footer */}
          <hr style={{borderColor: '#34495e', margin: '2rem 0'}} />
          <Row className="align-items-center">
            <Col md={6}>
              <p style={{color: '#95a5a6', margin: 0}}>
                © 2025 SecureVote Platform. All rights reserved.
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <p style={{color: '#95a5a6', margin: 0}}>
                Built with ❤️ for democratic processes worldwide
              </p>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default Home;