import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Form, 
  Button, 
  Card, 
  Alert, 
  Row, 
  Col, 
  Spinner,
  Badge,
  ProgressBar
} from 'react-bootstrap';
import { electionAPI, votingAPI } from '../services/api';

const VotingPage = () => {
  const { votingUrl } = useParams();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Voting form states
  const [voterId, setVoterId] = useState('');
  const [voterKey, setVoterKey] = useState('');
  const [selectedNominee, setSelectedNominee] = useState('');
  const [voterVerified, setVoterVerified] = useState(false);
  const [verifiedVoter, setVerifiedVoter] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [voteSubmitted, setVoteSubmitted] = useState(false);

  useEffect(() => {
    const fetchElection = async () => {
      try {
        const response = await electionAPI.getElectionForVoting(votingUrl);
        setElection(response.data.election);
      } catch (error) {
        setError(error.response?.data?.message || 'Election not found');
      } finally {
        setLoading(false);
      }
    };
    
    fetchElection();
    
    // Set up timer for real-time updates every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, [votingUrl]);

  const handleVerifyCredentials = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await votingAPI.verifyVoter({
        votingUrl,
        voterId: voterId.trim(),
        voterKey: voterKey.trim()
      });
      
      setVerifiedVoter(response.data.voter);
      setVoterVerified(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCastVote = async (e) => {
    e.preventDefault();
    if (!selectedNominee) {
      setError('Please select a candidate');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await votingAPI.castVote({
        votingUrl,
        voterId: voterId.trim(),
        voterKey: voterKey.trim(),
        nomineeId: selectedNominee
      });
      
      setSuccess(response.data.message);
      setVoteSubmitted(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to cast vote');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to get election status based on time
  const getElectionStatus = () => {
    if (!election) return null;
    
    const now = currentTime;
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);

    if (election.status === 'closed') {
      return { status: 'closed', text: 'Election Closed', variant: 'secondary' };
    }
    
    if (now < startDate) {
      return { status: 'not-started', text: 'Not Started', variant: 'warning' };
    } else if (now > endDate) {
      return { status: 'expired', text: 'Election Ended', variant: 'danger' };
    } else {
      return { status: 'active', text: 'Active', variant: 'success' };
    }
  };

  // Helper function to get time remaining until election starts or ends
  const getTimeRemaining = () => {
    if (!election) return null;
    
    const now = currentTime;
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);
    
    if (now < startDate) {
      return {
        type: 'start',
        milliseconds: startDate - now,
        message: 'Election will start in:'
      };
    } else if (now < endDate) {
      return {
        type: 'end',
        milliseconds: endDate - now,
        message: 'Election ends in:'
      };
    }
    
    return null;
  };

  // Helper function to format countdown time
  const formatCountdown = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
    const seconds = totalSeconds % 60;

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Helper function to format date/time for display
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    });
  };

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '2rem 1rem',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    centerCard: {
      maxWidth: '600px',
      margin: '0 auto',
      border: 'none',
      borderRadius: '1rem',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      overflow: 'hidden'
    },
    cardHeader: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '2rem',
      textAlign: 'center',
      border: 'none'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: '700',
      margin: '0 0 0.5rem 0'
    },
    subtitle: {
      fontSize: '1rem',
      opacity: '0.9',
      margin: '0'
    },
    statusBadge: {
      fontSize: '0.875rem',
      padding: '0.5rem 1rem',
      borderRadius: '9999px',
      fontWeight: '600',
      marginTop: '1rem'
    },
    scheduleCard: {
      backgroundColor: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      margin: '1.5rem 0',
      textAlign: 'center'
    },
    scheduleTitle: {
      fontSize: '1.125rem',
      fontWeight: '600',
      color: '#0369a1',
      marginBottom: '1rem'
    },
    scheduleTime: {
      fontSize: '0.875rem',
      color: '#0369a1',
      margin: '0.5rem 0'
    },
    countdownCard: {
      backgroundColor: '#fef3c7',
      border: '1px solid #fbbf24',
      borderRadius: '0.5rem',
      padding: '1rem',
      textAlign: 'center',
      marginTop: '1rem'
    },
    countdownText: {
      fontSize: '0.875rem',
      color: '#92400e',
      fontWeight: '600',
      marginBottom: '0.5rem'
    },
    countdownTime: {
      fontSize: '1.25rem',
      color: '#92400e',
      fontWeight: '700',
      fontFamily: 'monospace'
    },
    alertNotStarted: {
      backgroundColor: '#fff3cd',
      borderColor: '#ffeaa7',
      color: '#856404',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      textAlign: 'center',
      marginBottom: '2rem'
    },
    alertExpired: {
      backgroundColor: '#fee2e2',
      borderColor: '#fecaca',
      color: '#991b1b',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      textAlign: 'center',
      marginBottom: '2rem'
    },
    formSection: {
      padding: '2rem'
    },
    input: {
      borderRadius: '0.5rem',
      border: '1px solid #d1d5db',
      padding: '0.75rem 1rem',
      fontSize: '1rem',
      transition: 'border-color 0.2s ease',
      width: '100%'
    },
    button: {
      borderRadius: '0.5rem',
      padding: '0.75rem 1.5rem',
      fontWeight: '600',
      fontSize: '1rem',
      transition: 'all 0.2s ease',
      width: '100%'
    },
    primaryButton: {
      backgroundColor: '#1d4ed8',
      borderColor: '#1d4ed8',
      color: 'white'
    },
    successButton: {
      backgroundColor: '#059669',
      borderColor: '#059669',
      color: 'white'
    },
    nomineeCard: {
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      padding: '1rem',
      marginBottom: '0.75rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      backgroundColor: 'white'
    },
    nomineeCardSelected: {
      borderColor: '#3b82f6',
      backgroundColor: '#eff6ff',
      boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)'
    },
    loadingSpinner: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem',
      gap: '1rem'
    },
    progressSection: {
      marginTop: '2rem',
      padding: '1rem',
      backgroundColor: '#f9fafb',
      borderRadius: '0.5rem'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Card style={styles.centerCard}>
          <Card.Body style={styles.loadingSpinner}>
            <Spinner animation="border" variant="primary" />
            <p>Loading election...</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (error && !election) {
    return (
      <div style={styles.container}>
        <Card style={styles.centerCard}>
          <Card.Body style={styles.formSection}>
            <Alert variant="danger">
              <h4>Election Not Found</h4>
              <p>{error}</p>
            </Alert>
          </Card.Body>
        </Card>
      </div>
    );
  }

  const statusInfo = getElectionStatus();
  const timeInfo = getTimeRemaining();

  return (
    <div style={styles.container}>
      <Card style={styles.centerCard}>
        <Card.Header style={styles.cardHeader}>
          <h1 style={styles.title}>{election?.title}</h1>
          <p style={styles.subtitle}>{election?.description}</p>
          {statusInfo && (
            <Badge 
              bg={statusInfo.variant} 
              style={styles.statusBadge}
            >
              {statusInfo.text}
            </Badge>
          )}
        </Card.Header>

        <Card.Body style={styles.formSection}>
          {/* Election Schedule Information */}
          <div style={styles.scheduleCard}>
            <h3 style={styles.scheduleTitle}>Election Schedule</h3>
            <div style={styles.scheduleTime}>
              <strong>Starts:</strong> {formatDateTime(election?.startDate)}
            </div>
            <div style={styles.scheduleTime}>
              <strong>Ends:</strong> {formatDateTime(election?.endDate)}
            </div>
            
            {timeInfo && (
              <div style={styles.countdownCard}>
                <div style={styles.countdownText}>{timeInfo.message}</div>
                <div style={styles.countdownTime}>
                  {formatCountdown(timeInfo.milliseconds)}
                </div>
              </div>
            )}
          </div>

          

          {/* Status-based Content */}
          {statusInfo?.status === 'not-started' && (
            <div style={styles.alertNotStarted}>
              <h4>Election Has Not Started Yet</h4>
              <p>
                Voting will begin on {formatDateTime(election?.startDate)}.
                Please return at the scheduled time to cast your vote.
              </p>
            </div>
          )}

          {statusInfo?.status === 'expired' && (
            <div style={styles.alertExpired}>
              <h4>Election Has Ended</h4>
              <p>
                Voting ended on {formatDateTime(election?.endDate)}.
                Thank you for your participation in the democratic process.
              </p>
            </div>
          )}

          {statusInfo?.status === 'closed' && (
            <div style={styles.alertExpired}>
              <h4>Election Closed</h4>
              <p>This election has been closed by the administrator.</p>
            </div>
          )}

          {/* Active Voting Section */}
          {statusInfo?.status === 'active' && !voteSubmitted && (
            <>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              {!voterVerified ? (
                /* Credential Verification Form */
                <Form onSubmit={handleVerifyCredentials}>
                  <h4 className="mb-4">Enter Your Voting Credentials</h4>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Voter ID</Form.Label>
                        <Form.Control
                          type="text"
                          value={voterId}
                          onChange={(e) => setVoterId(e.target.value.toUpperCase())}
                          placeholder="Enter your Voter ID"
                          required
                          style={styles.input}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Voter Key</Form.Label>
                        <Form.Control
                          type="text"
                          value={voterKey}
                          onChange={(e) => setVoterKey(e.target.value.toUpperCase())}
                          placeholder="Enter your Voter Key"
                          required
                          style={styles.input}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button 
                    type="submit" 
                    disabled={submitting || !voterId || !voterKey}
                    style={{...styles.button, ...styles.primaryButton}}
                  >
                    {submitting ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Credentials'
                    )}
                  </Button>
                </Form>
              ) : (
                /* Voting Form */
                <Form onSubmit={handleCastVote}>
                  <Alert variant="success">
                    <h5>Welcome, {verifiedVoter?.name}!</h5>
                    <p>Your credentials have been verified. Please select your preferred candidate below.</p>
                  </Alert>

                  <h4 className="mb-4">Select Your Candidate</h4>
                  
                  {election?.nominees?.map((nominee) => (
                    <div
                      key={nominee._id}
                      style={{
                        ...styles.nomineeCard,
                        ...(selectedNominee === nominee._id ? styles.nomineeCardSelected : {})
                      }}
                      onClick={() => setSelectedNominee(nominee._id)}
                    >
                      <Form.Check
                        type="radio"
                        id={nominee._id}
                        name="nominee"
                        value={nominee._id}
                        checked={selectedNominee === nominee._id}
                        onChange={(e) => setSelectedNominee(e.target.value)}
                        label={nominee.name}
                        style={{ fontSize: '1.125rem', fontWeight: '500' }}
                      />
                    </div>
                  ))}

                  <Button 
                    type="submit" 
                    disabled={submitting || !selectedNominee}
                    style={{...styles.button, ...styles.successButton}}
                    className="mt-3"
                  >
                    {submitting ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Casting Vote...
                      </>
                    ) : (
                      'Cast Your Vote'
                    )}
                  </Button>
                </Form>
              )}
            </>
          )}

          {/* Vote Submitted Success */}
          {voteSubmitted && (
            <Alert variant="success" className="text-center">
              <h4>Vote Successfully Submitted!</h4>
              <p>Thank you for participating in this election. Your vote has been recorded securely.</p>
              <hr />
              <p className="mb-0">
                <strong>Remember:</strong> You cannot vote again in this election.
                Results will be available after the election ends.
              </p>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default VotingPage;