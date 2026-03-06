import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, Row, Col, Spinner, Badge, ProgressBar } from 'react-bootstrap';
import { electionAPI } from '../services/api';

const Dashboard = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingElection, setDeletingElection] = useState(null);
  const [sendingResults, setSendingResults] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchElections();

    // Set up timer for real-time updates every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Auto-refresh elections data every 5 seconds to show voting progress
    const refreshTimer = setInterval(() => {
      fetchElections();
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(refreshTimer);
    };
  }, []);

  const fetchElections = async () => {
    try {
      const response = await electionAPI.getMyElections();
      setElections(response.data.elections);
      setError(''); // Clear any previous errors on successful fetch
    } catch (error) {
      setError('Failed to load elections');
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const handleRefresh = async () => {
    setLoading(true);
    await fetchElections();
  };

  const handleDeleteElection = async (electionId) => {
    if (!window.confirm('Are you sure you want to delete this election? This action cannot be undone.')) {
      return;
    }

    setDeletingElection(electionId);
    try {
      await electionAPI.deleteElection(electionId);
      setElections(elections.filter(election => election._id !== electionId));
    } catch (error) {
      setError('Failed to delete election');
    } finally {
      setDeletingElection(null);
    }
  };

  const handleSendResults = async (electionId) => {
    if (!window.confirm('Send election results to all voters via email?')) {
      return;
    }

    setSendingResults(electionId);
    try {
      await electionAPI.sendResults(electionId);
      alert('Election results sent successfully to all voters!');
    } catch (error) {
      setError('Failed to send election results');
    } finally {
      setSendingResults(null);
    }
  };

  // Helper function to get status based on current time
  const getElectionStatus = (election) => {
    const now = currentTime;
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);

    if (election.status === 'closed') {
      return { status: 'closed', text: 'Closed', variant: 'secondary' };
    }

    if (now < startDate) {
      return { status: 'not-started', text: 'Not Started', variant: 'warning' };
    } else if (now > endDate) {
      return { status: 'expired', text: 'Expired', variant: 'danger' };
    } else {
      return { status: 'active', text: 'Active', variant: 'success' };
    }
  };

  // Helper function to format time remaining
  const getTimeRemaining = (election) => {
    const now = currentTime;
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);

    if (now < startDate) {
      const timeUntilStart = startDate - now;
      return formatTimeRemaining(timeUntilStart, 'Starts in');
    } else if (now < endDate) {
      const timeUntilEnd = endDate - now;
      return formatTimeRemaining(timeUntilEnd, 'Ends in');
    } else {
      return 'Election has ended';
    }
  };

  // Helper function to format milliseconds to readable time
  const formatTimeRemaining = (milliseconds, prefix) => {
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);

    if (totalDays > 0) {
      const remainingHours = totalHours % 24;
      return `${prefix} ${totalDays}d ${remainingHours}h`;
    } else if (totalHours > 0) {
      const remainingMinutes = totalMinutes % 60;
      return `${prefix} ${totalHours}h ${remainingMinutes}m`;
    } else if (totalMinutes > 0) {
      return `${prefix} ${totalMinutes}m`;
    } else {
      return `${prefix} < 1m`;
    }
  };

  // Helper function to format date/time for display
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  // Calculate statistics
  const getStats = () => {
    const stats = {
      total: elections.length,
      active: 0,
      expired: 0,
      upcoming: 0
    };

    elections.forEach(election => {
      const { status } = getElectionStatus(election);
      if (status === 'active') stats.active++;
      else if (status === 'expired' || status === 'closed') stats.expired++;
      else if (status === 'not-started') stats.upcoming++;
    });

    return stats;
  };

  const stats = getStats();

  // Professional styling
  const styles = {
    dashboardContainer: {
      padding: '1.25rem',
      minHeight: 'calc(100vh - 80px)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      backgroundColor: '#f8fafc',
      color: '#1e293b'
    },
    headerSection: {
      marginBottom: '1.25rem',
      padding: '1.25rem 2rem',
      borderRadius: '0.75rem',
      background: 'rgba(17, 52, 149, 1)',
      boxShadow: '0 4px 20px rgba(17, 52, 149, 0.3)'
    },
    headerTitle: {
      color: '#ffffff',
      fontWeight: '700',
      fontSize: '1.5rem',
      marginBottom: '0.25rem',
      letterSpacing: '-0.025em'
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.75)',
      fontSize: '0.875rem',
      fontWeight: '400',
      margin: '0'
    },
    createBtn: {
      padding: '0.75rem 1.5rem',
      fontWeight: '600',
      borderRadius: '0.375rem',
      border: 'none',
      fontSize: '0.875rem',
      backgroundColor: '#1d4ed8',
      color: 'white',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      cursor: 'pointer',
      textDecoration: 'none'
    },
    loadingSpinner: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '60vh',
      gap: '1rem'
    },
    loadingText: {
      color: '#64748b',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    emptyStateCard: {
      border: '1px solid #e2e8f0',
      borderRadius: '0.5rem',
      backgroundColor: 'white',
      textAlign: 'center',
      padding: '3rem 2rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    },
    emptyIcon: {
      fontSize: '3rem',
      marginBottom: '1rem',
      opacity: '0.6'
    },
    emptyTitle: {
      color: '#0f172a',
      marginBottom: '0.5rem',
      fontSize: '1.25rem',
      fontWeight: '600'
    },
    emptyText: {
      color: '#64748b',
      marginBottom: '2rem',
      fontSize: '0.875rem',
      lineHeight: '1.6'
    },
    electionsHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem'
    },
    electionsTitle: {
      color: '#0f172a',
      fontWeight: '600',
      fontSize: '1.25rem',
      margin: '0'
    },
    electionsCount: {
      color: '#64748b',
      fontSize: '0.875rem',
      fontWeight: '500'
    },
    electionCard: {
      border: '1px solid #e2e8f0',
      borderRadius: '1rem',
      backgroundColor: 'white',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      height: '100%',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      overflow: 'hidden',
      cursor: 'default',
      position: 'relative'
    },
    electionCardHeader: {
      borderBottom: '1px solid #e2e8f0',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      padding: '1rem 1.25rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '1rem',
      position: 'relative'
    },
    electionTitle: {
      color: '#0f172a',
      fontWeight: '600',
      margin: '0',
      fontSize: '1rem',
      lineHeight: '1.5',
      flex: '1'
    },
    electionCardBody: {
      padding: '1.25rem'
    },
    electionDescription: {
      color: '#64748b',
      marginBottom: '1rem',
      lineHeight: '1.6',
      fontSize: '0.875rem'
    },
    scheduleInfo: {
      backgroundColor: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '0.375rem',
      padding: '0.75rem',
      marginBottom: '1rem',
      fontSize: '0.75rem'
    },
    scheduleTitle: {
      fontWeight: '600',
      color: '#0369a1',
      marginBottom: '0.25rem'
    },
    scheduleTime: {
      color: '#0369a1',
      margin: '0.125rem 0'
    },
    timeRemaining: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: '500',
      marginTop: '0.5rem'
    },
    electionStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem',
      marginBottom: '1.5rem'
    },
    statItem: {
      padding: '1rem',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: '0.75rem',
      border: '1px solid #e2e8f0',
      textAlign: 'center',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
    },
    statNumber: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#0f172a',
      lineHeight: '1.2',
      display: 'block'
    },
    statLabel: {
      fontSize: '0.75rem',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginTop: '0.25rem',
      fontWeight: '600'
    },
    statSubtext: {
      fontSize: '0.75rem',
      color: '#94a3b8',
      marginTop: '0.25rem'
    },
    electionActions: {
      display: 'flex',
      gap: '0.5rem',
      flexWrap: 'wrap'
    },
    actionBtn: {
      borderRadius: '0.375rem',
      fontWeight: '600',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      padding: '0.5rem 0.75rem',
      fontSize: '0.75rem',
      border: '1px solid #d1d5db',
      backgroundColor: 'white',
      color: '#374151',
      flex: '1',
      minWidth: 'fit-content',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.375rem',
      cursor: 'pointer',
      textDecoration: 'none',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    },
    copyBtn: {
      borderColor: '#2563eb',
      color: '#2563eb'
    },
    resultsBtn: {
      borderColor: '#059669',
      color: '#059669'
    },
    deleteBtn: {
      borderColor: '#dc2626',
      color: '#dc2626',
      backgroundColor: '#fef2f2'
    },
    alertStyle: {
      borderRadius: '0.375rem',
      fontWeight: '500',
      margin: '0 0 2rem 0',
      border: '1px solid #fecaca',
      backgroundColor: '#fef2f2',
      color: '#dc2626'
    },
    createNewSection: {
      textAlign: 'center',
      marginTop: '2rem',
      paddingTop: '2rem',
      borderTop: '1px solid #e2e8f0'
    },
    statsRow: {
      marginBottom: '1.5rem',
      marginTop: '-0.5rem'
    },
    statCard: {
      backgroundColor: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '0.75rem',
      padding: '1rem',
      textAlign: 'center',
      transition: 'all 0.3s ease',
      height: '100%',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
    },
    statIcon: {
      fontSize: '1.25rem',
      marginBottom: '0.5rem',
      display: 'block'
    },
    statValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
      color: '#0f172a',
      lineHeight: '1',
      marginBottom: '0.25rem'
    },
    statDesc: {
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.01em'
    }
  };

  if (loading) {
    return (
      <div style={styles.dashboardContainer}>
        <div style={styles.loadingSpinner}>
          <Spinner animation="border" style={{ color: '#2563eb' }} role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p style={styles.loadingText}>Loading your elections...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.dashboardContainer}>
      {/* Add CSS for hover effects */}
      <style>{`
        .create-btn:hover {
          background-color: #1e40af !important;
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
        }
        
        .create-btn:active {
          transform: translateY(0);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
        
        .election-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          border-color: #cbd5e1 !important;
        }
        
        .action-btn-copy:hover {
          background-color: #eff6ff !important;
          border-color: #1d4ed8 !important;
          color: #1e40af !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1) !important;
        }
        
        .action-btn-results:hover {
          background-color: #ecfdf5 !important;
          border-color: #047857 !important;
          color: #065f46 !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(5, 150, 105, 0.2), 0 2px 4px -1px rgba(5, 150, 105, 0.1) !important;
        }
        
        .action-btn-send-results:hover {
          background-color: #eff6ff !important;
          border-color: #0369a1 !important;
          color: #0c4a6e !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(3, 105, 161, 0.2), 0 2px 4px -1px rgba(3, 105, 161, 0.1) !important;
        }
        
        .action-btn-delete:hover {
          background-color: #fee2e2 !important;
          border-color: #b91c1c !important;
          color: #991b1b !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(220, 38, 38, 0.2), 0 2px 4px -1px rgba(220, 38, 38, 0.1) !important;
        }
        
        .action-btn-copy:active,
        .action-btn-results:active,
        .action-btn-send-results:active,
        .action-btn-delete:active {
          transform: translateY(0) !important;
        }
        
        .stat-item:hover {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          transform: translateY(-1px);
        }
        
        .empty-state-card:hover {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          border-color: #cbd5e1 !important;
        }
        
        /* Focus states for accessibility */
        .create-btn:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        .action-btn-copy:focus {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
        
        .action-btn-results:focus {
          outline: 2px solid #10b981;
          outline-offset: 2px;
        }
        
        .action-btn-send-results:focus {
          outline: 2px solid #0ea5e9;
          outline-offset: 2px;
        }
        
        .action-btn-delete:focus {
          outline: 2px solid #ef4444;
          outline-offset: 2px;
        }
        
        /* Smooth transitions for all interactive elements */
        .create-btn, .election-card, .action-btn-copy, .action-btn-results, .action-btn-send-results, .action-btn-delete, .stat-item, .empty-state-card {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>

      {/* Header Section */}
      <div style={styles.headerSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={styles.headerTitle}>Dashboard</h1>
            <p style={styles.subtitle}>Welcome back, {user.name}. Manage your elections and monitor voting activity.</p>
          </div>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                Refreshing...
              </>
            ) : (
              <>
                🔄
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Section */}
      <Row style={styles.statsRow}>
        <Col md={3} className="mb-3 mb-md-0">
          <div style={styles.statCard}>
            <span style={styles.statIcon}>📊</span>
            <div style={styles.statValue}>{stats.total}</div>
            <div style={styles.statDesc}>Total Elections</div>
          </div>
        </Col>
        <Col md={3} className="mb-3 mb-md-0">
          <div style={styles.statCard}>
            <span style={styles.statIcon}>🟢</span>
            <div style={styles.statValue}>{stats.active}</div>
            <div style={styles.statDesc}>Active</div>
          </div>
        </Col>
        <Col md={3} className="mb-3 mb-md-0">
          <div style={styles.statCard}>
            <span style={styles.statIcon}>🔴</span>
            <div style={styles.statValue}>{stats.expired}</div>
            <div style={styles.statDesc}>Expired</div>
          </div>
        </Col>
        <Col md={3}>
          <div style={styles.statCard}>
            <span style={styles.statIcon}>🟡</span>
            <div style={styles.statValue}>{stats.upcoming}</div>
            <div style={styles.statDesc}>Upcoming</div>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" style={styles.alertStyle} dismissible onClose={() => setError('')}>
          Failed to load elections. Please try refreshing the page.
        </Alert>
      )}

      {elections.length === 0 ? (
        <Card style={{ ...styles.emptyStateCard }} className="empty-state-card">
          <Card.Body>
            <div style={styles.emptyIcon}>🗳️</div>
            <h3 style={styles.emptyTitle}>No Elections Created</h3>
            <p style={styles.emptyText}>
              Get started by creating your first election. Set up secure online voting with customizable options and real-time results tracking.
            </p>
            <Button href="/create-election" style={styles.createBtn} className="create-btn">
              Create Election
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          <div style={styles.electionsHeader}>
            <h2 style={styles.electionsTitle}>Elections</h2>
            <span style={styles.electionsCount}>
              {elections.length} {elections.length === 1 ? 'election' : 'elections'}
            </span>
          </div>

          <Row>
            {elections.map((election) => {
              const statusInfo = getElectionStatus(election);
              const timeRemaining = getTimeRemaining(election);

              return (
                <Col lg={6} xl={4} key={election._id} style={{ marginBottom: '1.5rem' }}>
                  <Card style={styles.electionCard} className="election-card">
                    <Card.Header style={styles.electionCardHeader}>
                      <h4 style={styles.electionTitle}>{election.title}</h4>
                      <Badge
                        bg={statusInfo.variant}
                        style={{
                          fontSize: '0.75rem',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontWeight: '500'
                        }}
                      >
                        {statusInfo.text}
                      </Badge>
                    </Card.Header>
                    <Card.Body style={styles.electionCardBody}>
                      <p style={styles.electionDescription}>{election.description}</p>

                      {/* Election Schedule Information */}
                      <div style={styles.scheduleInfo}>
                        <div style={styles.scheduleTitle}>📅 Election Schedule</div>
                        <div style={styles.scheduleTime}>
                          <strong>Start:</strong> {formatDateTime(election.startDate)}
                        </div>
                        <div style={styles.scheduleTime}>
                          <strong>End:</strong> {formatDateTime(election.endDate)}
                        </div>
                        <div style={styles.timeRemaining}>
                          ⏰ {timeRemaining}
                        </div>
                      </div>

                      <div style={styles.electionStats}>
                        <div style={styles.statItem} className="stat-item">
                          <span style={styles.statNumber}>{election.nominees.length}</span>
                          <div style={styles.statLabel}>Candidates</div>
                        </div>
                        <div style={styles.statItem} className="stat-item">
                          <span style={styles.statNumber}>{election.votedCount || 0}/{election.votersCount || 0}</span>
                          <div style={styles.statLabel}>Voted</div>
                          <div style={styles.statSubtext}>
                            {election.votersCount > 0
                              ? `${Math.round(((election.votedCount || 0) / election.votersCount) * 100)}% turnout`
                              : '0% turnout'
                            }
                          </div>
                        </div>
                      </div>

                      {/* Voting Progress Bar */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b' }}>
                            📊 Voting Progress
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {election.votedCount || 0} of {election.votersCount || 0} votes cast
                          </span>
                        </div>
                        <ProgressBar
                          now={election.votersCount > 0 ? ((election.votedCount || 0) / election.votersCount) * 100 : 0}
                          variant={
                            election.votersCount > 0 && ((election.votedCount || 0) / election.votersCount) > 0.7
                              ? 'success'
                              : ((election.votedCount || 0) / election.votersCount) > 0.3
                                ? 'warning'
                                : 'info'
                          }
                          style={{ height: '8px', borderRadius: '4px' }}
                        />
                      </div>

                      <div style={styles.electionActions}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          style={{ ...styles.actionBtn, ...styles.copyBtn }}
                          className="action-btn-copy"
                          onClick={() => {
                            // Ensure we always have the full URL
                            const fullUrl = election.votingUrl.includes('http')
                              ? election.votingUrl
                              : `${window.location.origin}/vote/${election.votingUrl}`;
                            navigator.clipboard.writeText(fullUrl);
                            alert('Voting URL copied to clipboard');
                          }}
                        >
                          Copy Link
                        </Button>
                        <Button
                          href={`/results/${election._id}`}
                          variant="outline-success"
                          size="sm"
                          style={{ ...styles.actionBtn, ...styles.resultsBtn }}
                          className="action-btn-results"
                        >
                          View Results
                        </Button>
                        {(election.currentStatus === 'expired' || election.status === 'expired' ||
                          election.currentStatus === 'ended' || election.status === 'ended' ||
                          (election.endDate && new Date(election.endDate) < currentTime)) && (
                            <Button
                              variant="outline-info"
                              size="sm"
                              style={{ ...styles.actionBtn, ...styles.resultsBtn }}
                              className="action-btn-send-results"
                              onClick={() => handleSendResults(election._id)}
                              disabled={sendingResults === election._id}
                            >
                              {sendingResults === election._id ? (
                                <>
                                  <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                  />
                                  Sending...
                                </>
                              ) : (
                                '📧 Send Results'
                              )}
                            </Button>
                          )}
                        <Button
                          variant="outline-danger"
                          size="sm"
                          style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                          className="action-btn-delete"
                          onClick={() => handleDeleteElection(election._id)}
                          disabled={deletingElection === election._id}
                        >
                          {deletingElection === election._id ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                              />
                              Deleting...
                            </>
                          ) : (
                            'Delete'
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          <div style={styles.createNewSection}>
            <Button href="/create-election" style={styles.createBtn} className="create-btn">
              Create New Election
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;