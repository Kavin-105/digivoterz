const express = require('express');
const router = express.Router();
const Election = require('../models/Election');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Create nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Helper function to generate voting URL
const generateVotingUrl = () => {
  return crypto.randomBytes(16).toString('hex');
};

// Helper function to generate voter credentials
const generateVoterCredentials = () => {
  const voterId = crypto.randomBytes(4).toString('hex').toUpperCase();
  const voterKey = crypto.randomBytes(6).toString('hex').toUpperCase();
  return { voterId, voterKey };
};

// Helper function to format date for email
const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};

// Helper function to send email with time information
const sendVoterCredentials = async (voter, election) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    
    const mailOptions = {
      from: `"🗳️ E-Voting System" <${process.env.EMAIL_USER}>`,
      to: voter.email,
      subject: `Voting Credentials for: ${election.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Voting Credentials</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px;">E-Voting System</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Secure Digital Voting Platform</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 30px 20px;">
              <h2 style="color: #2c3e50; margin-bottom: 20px;">Election: ${election.title}</h2>
              <p style="font-size: 16px;"><strong>Dear ${voter.name},</strong></p>
              <p style="font-size: 16px; color: #555;">You have been registered as a voter for the election: <strong>${election.title}</strong></p>
              
              <!-- Election Schedule -->
              <div style="background-color: #e8f5e8; padding: 20px; border-radius: 10px; border: 1px solid #c3e6c3; margin: 20px 0;">
                <h4 style="color: #155724; margin-top: 0;">📅 Election Schedule:</h4>
                <p style="color: #155724; margin: 0;"><strong>Start:</strong> ${formatDate(election.startDate)}</p>
                <p style="color: #155724; margin: 0;"><strong>End:</strong> ${formatDate(election.endDate)}</p>
                <p style="color: #856404; margin: 5px 0 0 0; font-size: 14px;"><strong>⚠️ Important:</strong> You can only vote during this time period!</p>
              </div>
              
              <!-- Credentials Box -->
              <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #007bff;">
                <h3 style="color: #007bff; margin-top: 0;">🔐 Your Voting Credentials</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #2c3e50;">Voter ID:</td>
                    <td style="padding: 10px 0;"><code style="background: #e9ecef; padding: 8px 12px; border-radius: 5px; font-size: 16px; font-weight: bold; color: #007bff;">${voter.voterId}</code></td>
                  </tr>
                  <tr>
                    <td style="padding: 10px 0; font-weight: bold; color: #2c3e50;">Voter Key:</td>
                    <td style="padding: 10px 0;"><code style="background: #e9ecef; padding: 8px 12px; border-radius: 5px; font-size: 16px; font-weight: bold; color: #28a745;">${voter.voterKey}</code></td>
                  </tr>
                </table>
                <div style="margin-top: 20px; padding: 15px; background: #e7f3ff; border-radius: 8px; border: 1px solid #b8daff;">
                  <strong style="color: #004085;">🌐 Voting URL:</strong><br>
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/vote/${election.votingUrl}" 
                     style="color: #007bff; text-decoration: none; font-weight: bold; word-break: break-all;">
                    ${process.env.FRONTEND_URL || 'http://localhost:3000'}/vote/${election.votingUrl}
                  </a>
                </div>
              </div>
              
              <!-- Instructions -->
              <div style="background-color: #fff3cd; padding: 20px; border-radius: 10px; border: 1px solid #ffeaa7; margin: 20px 0;">
                <h4 style="color: #856404; margin-top: 0;">📋 Important Instructions:</h4>
                <ul style="color: #856404; margin: 0; padding-left: 20px;">
                  <li>Keep your credentials <strong>safe and confidential</strong></li>
                  <li>You can only vote <strong>once</strong> during the election period</li>
                  <li>The voting link will only work during the scheduled time</li>
                  <li>Enter your Voter ID and Voter Key <strong>exactly</strong> as provided</li>
                  <li>Vote early to avoid last-minute technical issues</li>
                </ul>
              </div>
              
              <!-- Election Description -->
              <div style="background-color: #e8f5e8; padding: 20px; border-radius: 10px; border: 1px solid #c3e6c3; margin: 20px 0;">
                <h4 style="color: #155724; margin-top: 0;">📝 Election Description:</h4>
                <p style="color: #155724; margin: 0;">${election.description}</p>
              </div>
              
              <p style="font-size: 16px; color: #555;">Thank you for participating in our democratic process!</p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="margin: 0; color: #6c757d; font-size: 14px;">
                This is an automated email from E-Voting System. Please do not reply to this email.
              </p>
              <p style="margin: 10px 0 0 0; color: #6c757d; font-size: 12px;">
                © ${new Date().getFullYear()} E-Voting System. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${voter.email}`);
    return Promise.resolve(info);
  } catch (error) {
    console.error(`❌ Failed to send email to ${voter.email}:`, error);
    console.log(`
    ========================================
    VOTER CREDENTIALS FOR: ${election.title}
    ========================================
    Name: ${voter.name}
    Email: ${voter.email}
    Voter ID: ${voter.voterId}
    Voter Key: ${voter.voterKey}
    Voting URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/vote/${election.votingUrl}
    Start Date: ${formatDate(election.startDate)}
    End Date: ${formatDate(election.endDate)}
    ========================================
  `);
    throw error;
  }
};

// Helper function to send vote confirmation email
const sendVoteConfirmationEmail = async (voter, election, selectedNominee) => {
  try {
    const transporter = createTransporter();
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #28a745; margin-bottom: 10px;">✅ Vote Confirmation</h1>
          <h2 style="color: #333; margin-bottom: 20px;">${election.title}</h2>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px; color: #333;">
            <strong>Dear ${voter.name},</strong>
          </p>
          <p style="margin: 15px 0; font-size: 16px; color: #333;">
            Your vote has been successfully recorded for the election: <strong>${election.title}</strong>
          </p>
        </div>

        <div style="background-color: #e7f5e7; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
          <h3 style="color: #155724; margin: 0 0 10px 0;">Vote Details:</h3>
          <p style="margin: 5px 0; color: #155724;"><strong>Candidate Voted For:</strong> ${selectedNominee.name}</p>
          <p style="margin: 5px 0; color: #155724;"><strong>Date & Time:</strong> ${formatDate(new Date())}</p>
          <p style="margin: 5px 0; color: #155724;"><strong>Voter ID:</strong> ${voter.voterId}</p>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            <strong>Important:</strong> This email confirms that your vote has been securely recorded. 
            Your vote is anonymous and cannot be changed once submitted.
          </p>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
          <p style="margin: 0; color: #666; font-size: 14px;">
            Thank you for participating in the election!
          </p>
          <p style="margin: 10px 0; color: #666; font-size: 12px;">
            Election End Time: ${formatDate(election.endDate)}
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: {
        name: 'E-Voting System',
        address: process.env.EMAIL_USER
      },
      to: voter.email,
      subject: `✅ Vote Confirmation - ${election.title}`,
      html: emailContent
    };

    await transporter.sendMail(mailOptions);
    console.log(`Vote confirmation email sent to ${voter.email}`);
    
  } catch (error) {
    console.error('Error sending vote confirmation email:', error);
    // Don't throw error - email failure shouldn't prevent vote recording
  }
};

// Create new election (protected route)
router.post('/create-election', auth, async (req, res) => {
  try {
    const { title, description, nominees, voters, startDate, endDate } = req.body;

    // Validation
    if (!title || !description || !nominees || !voters || !startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Title, description, nominees, voters, start date, and end date are required' 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    // Validate dates
    if (start >= end) {
      return res.status(400).json({ 
        message: 'Start date must be before end date' 
      });
    }

    if (start <= now) {
      return res.status(400).json({ 
        message: 'Start date must be in the future' 
      });
    }

    // Check minimum election duration (5 minutes)
    const minDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
    if (end - start < minDuration) {
      return res.status(400).json({ 
        message: 'Election must run for at least 5 minutes' 
      });
    }

    if (nominees.length < 2) {
      return res.status(400).json({ 
        message: 'At least 2 nominees are required' 
      });
    }

    if (voters.length < 1) {
      return res.status(400).json({ 
        message: 'At least 1 voter is required' 
      });
    }

    // Generate unique voting URL
    let votingUrl;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      votingUrl = generateVotingUrl();
      const existingElection = await Election.findOne({ votingUrl });
      if (!existingElection) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return res.status(500).json({ 
        message: 'Failed to generate unique voting URL. Please try again.' 
      });
    }

    // Process nominees
    const processedNominees = nominees.map(name => ({
      name: name.trim(),
      voteCount: 0
    }));

    // Process voters and generate credentials
    const processedVoters = voters.map(voter => {
      const credentials = generateVoterCredentials();
      return {
        name: voter.name.trim(),
        email: voter.email.trim().toLowerCase(),
        voterId: credentials.voterId,
        voterKey: credentials.voterKey,
        hasVoted: false
      };
    });

    // Create election
    const election = new Election({
      title: title.trim(),
      description: description.trim(),
      creator: req.user._id,
      nominees: processedNominees,
      voters: processedVoters,
      votingUrl,
      startDate: start,
      endDate: end,
      status: 'pending'
    });

    await election.save();

    // Send credentials to voters
    let emailSuccessCount = 0;
    let emailFailureCount = 0;

    for (const voter of processedVoters) {
      try {
        await sendVoterCredentials(voter, election);
        emailSuccessCount++;
      } catch (emailError) {
        console.error(`Failed to send email to ${voter.email}:`, emailError);
        emailFailureCount++;
      }
    }

    // Return success response with election status
    res.status(201).json({
      message: 'Election created successfully',
      emailStatus: {
        sent: emailSuccessCount,
        failed: emailFailureCount,
        total: processedVoters.length
      },
      election: {
        id: election._id,
        title: election.title,
        description: election.description,
        votingUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vote/${election.votingUrl}`,
        nominees: election.nominees.length,
        voters: election.voters.length,
        status: election.status,
        currentStatus: election.currentStatus,
        startDate: election.startDate,
        endDate: election.endDate,
        createdAt: election.createdAt
      }
    });

  } catch (error) {
    console.error('Create election error:', error);
    
    if (error.code === 11000) {
      if (error.keyPattern.votingUrl) {
        return res.status(500).json({ 
          message: 'Failed to generate unique voting URL. Please try again.' 
        });
      }
      return res.status(400).json({ 
        message: 'Election with similar details already exists' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create election. Please try again.' 
    });
  }
});

// Get my elections (protected route)
router.get('/my-elections', auth, async (req, res) => {
  try {
    // Update expired elections first
    await Election.updateExpiredElections();

    const elections = await Election.find({ creator: req.user._id })
      .sort({ createdAt: -1 })
      .select('title description status votingUrl nominees voters startDate endDate createdAt updatedAt');

    const electionsWithCounts = elections.map(election => {
      const currentStatus = election.currentStatus;
      return {
        ...election.toObject(),
        votingUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/vote/${election.votingUrl}`,
        votersCount: election.voters.length,
        votedCount: election.voters.filter(voter => voter.hasVoted).length,
        nomineeCount: election.nominees.length,
        currentStatus: currentStatus,
        timeUntilStart: election.getTimeUntilStart(),
        timeUntilEnd: election.getTimeUntilEnd()
      };
    });

    res.json({
      elections: electionsWithCounts,
      total: elections.length
    });
  } catch (error) {
    console.error('Get my elections error:', error);
    res.status(500).json({ message: 'Failed to fetch elections' });
  }
});

// Get election for voting (public, no auth required)
router.get('/vote/:votingUrl', async (req, res) => {
  try {
    const { votingUrl } = req.params;

    const election = await Election.findOne({ votingUrl }).select(
      'title description nominees voters status startDate endDate votingUrl'
    );

    if (!election) {
      return res.status(404).json({ 
        message: 'Election not found or invalid voting URL' 
      });
    }

    const now = new Date();
    const currentStatus = election.currentStatus;

    // Return election data with time-based status
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
        status: election.status,
        currentStatus: currentStatus,
        startDate: election.startDate,
        endDate: election.endDate,
        timeUntilStart: election.getTimeUntilStart(),
        timeUntilEnd: election.getTimeUntilEnd(),
        isActiveForVoting: election.isActiveForVoting()
      }
    });
  } catch (error) {
    console.error('Get election error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify voter credentials (public, no auth required)
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

    // Check if election is active for voting (time-based)
    if (!election.isActiveForVoting()) {
      const now = new Date();
      if (now < election.startDate) {
        return res.status(400).json({ 
          message: 'Election has not started yet',
          timeUntilStart: election.getTimeUntilStart(),
          startDate: election.startDate
        });
      } else if (now > election.endDate) {
        return res.status(400).json({ 
          message: 'Election has ended',
          endDate: election.endDate
        });
      } else {
        return res.status(400).json({ 
          message: 'Election is not available for voting'
        });
      }
    }

    const voter = election.voters.find(v => 
      v.voterId === voterId.toUpperCase() && v.voterKey === voterKey.toUpperCase()
    );

    if (!voter) {
      return res.status(401).json({ 
        message: 'Invalid Voter ID or Voter Key' 
      });
    }

    if (voter.hasVoted) {
      return res.status(400).json({ 
        message: 'You have already voted in this election' 
      });
    }

    res.json({
      message: 'Credentials verified successfully',
      voter: {
        name: voter.name,
        email: voter.email,
        hasVoted: voter.hasVoted
      }
    });
  } catch (error) {
    console.error('Verify voter error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cast vote (public, no auth required)
router.post('/cast-vote', async (req, res) => {
  try {
    const { voterId, voterKey, nomineeId } = req.body;

    if (!voterId || !voterKey || !nomineeId) {
      return res.status(400).json({ 
        message: 'Voter ID, voter key, and nominee selection are required' 
      });
    }

    // Find the election with the voter
    const election = await Election.findOne({
      'voters.voterId': voterId,
      'voters.voterKey': voterKey
    });

    if (!election) {
      return res.status(401).json({ 
        message: 'Invalid voter credentials' 
      });
    }

    // Check if election is active
    const now = new Date();
    if (now < election.startDate || now > election.endDate) {
      return res.status(400).json({ 
        message: 'Voting is not currently active for this election' 
      });
    }

    // Find the voter
    const voter = election.voters.find(v => v.voterId === voterId && v.voterKey === voterKey);
    
    if (voter.hasVoted) {
      return res.status(400).json({ 
        message: 'You have already voted in this election' 
      });
    }

    // Find the nominee
    const nominee = election.nominees.find(n => n._id.toString() === nomineeId);
    if (!nominee) {
      return res.status(400).json({ 
        message: 'Invalid nominee selection' 
      });
    }

    // Record the vote
    nominee.voteCount += 1;
    voter.hasVoted = true;
    voter.votedAt = new Date();

    await election.save();

    // Send vote confirmation email
    await sendVoteConfirmationEmail(voter, election, nominee);

    res.json({ 
      message: 'Vote cast successfully',
      nominee: nominee.name,
      votedAt: voter.votedAt
    });

  } catch (error) {
    console.error('Cast vote error:', error);
    res.status(500).json({ 
      message: 'Failed to cast vote' 
    });
  }
});

// Get election results (protected route)
router.get('/results/:electionId', auth, async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findOne({
      _id: electionId,
      creator: req.user._id
    }).select('title description nominees voters status startDate endDate createdAt');

    if (!election) {
      return res.status(404).json({ 
        message: 'Election not found or access denied' 
      });
    }

    const votedCount = election.voters.filter(voter => voter.hasVoted).length;
    const totalVotes = election.nominees.reduce((sum, nominee) => sum + (nominee.voteCount || 0), 0);

    const results = {
      election: {
        id: election._id,
        title: election.title,
        description: election.description,
        status: election.status,
        currentStatus: election.currentStatus,
        startDate: election.startDate,
        endDate: election.endDate,
        createdAt: election.createdAt,
        nominees: election.nominees.map(nominee => ({
          _id: nominee._id,
          name: nominee.name,
          voteCount: nominee.voteCount || 0,
          percentage: totalVotes > 0 
            ? (((nominee.voteCount || 0) / totalVotes) * 100).toFixed(2)
            : '0.00'
        })),
        totalVoters: election.voters.length,
        votedCount: votedCount,
        pendingCount: election.voters.filter(voter => !voter.hasVoted).length,
        turnoutPercentage: election.voters.length > 0 
          ? ((votedCount / election.voters.length) * 100).toFixed(2)
          : '0.00',
        timeUntilStart: election.getTimeUntilStart(),
        timeUntilEnd: election.getTimeUntilEnd(),
        isActiveForVoting: election.isActiveForVoting()
      }
    };

    res.json(results);
  } catch (error) {
    console.error('Get election results error:', error);
    res.status(500).json({ message: 'Failed to fetch results' });
  }
});

// Helper function to send election results to voters
const sendElectionResults = async (election) => {
  try {
    const transporter = createTransporter();

    // Calculate results using nominee.voteCount
    const totalVotes = election.nominees.reduce((sum, nominee) => sum + (nominee.voteCount || 0), 0);
    
    // Find winner(s)
    const maxVotes = Math.max(...election.nominees.map(nominee => nominee.voteCount || 0));
    const winners = election.nominees.filter(nominee => 
      (nominee.voteCount || 0) === maxVotes && maxVotes > 0
    );

    const winnerText = winners.length === 0 
      ? `📊 No votes cast in this election`
      : winners.length === 1 
        ? `🏆 Winner: ${winners[0].name} with ${maxVotes} vote${maxVotes !== 1 ? 's' : ''}`
        : `🏆 Tie between: ${winners.map(w => `${w.name} (${w.voteCount || 0} votes)`).join(', ')}`;

    // Send email to each voter
    const emailPromises = election.voters.map(async (voter) => {
      const resultsTable = election.nominees.map(nominee => {
        const votes = nominee.voteCount || 0;
        const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : '0.0';
        return `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 12px; text-align: left;">${nominee.name}</td>
            <td style="padding: 12px; text-align: center;">${votes}</td>
            <td style="padding: 12px; text-align: center;">${percentage}%</td>
          </tr>
        `;
      }).join('');

      const mailOptions = {
        from: `"E-Voting Result" <${process.env.EMAIL_USER}>`,
        to: voter.email,
        subject: `🗳️ Election Results: ${election.title}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
              .content { padding: 30px; }
              .winner-box { background: #f8f9fa; border-left: 5px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 5px; }
              .results-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              .results-table th { background: #f8f9fa; padding: 15px; text-align: left; font-weight: bold; border-bottom: 2px solid #dee2e6; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;"> Election Results</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">${election.title}</p>
              </div>
              
              <div class="content">
                <p>Dear ${voter.name},</p>
                
                <p>The election <strong>"${election.title}"</strong> has concluded. Here are the final results:</p>
                
                <div class="winner-box">
                  <h3 style="margin: 0 0 10px 0; color: #28a745;">${winnerText}</h3>
                </div>
                
                <h3>📊 Detailed Results</h3>
                <table class="results-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th style="text-align: center;">Votes</th>
                      <th style="text-align: center;">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${resultsTable}
                  </tbody>
                </table>
                
                <div style="background: #e9ecef; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 0;"><strong>📈 Election Statistics:</strong></p>
                  <p style="margin: 5px 0 0 0;">
                    Total Votes Cast: ${totalVotes} out of ${election.voters.length} eligible voters<br>
                    Voter Turnout: ${election.voters.length > 0 ? ((totalVotes / election.voters.length) * 100).toFixed(1) : '0'}%<br>
                    Election Period: ${formatDate(election.startDate)} - ${formatDate(election.endDate)}
                  </p>
                </div>
                
                <p>Thank you for participating in this democratic process!</p>
              </div>
              
              <div class="footer">
                <p>This is an automated message from DigiVoterz Election System</p>
                <p>Election conducted securely and transparently</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(emailPromises);
    console.log(`✅ Election results sent to ${election.voters.length} voters for election: ${election.title}`);
    
  } catch (error) {
    console.error(`❌ Failed to send election results:`, error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      emailConfig: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER ? 'configured' : 'missing'
      }
    });
    throw error;
  }
};

// Send election results to voters (can be called when election ends)
router.post('/send-results/:electionId', auth, async (req, res) => {
  try {
    const { electionId } = req.params;
    
    const election = await Election.findOne({
      _id: electionId,
      creator: req.user._id
    });

    if (!election) {
      return res.status(404).json({ 
        message: 'Election not found or access denied' 
      });
    }

    // Check if election has ended (either by status or by end date)
    const now = new Date();
    const isEnded = election.status === 'ended' || 
                   election.status === 'expired' || 
                   (election.endDate && new Date(election.endDate) < now);
    
    if (!isEnded) {
      return res.status(400).json({ 
        message: 'Election must be ended to send results',
        currentStatus: election.status,
        endDate: election.endDate,
        isExpired: election.endDate && new Date(election.endDate) < now
      });
    }

    await sendElectionResults(election);
    
    res.json({ 
      message: 'Election results sent successfully to all voters',
      sentTo: election.voters.length
    });
    
  } catch (error) {
    console.error('Send results error:', error);
    res.status(500).json({ message: 'Failed to send election results' });
  }
});

// Delete election (protected route)
router.delete('/:electionId', auth, async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findOneAndDelete({
      _id: electionId,
      creator: req.user._id
    });

    if (!election) {
      return res.status(404).json({ 
        message: 'Election not found or access denied' 
      });
    }

    res.json({ 
      message: 'Election deleted successfully',
      deletedElection: {
        id: election._id,
        title: election.title
      }
    });
  } catch (error) {
    console.error('Delete election error:', error);
    res.status(500).json({ message: 'Failed to delete election' });
  }
});

module.exports = router;