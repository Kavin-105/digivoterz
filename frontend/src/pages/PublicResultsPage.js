import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Alert, Row, Col, ProgressBar, Badge } from 'react-bootstrap';
import { electionAPI } from '../services/api';

const PublicResultsPage = () => {
  const { votingUrl } = useParams();
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResults();
  }, [votingUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchResults = async () => {
    try {
      const response = await electionAPI.getPublicResults(votingUrl);
      setElection(response.data.election);
    } catch (error) {
      console.error('Failed to fetch results:', error);
      setError('Failed to load election results');
    } finally {
      setLoading(false);
    }
  };

  const getWinner = () => {
    if (!election?.nominees.length) return null;
    
    const maxVotes = Math.max(...election.nominees.map(n => n.voteCount));
    const winners = election.nominees.filter(n => n.voteCount === maxVotes);
    
    return winners.length === 1 ? winners[0] : null;
  };

  const getVotePercentage = (voteCount) => {
    if (!election?.votedCount || election.votedCount === 0) return 0;
    return Math.round((voteCount / election.votedCount) * 100);
  };

  const getTurnoutPercentage = () => {
    if (!election?.totalVoters || election.totalVoters === 0) return 0;
    return Math.round((election.votedCount / election.totalVoters) * 100);
  };

  if (loading) {
    return (
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Body className="text-center">
              <div>Loading election results...</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  }

  if (error) {
    return (
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Body className="text-center">
              <Alert variant="danger">{error}</Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    );
  }

  const winner = getWinner();
  const sortedNominees = [...election.nominees].sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div className="container mt-4">
      <Row className="justify-content-center">
        <Col md={10}>
          {/* Election Header */}
          <Card className="mb-4">
            <Card.Header>
              <Row className="align-items-center">
                <Col>
                  <h2>{election.title}</h2>
                  <p className="text-muted mb-0">{election.description}</p>
                </Col>
                <Col xs="auto">
                  <Badge bg="success" className="fs-6">
                    Live Results
                  </Badge>
                </Col>
              </Row>
            </Card.Header>
          </Card>

          {/* Winner Announcement */}
          {winner && election.votedCount > 0 && (
            <Alert variant="success" className="mb-4">
              <Alert.Heading>🏆 Current Leader</Alert.Heading>
              <h4>{winner.name}</h4>
              <p>
                Leading with <strong>{winner.voteCount}</strong> votes 
                ({getVotePercentage(winner.voteCount)}% of total votes)
              </p>
            </Alert>
          )}

          {/* Voting Statistics */}
          <Row className="mb-4">
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className="text-primary">{election.votedCount}</h5>
                  <p className="mb-0">Total Votes Cast</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className="text-info">{election.totalVoters}</h5>
                  <p className="mb-0">Eligible Voters</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className="text-success">{getTurnoutPercentage()}%</h5>
                  <p className="mb-0">Voter Turnout</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Results */}
          <Card>
            <Card.Header>
              <h5>Current Results</h5>
            </Card.Header>
            <Card.Body>
              {election.votedCount === 0 ? (
                <Alert variant="info">
                  <h6>No votes cast yet</h6>
                  <p>Results will appear here once voting begins.</p>
                </Alert>
              ) : (
                <div>
                  {sortedNominees.map((nominee, index) => {
                    const percentage = getVotePercentage(nominee.voteCount);
                    const isWinner = winner && nominee._id === winner._id;
                    
                    return (
                      <div key={nominee._id} className="mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <h6 className="mb-0">
                              {index + 1}. {nominee.name}
                              {isWinner && <Badge bg="warning" className="ms-2">Leading</Badge>}
                            </h6>
                          </div>
                          <div className="text-end">
                            <strong>{nominee.voteCount} votes</strong>
                            <br />
                            <small className="text-muted">{percentage}%</small>
                          </div>
                        </div>
                        <ProgressBar 
                          now={percentage} 
                          variant={isWinner ? 'success' : 'primary'}
                          style={{ height: '25px' }}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Election Info */}
          <Card className="mt-4">
            <Card.Header>
              <h6>Election Information</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <p><strong>Created:</strong> {new Date(election.createdAt).toLocaleDateString()}</p>
                  <p><strong>Status:</strong> <Badge bg="success">Active</Badge></p>
                </Col>
                <Col md={6}>
                  <p><strong>Total Nominees:</strong> {election.nominees.length}</p>
                  <p><strong>Voting Progress:</strong> {election.votedCount}/{election.totalVoters} voters</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Note for voters */}
          <Alert variant="info" className="mt-4">
            <strong>Note:</strong> These are live results that update as votes are cast. 
            The final results may differ as more people vote.
          </Alert>
        </Col>
      </Row>
    </div>
  );
};

export default PublicResultsPage;