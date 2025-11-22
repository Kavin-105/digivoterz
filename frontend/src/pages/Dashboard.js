import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, Row, Col, Spinner, Badge, ProgressBar, Container, Dropdown, Form } from 'react-bootstrap';
import { electionAPI } from '../services/api';

const Dashboard = () => {
  const [elections, setElections] = useState([]);
  const [filteredElections, setFilteredElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingElection, setDeletingElection] = useState(null);
  const [sendingResults, setSendingResults] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchElections();
    
    // Set up timer for real-time updates every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Auto-refresh elections data every 30 seconds
    const refreshTimer = setInterval(() => {
      fetchElections();
    }, 30000);
    
    return () => {
      clearInterval(timer);
      clearInterval(refreshTimer);
    };
  }, []);

  // Filter elections when elections, dateFilter, or statusFilter changes
  useEffect(() => {
    filterElections();
  }, [elections, dateFilter, statusFilter]);

  const fetchElections = async () => {
    try {
      const response = await electionAPI.getMyElections();
      setElections(response.data.elections);
      setError('');
    } catch (error) {
      setError('Failed to load elections');
      console.error('Error fetching elections:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterElections = () => {
    let filtered = elections;

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      
      switch (dateFilter) {
        case 'this-month':
          filtered = filtered.filter(election => {
            const electionDate = new Date(election.startDate);
            return electionDate.getMonth() === now.getMonth() && 
                   electionDate.getFullYear() === now.getFullYear();
          });
          break;
        case 'last-month':
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          filtered = filtered.filter(election => {
            const electionDate = new Date(election.startDate);
            return electionDate.getMonth() === lastMonth.getMonth() && 
                   electionDate.getFullYear() === lastMonth.getFullYear();
          });
          break;
        case 'next-month':
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          filtered = filtered.filter(election => {
            const electionDate = new Date(election.startDate);
            return electionDate.getMonth() === nextMonth.getMonth() && 
                   electionDate.getFullYear() === nextMonth.getFullYear();
          });
          break;
        case 'last-3-months':
          const last3Months = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          filtered = filtered.filter(election => {
            const electionDate = new Date(election.startDate);
            return electionDate >= last3Months && electionDate < now;
          });
          break;
        case 'next-3-months':
          const next3Months = new Date(now.getFullYear(), now.getMonth() + 3, 31);
          filtered = filtered.filter(election => {
            const electionDate = new Date(election.startDate);
            return electionDate > now && electionDate <= next3Months;
          });
          break;
        case 'this-year':
          filtered = filtered.filter(election => {
            const electionDate = new Date(election.startDate);
            return electionDate.getFullYear() === now.getFullYear();
          });
          break;
        case 'next-year':
          filtered = filtered.filter(election => {
            const electionDate = new Date(election.startDate);
            return electionDate.getFullYear() === now.getFullYear() + 1;
          });
          break;
      }
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(election => {
        const statusInfo = getElectionStatus(election);
        return statusInfo.status === statusFilter;
      });
    }

    setFilteredElections(filtered);
  };

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
      console.error('Error deleting election:', error);
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
      console.error('Error sending results:', error);
    } finally {
      setSendingResults(null);
    }
  };

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

  const getDateFilterDisplayName = () => {
    const filterNames = {
      'all': 'All Elections',
      'this-month': 'This Month',
      'last-month': 'Last Month',
      'next-month': 'Next Month',
      'last-3-months': 'Last 3 Months',
      'next-3-months': 'Next 3 Months',
      'this-year': 'This Year',
      'next-year': 'Next Year'
    };
    return filterNames[dateFilter] || 'All Elections';
  };

  const getStatusFilterDisplayName = () => {
    const filterNames = {
      'all': 'All Status',
      'active': 'Active',
      'not-started': 'Not Started',
      'expired': 'Ended',
      'closed': 'Closed'
    };
    return filterNames[statusFilter] || 'All Status';
  };

  // Calculate dashboard statistics based on filtered elections
  const totalElections = filteredElections.length;
  const activeElections = filteredElections.filter(e => getElectionStatus(e).status === 'active').length;
  const totalVotes = filteredElections.reduce((sum, e) => sum + (e.votedCount || 0), 0);
  const totalVoters = filteredElections.reduce((sum, e) => sum + (e.votersCount || 0), 0);

  const styles = {
    dashboardContainer: {
      padding: '2rem',
      minHeight: 'calc(100vh - 80px)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      backgroundColor: '#f8fafc',
      color: '#1e293b'
    },
    headerSection: {
      marginBottom: '2rem',
      paddingBottom: '1.5rem',
      borderBottom: '1px solid #e2e8f0'
    },
    headerTitle: {
      color: '#0f172a',
      fontWeight: '600',
      fontSize: '2rem',
      marginBottom: '0.5rem',
      letterSpacing: '-0.025em'
    },
    subtitle: {
      color: '#64748b',
      fontSize: '1.125rem',
      fontWeight: '400',
      margin: '0'
    },
    statsCard: {
      border: '1px solid #e2e8f0',
      borderRadius: '1rem',
      backgroundColor: 'white',
      padding: '1.5rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      height: '100%'
    },
    statsIcon: {
      width: '3.5rem',
      height: '3.5rem',
      borderRadius: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.5rem'
    },
    statsNumber: {
      fontSize: '2.25rem',
      fontWeight: '700',
      color: '#0f172a',
      marginBottom: '0.5rem',
      lineHeight: '1'
    },
    statsLabel: {
      color: '#64748b',
      fontSize: '1rem',
      fontWeight: '500'
    },
    electionCard: {
      border: '1px solid #e2e8f0',
      borderRadius: '0.75rem',
      backgroundColor: 'white',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      height: '100%',
      boxShadow: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
      overflow: 'hidden',
      cursor: 'default'
    },
    electionCardHeader: {
      borderBottom: '1px solid #e2e8f0',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      padding: '1rem 1rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '0.75rem'
    },
    electionTitle: {
      color: '#0f172a',
      fontWeight: '600',
      margin: '0',
      fontSize: '1rem',
      lineHeight: '1.4',
      flex: '1'
    },
    electionCardBody: {
      padding: '1rem'
    },
    electionDescription: {
      color: '#64748b',
      marginBottom: '1rem',
      lineHeight: '1.5',
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
      marginBottom: '0.375rem',
      fontSize: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.375rem'
    },
    scheduleTime: {
      color: '#0369a1',
      margin: '0.125rem 0',
      fontSize: '0.75rem'
    },
    timeRemaining: {
      backgroundColor: '#fef3c7',
      color: '#92400e',
      padding: '0.25rem 0.5rem',
      borderRadius: '0.25rem',
      fontSize: '0.75rem',
      fontWeight: '500',
      marginTop: '0.5rem',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem'
    },
    electionStats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '0.75rem',
      marginBottom: '1rem'
    },
    statItem: {
      padding: '1rem',
      background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
      borderRadius: '0.5rem',
      border: '1px solid #e2e8f0',
      textAlign: 'center',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'default',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
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
    progressSection: {
      marginBottom: '1rem'
    },
    progressLabel: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#64748b'
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
    filterSection: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      padding: '1rem',
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      border: '1px solid #e2e8f0',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    filterTitle: {
      color: '#0f172a',
      fontWeight: '600',
      fontSize: '1.125rem',
      margin: '0'
    },
    filterCount: {
      color: '#64748b',
      fontSize: '0.875rem',
      fontWeight: '500',
      marginLeft: '1rem'
    },
    filterControls: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap'
    }
  };

  if (loading) {
    return (
      <div style={styles.dashboardContainer}>
        <div className="d-flex justify-content-center align-items-center" style={{minHeight: '60vh'}}>
          <div className="text-center">
            <Spinner animation="border" style={{ color: '#2563eb', width: '3rem', height: '3rem' }} role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
            <p className="mt-3" style={{color: '#64748b', fontSize: '1rem', fontWeight: '500'}}>Loading your elections...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.dashboardContainer}>
      <style>{`
        .election-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          border-color: #cbd5e1 !important;
        }
        
        .stat-item:hover {
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%) !important;
          border-color: #cbd5e1 !important;
          transform: translateY(-2px);
        }
        
        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -8px rgba(0, 0, 0, 0.3) !important;
        }
      `}</style>

      {/* Header Section */}
      <div style={styles.headerSection}>
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 style={styles.headerTitle}>Dashboard</h1>
            <p style={styles.subtitle}>Welcome back, {user.name}. Manage your elections and monitor voting activity.</p>
          </div>
          <div className="d-flex gap-3">
            <Button 
              variant="outline-primary" 
              onClick={handleRefresh}
              disabled={loading}
              className="d-flex align-items-center gap-2"
              style={{fontSize: '0.875rem'}}
            >
              <Spinner
                as="span"
                animation="border"
                size="sm"
                className={loading ? '' : 'd-none'}
              />
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </Button>
            <Button 
              variant="primary"
              href="/create-election"
              className="d-flex align-items-center gap-2"
              style={{fontSize: '0.875rem'}}
            >
              ➕ Create Election
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col lg={3} md={6} className="mb-3">
          <div style={styles.statsCard}>
            <div className="d-flex align-items-center gap-3">
              <div style={{...styles.statsIcon, backgroundColor: '#e7f1ff', color: '#0d6efd'}}>
                🗳️
              </div>
              <div>
                <div style={styles.statsNumber}>{totalElections}</div>
                <div style={styles.statsLabel}>Total Elections</div>
              </div>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <div style={styles.statsCard}>
            <div className="d-flex align-items-center gap-3">
              <div style={{...styles.statsIcon, backgroundColor: '#e6fffa', color: '#198754'}}>
                📈
              </div>
              <div>
                <div style={styles.statsNumber}>{activeElections}</div>
                <div style={styles.statsLabel}>Active Elections</div>
              </div>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <div style={styles.statsCard}>
            <div className="d-flex align-items-center gap-3">
              <div style={{...styles.statsIcon, backgroundColor: '#f3e8ff', color: '#7c3aed'}}>
                👥
              </div>
              <div>
                <div style={styles.statsNumber}>{totalVotes}</div>
                <div style={styles.statsLabel}>Total Votes Cast</div>
              </div>
            </div>
          </div>
        </Col>
        <Col lg={3} md={6} className="mb-3">
          <div style={styles.statsCard}>
            <div className="d-flex align-items-center gap-3">
              <div style={{...styles.statsIcon, backgroundColor: '#fff4e6', color: '#fd7e14'}}>
                📊
              </div>
              <div>
                <div style={styles.statsNumber}>
                  {totalVoters > 0 ? Math.round((totalVotes / totalVoters) * 100) : 0}%
                </div>
                <div style={styles.statsLabel}>Average Turnout</div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')} className="mb-4">
          {error}
        </Alert>
      )}

      {/* Filter Section */}
      <div style={styles.filterSection}>
        <div className="d-flex align-items-center">
          <h2 style={styles.filterTitle}>Elections</h2>
          <span style={styles.filterCount}>
            ({filteredElections.length} {(dateFilter !== 'all' || statusFilter !== 'all') ? 'filtered' : 'total'})
          </span>
        </div>
        <div style={styles.filterControls}>
          {/* Date Filter */}
          <Dropdown>
            <Dropdown.Toggle variant="outline-primary" size="sm" className="d-flex align-items-center gap-2">
              📅 {getDateFilterDisplayName()}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setDateFilter('all')} active={dateFilter === 'all'}>
                All Elections
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setDateFilter('this-month')} active={dateFilter === 'this-month'}>
                This Month
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setDateFilter('last-month')} active={dateFilter === 'last-month'}>
                Last Month
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setDateFilter('next-month')} active={dateFilter === 'next-month'}>
                Next Month
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setDateFilter('last-3-months')} active={dateFilter === 'last-3-months'}>
                Last 3 Months
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setDateFilter('next-3-months')} active={dateFilter === 'next-3-months'}>
                Next 3 Months
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setDateFilter('this-year')} active={dateFilter === 'this-year'}>
                This Year
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setDateFilter('next-year')} active={dateFilter === 'next-year'}>
                Next Year
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          {/* Status Filter */}
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm" className="d-flex align-items-center gap-2">
              🔄 {getStatusFilterDisplayName()}
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={() => setStatusFilter('all')} active={statusFilter === 'all'}>
                All Status
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={() => setStatusFilter('active')} active={statusFilter === 'active'}>
                Active
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter('not-started')} active={statusFilter === 'not-started'}>
                Not Started
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter('expired')} active={statusFilter === 'expired'}>
                Ended
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setStatusFilter('closed')} active={statusFilter === 'closed'}>
                Closed
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>

      {/* Elections */}
      {filteredElections.length === 0 ? (
        <Card className="text-center" style={{padding: '4rem 2rem', border: '1px solid #e2e8f0', borderRadius: '1rem'}}>
          <Card.Body>
            <div style={{fontSize: '4rem', marginBottom: '1rem', opacity: '0.6'}}>
              {dateFilter === 'all' ? '🗳️' : '📅'}
            </div>
            <h3 style={{color: '#0f172a', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '600'}}>
              {dateFilter === 'all' ? 'No Elections Created' : 'No Elections Found'}
            </h3>
            <p style={{color: '#64748b', marginBottom: '2rem', fontSize: '1rem', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto 2rem'}}>
              {(dateFilter === 'all' && statusFilter === 'all')
                ? 'Get started by creating your first election. Set up secure online voting with customizable options and real-time results tracking.'
                : `No elections found for the selected filters: ${getDateFilterDisplayName()}, ${getStatusFilterDisplayName()}. Try adjusting your filters.`
              }
            </p>
            {(dateFilter === 'all' && statusFilter === 'all') && (
              <Button variant="primary" href="/create-election" size="lg">
                Create Election
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row>
            {filteredElections.map((election) => {
              const statusInfo = getElectionStatus(election);
              const timeRemaining = getTimeRemaining(election);
              
              return (
                <Col lg={4} md={6} key={election._id} className="mb-3">
                  <Card style={styles.electionCard} className="election-card">
                    <Card.Header style={styles.electionCardHeader}>
                      <h4 style={styles.electionTitle}>{election.title}</h4>
                      <Badge 
                        bg={statusInfo.variant} 
                        style={{
                          fontSize: '0.875rem',
                          padding: '0.5rem 0.75rem',
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
                        <div style={styles.scheduleTitle}>
                          📅 Election Schedule
                        </div>
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
                          <span style={styles.statNumber}>{election.nominees?.length || 0}</span>
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
                      <div style={styles.progressSection}>
                        <div style={styles.progressLabel}>
                          📊 Voting Progress
                          <span>
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
                          style={{height: '10px', borderRadius: '5px'}}
                        />
                      </div>
                      
                      <div style={styles.electionActions}>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          style={styles.actionBtn}
                          className="action-btn"
                          onClick={() => {
                            const fullUrl = election.votingUrl?.includes('http') 
                              ? election.votingUrl 
                              : `${window.location.origin}/vote/${election.votingUrl}`;
                            navigator.clipboard.writeText(fullUrl);
                            alert('Voting URL copied to clipboard');
                          }}
                        >
                          📋 Copy Link
                        </Button>
                        <Button 
                          href={`/results/${election._id}`}
                          variant="outline-success" 
                          size="sm"
                          style={styles.actionBtn}
                          className="action-btn"
                        >
                          📊 View Results
                        </Button>
                        {(statusInfo.status === 'expired' || 
                          (election.endDate && new Date(election.endDate) < currentTime)) && (
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            style={styles.actionBtn}
                            className="action-btn"
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
                          style={styles.actionBtn}
                          className="action-btn"
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
                            '🗑️ Delete'
                          )}
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
          
         
        </>
      )}
    </div>
  );
};

export default Dashboard;