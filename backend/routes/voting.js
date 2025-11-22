const express = require('express');
const router = express.Router();
const Election = require('../models/Election');

// Get election for voting (public route)
router.get('/:votingUrl', async (req, res) => {
  try {
    const { votingUrl } = req.params;

    const election = await Election.findOne({ votingUrl }).select(
      'title description nominees voters status votingUrl'
    );

    if (!election) {
      return res.status(404).json({ 
        message: 'Election not found or invalid voting URL' 
      });
    }

    if (election.status !== 'active') {
      return res.status(400).json({ 
        message: 'This election is not active' 
      });
    }

    // Return election data without sensitive voter information
    res.json({
      election: {
        id: election._id,
        title: election.title,
        description: election.description,
        nominees: election.nominees.map(nominee => ({
          _id: nominee._id,
          name: nominee.name
        })),
        votingUrl: election.votingUrl,
        totalVoters: election.voters.length,
        votedCount: election.voters.filter(voter => voter.hasVoted).length
      }
    });
  } catch (error) {
    console.error('Get election for voting error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify voter credentials
router.post('/verify-voter', async (req, res) => {
  try {
    const { votingUrl, voterId, voterKey } = req.body;

    if (!votingUrl || !voterId || !voterKey) {
      return res.status(400).json({ 
        message: 'Voting URL, Voter ID, and Voter Key are required' 
      });
    }

    const election = await Election.findOne({ votingUrl });

    if (!election) {
      return res.status(404).json({ 
        message: 'Election not found' 
      });
    }

    if (election.status !== 'active') {
      return res.status(400).json({ 
        message: 'This election is not active' 
      });
    }

    // Find voter with matching credentials
    const voter = election.voters.find(v => 
      v.voterId === voterId.toUpperCase() && 
      v.voterKey === voterKey.toUpperCase()
    );

    if (!voter) {
      return res.status(401).json({ 
        message: 'Invalid voter credentials' 
      });
    }

    if (voter.hasVoted) {
      return res.status(400).json({ 
        message: 'You have already voted in this election' 
      });
    }

    res.json({
      message: 'Voter verified successfully',
      voter: {
        name: voter.name,
        email: voter.email,
        voterId: voter.voterId
      }
    });

  } catch (error) {
    console.error('Verify voter error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cast vote
router.post('/cast-vote', async (req, res) => {
  try {
    const { votingUrl, voterId, voterKey, nomineeId } = req.body;

    if (!votingUrl || !voterId || !voterKey || !nomineeId) {
      return res.status(400).json({ 
        message: 'All fields are required' 
      });
    }

    const election = await Election.findOne({ votingUrl });

    if (!election) {
      return res.status(404).json({ 
        message: 'Election not found' 
      });
    }

    if (election.status !== 'active') {
      return res.status(400).json({ 
        message: 'This election is not active' 
      });
    }

    // Find voter with matching credentials
    const voterIndex = election.voters.findIndex(v => 
      v.voterId === voterId.toUpperCase() && 
      v.voterKey === voterKey.toUpperCase()
    );

    if (voterIndex === -1) {
      return res.status(401).json({ 
        message: 'Invalid voter credentials' 
      });
    }

    const voter = election.voters[voterIndex];

    if (voter.hasVoted) {
      return res.status(400).json({ 
        message: 'You have already voted in this election' 
      });
    }

    // Find nominee
    const nomineeIndex = election.nominees.findIndex(n => 
      n._id.toString() === nomineeId
    );

    if (nomineeIndex === -1) {
      return res.status(400).json({ 
        message: 'Invalid nominee selected' 
      });
    }

    // Update election with the vote
    election.voters[voterIndex].hasVoted = true;
    election.nominees[nomineeIndex].voteCount += 1;

    // Save the election
    await election.save();

    res.json({
      message: `Vote cast successfully for ${election.nominees[nomineeIndex].name}`,
      nominee: election.nominees[nomineeIndex].name,
      voter: voter.name
    });

  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({ message: 'Failed to cast vote. Please try again.' });
  }
}); 
module.exports = router;