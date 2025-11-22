import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Alert, Row, Col, ProgressBar, Badge, Container, Spinner } from 'react-bootstrap';
import { electionAPI } from '../services/api';

const ResultsPage = () => {
  const { electionId } = useParams();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await electionAPI.getElectionResults(electionId);
        setElection(response.data.election);
      } catch (error) {
        setError('Failed to load election results');
        console.error('Error fetching results:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
    
    // Auto-refresh results every 10 seconds
    const refreshInterval = setInterval(fetchResults, 10000);
    
    return () => clearInterval(refreshInterval);
  }, [electionId]);

  const getWinner = () => {
    if (!election?.nominees?.length) return null;
    
    const maxVotes = Math.max(...election.nominees.map(n => n.voteCount || 0));
    const winners = election.nominees.filter(n => (n.voteCount || 0) === maxVotes);
    
    return winners.length === 1 && maxVotes > 0 ? winners[0] : null;
  };

  const getVotePercentage = (voteCount) => {
    if (!election?.votedCount || election.votedCount === 0) return 0;
    return Math.round((voteCount / election.votedCount) * 100);
  };

  const getTurnoutPercentage = () => {
    if (!election?.totalVoters || election.totalVoters === 0) return 0;
    return Math.round((election.votedCount / election.totalVoters) * 100);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getElectionStatus = () => {
    if (!election) return { text: 'Unknown', variant: 'secondary' };
    
    const now = new Date();
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);
    
    if (election.status === 'closed') {
      return { text: 'Closed', variant: 'secondary' };
    } else if (now < startDate) {
      return { text: 'Not Started', variant: 'warning' };
    } else if (now > endDate) {
      return { text: 'Ended', variant: 'danger' };
    } else {
      return { text: 'Active', variant: 'success' };
    }
  };

  const styles = {
    container: {
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      padding: '1rem 0'
    },
    headerCard: {
      border: 'none',
      borderRadius: '0.75rem',
      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      marginBottom: '1rem'
    },
    headerTitle: {
      fontSize: '1.5rem',
      fontWeight: '600',
      marginBottom: '0.25rem',
      color: 'white'
    },
    headerSubtitle: {
      fontSize: '0.875rem',
      opacity: 0.9,
      marginBottom: 0
    },
    winnerCard: {
      border: 'none',
      borderRadius: '0.75rem',
      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      marginBottom: '1rem'
    },
    statsCard: {
      border: 'none',
      borderRadius: '0.75rem',
      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      backgroundColor: 'white',
      height: '100%'
    },
    statsIcon: {
      width: '2.5rem',
      height: '2.5rem',
      borderRadius: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1rem',
      marginBottom: '0.5rem'
    },
    statsNumber: {
      fontSize: '1.5rem',
      fontWeight: '700',
      marginBottom: '0.25rem',
      lineHeight: 1
    },
    statsLabel: {
      fontSize: '0.75rem',
      color: '#64748b',
      fontWeight: '500'
    },
    resultsCard: {
      border: 'none',
      borderRadius: '0.75rem',
      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      backgroundColor: 'white'
    },
    candidateCard: {
      border: '1px solid #e5e7eb',
      borderRadius: '0.5rem',
      backgroundColor: 'white',
      marginBottom: '0.75rem',
      transition: 'all 0.3s ease',
      overflow: 'hidden'
    },
    candidateHeader: {
      padding: '0.75rem 1rem',
      borderBottom: '1px solid #f3f4f6'
    },
    candidateName: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#1f2937',
      marginBottom: '0.25rem'
    },
    voteStats: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    voteCount: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#059669'
    },
    votePercentage: {
      fontSize: '0.875rem',
      fontWeight: '600',
      color: '#6b7280'
    },
    barChart: {
      padding: '0.5rem 1rem 0.75rem',
      background: 'linear-gradient(to right, #f9fafb 0%, #f3f4f6 100%)'
    },
    barContainer: {
      width: '100%',
      height: '1.25rem',
      backgroundColor: '#e5e7eb',
      borderRadius: '0.625rem',
      overflow: 'hidden',
      position: 'relative'
    },
    bar: {
      height: '100%',
      borderRadius: '0.625rem',
      transition: 'all 1s ease-out',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingRight: '0.5rem',
      color: 'white',
      fontWeight: '600',
      fontSize: '0.75rem'
    },
    infoCard: {
      border: 'none',
      borderRadius: '0.75rem',
      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      backgroundColor: 'white',
      marginTop: '1rem'
    },
    rankBadge: {
      position: 'absolute',
      top: '0.75rem',
      right: '0.75rem',
      fontSize: '0.75rem',
      padding: '0.25rem 0.5rem'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Container>
          <div className="d-flex justify-content-center align-items-center" style={{minHeight: '60vh'}}>
            <div className="text-center">
              <Spinner animation="border" variant="primary" style={{width: '3rem', height: '3rem'}} />
              <p className="mt-3 text-muted">Loading election results...</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>
              <Alert variant="danger" className="text-center">
                <Alert.Heading>Error Loading Results</Alert.Heading>
                <p>{error}</p>
              </Alert>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  const winner = getWinner();
  const sortedNominees = [...(election?.nominees || [])].sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0));
  const electionStatus = getElectionStatus();

  return (
    <div style={styles.container}>
      <Container>
        {/* Election Header */}
        <Card style={styles.headerCard}>
          <Card.Body className="p-4">
            <Row className="align-items-center">
              <Col>
                <h1 style={styles.headerTitle}>{election.title}</h1>
                <p style={styles.headerSubtitle}>{election.description}</p>
              </Col>
              <Col xs="auto">
                <Badge 
                  bg={electionStatus.variant} 
                  style={{fontSize: '1rem', padding: '0.75rem 1rem'}}
                >
                  {electionStatus.text}
                </Badge>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Winner Announcement */}
        {winner && election.votedCount > 0 && (
          <Card style={styles.winnerCard}>
            <Card.Body className="p-3 text-center">
              <div style={{fontSize: '2rem', marginBottom: '0.5rem'}}>🏆</div>
              <h4 style={{color: 'white', marginBottom: '0.5rem'}}>Winner: {winner.name}</h4>
              <p style={{fontSize: '0.875rem', opacity: 0.9, marginBottom: 0}}>
                <strong>{winner.voteCount}</strong> votes ({getVotePercentage(winner.voteCount)}%)
              </p>
            </Card.Body>
          </Card>
        )}

        {/* Voting Statistics */}
        <Row className="mb-3">
          <Col lg={4} md={6} className="mb-2">
            <Card style={styles.statsCard}>
              <Card.Body className="p-3 text-center">
                <div style={{...styles.statsIcon, backgroundColor: '#dbeafe', color: '#2563eb', margin: '0 auto'}}>
                  📊
                </div>
                <div style={{...styles.statsNumber, color: '#2563eb'}}>
                  {election.votedCount || 0}
                </div>
                <div style={styles.statsLabel}>Total Votes</div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} md={6} className="mb-2">
            <Card style={styles.statsCard}>
              <Card.Body className="p-3 text-center">
                <div style={{...styles.statsIcon, backgroundColor: '#f0f9ff', color: '#0ea5e9', margin: '0 auto'}}>
                  👥
                </div>
                <div style={{...styles.statsNumber, color: '#0ea5e9'}}>
                  {election.totalVoters || 0}
                </div>
                <div style={styles.statsLabel}>Eligible Voters</div>
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} md={12} className="mb-2">
            <Card style={styles.statsCard}>
              <Card.Body className="p-3 text-center">
                <div style={{...styles.statsIcon, backgroundColor: '#dcfce7', color: '#16a34a', margin: '0 auto'}}>
                  📈
                </div>
                <div style={{...styles.statsNumber, color: '#16a34a'}}>
                  {getTurnoutPercentage()}%
                </div>
                <div style={styles.statsLabel}>Turnout</div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Results with Bar Charts */}
        <Card style={styles.resultsCard}>
          <Card.Header className="bg-white border-0 p-3">
            <h5 style={{margin: 0, color: '#1f2937', fontWeight: '600'}}>
              Results
            </h5>
            <p style={{margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem'}}>
              Live voting breakdown
            </p>
          </Card.Header>
          <Card.Body className="p-0">
            {election.votedCount === 0 ? (
              <div className="p-3">
                <Alert variant="info" className="text-center mb-0">
                  <div style={{fontSize: '1.5rem', marginBottom: '0.5rem'}}>📊</div>
                  <h6>No votes cast yet</h6>
                  <p className="mb-0 small">Results will appear here once voting begins.</p>
                </Alert>
              </div>
            ) : (
              <div className="p-3">
                {sortedNominees.map((nominee, index) => {
                  const percentage = getVotePercentage(nominee.voteCount || 0);
                  const isWinner = winner && nominee._id === winner._id;
                  
                  return (
                    <div key={nominee._id} style={styles.candidateCard}>
                      {/* Rank Badge */}
                      <Badge 
                        bg={index === 0 ? 'warning' : 'secondary'} 
                        style={styles.rankBadge}
                      >
                        #{index + 1}
                      </Badge>
                      
                      {/* Candidate Info */}
                      <div style={styles.candidateHeader}>
                        <div style={styles.candidateName}>
                          {nominee.name}
                          {isWinner && (
                            <Badge bg="success" className="ms-2">
                              Winner 🏆
                            </Badge>
                          )}
                        </div>
                        <div style={styles.voteStats}>
                          <span style={styles.voteCount}>
                            {nominee.voteCount || 0} votes
                          </span>
                          <span style={styles.votePercentage}>
                            {percentage}%
                          </span>
                        </div>
                      </div>
                      
                      {/* Bar Chart */}
                      <div style={styles.barChart}>
                        <div style={styles.barContainer}>
                          <div 
                            style={{
                              ...styles.bar,
                              width: `${Math.max(percentage, 5)}%`,
                              background: isWinner 
                                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                                : index === 0 
                                  ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                                  : index === 1
                                    ? 'linear-gradient(90deg, #8b5cf6 0%, #7c3aed 100%)'
                                    : 'linear-gradient(90deg, #6b7280 0%, #4b5563 100%)'
                            }}
                          >
                            {percentage > 10 && `${percentage}%`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card.Body>
        </Card>

        {/* Election Information */}
        <Card style={styles.infoCard}>
          <Card.Header className="bg-white border-0 p-4">
            <h5 style={{margin: 0, color: '#1f2937'}}>Election Information</h5>
          </Card.Header>
          <Card.Body className="p-4">
            <Row>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Election Period:</strong>
                  <div className="text-muted">
                    {formatDateTime(election.startDate)} - {formatDateTime(election.endDate)}
                  </div>
                </div>
                <div className="mb-3">
                  <strong>Created:</strong>
                  <span className="text-muted ms-2">
                    {formatDateTime(election.createdAt)}
                  </span>
                </div>
              </Col>
              <Col md={6}>
                <div className="mb-3">
                  <strong>Total Candidates:</strong>
                  <span className="text-muted ms-2">
                    {election.nominees?.length || 0}
                  </span>
                </div>
                <div className="mb-3">
                  <strong>Voting Progress:</strong>
                  <span className="text-muted ms-2">
                    {election.votedCount}/{election.totalVoters} voters ({getTurnoutPercentage()}%)
                  </span>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default ResultsPage;