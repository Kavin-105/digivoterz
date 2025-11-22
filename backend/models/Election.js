const mongoose = require('mongoose');

const VoterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  voterId: {
    type: String,
    required: true,
    unique: true,
  },
  voterKey: {
    type: String,
    required: true,
  },
  hasVoted: {
    type: Boolean,
    default: false,
  },
});

const NomineeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  voteCount: {
    type: Number,
    default: 0,
  },
});

const ElectionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  nominees: [NomineeSchema],
  voters: [VoterSchema],
  status: {
    type: String,
    enum: ['pending', 'active', 'completed', 'closed'],
    default: 'pending',
  },
  votingUrl: {
    type: String,
    required: true,
    unique: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(endDate) {
        return endDate > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  timezone: {
    type: String,
    default: 'UTC',
  },
}, {
  timestamps: true,
});

// Virtual field to get current election status based on time
ElectionSchema.virtual('currentStatus').get(function() {
  const now = new Date();
  if (this.status === 'closed') return 'closed';
  if (now < this.startDate) return 'not-started';
  if (now > this.endDate) return 'expired';
  return 'active';
});

// Method to check if election is currently active for voting
ElectionSchema.methods.isActiveForVoting = function() {
  const now = new Date();
  return this.status !== 'closed' && now >= this.startDate && now <= this.endDate;
};

// Method to get time remaining until election starts
ElectionSchema.methods.getTimeUntilStart = function() {
  const now = new Date();
  if (now >= this.startDate) return null;
  return this.startDate - now;
};

// Method to get time remaining until election ends
ElectionSchema.methods.getTimeUntilEnd = function() {
  const now = new Date();
  if (now >= this.endDate) return null;
  return this.endDate - now;
};

// Static method to update expired elections
ElectionSchema.statics.updateExpiredElections = async function() {
  const now = new Date();
  await this.updateMany(
    { 
      endDate: { $lt: now }, 
      status: { $in: ['pending', 'active'] } 
    },
    { status: 'completed' }
  );
};

module.exports = mongoose.model('Election', ElectionSchema);