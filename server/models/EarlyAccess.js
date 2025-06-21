import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const earlyAccessSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: [254, 'Email too long'], // RFC 5321
    validate: {
      validator: function(v) {
        // RFC 5322 compliant email regex
        return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  emailHash: {
    type: String,
    // Remove required: true for now, we'll set it in the pre-save hook
    select: false // Don't return this in queries by default
  },
  signupDate: {
    type: Date,
    default: Date.now,
    immutable: true
  },
  ipHash: {
    type: String,
    required: true,
    select: false
  },
  userAgent: {
    type: String,
    select: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  metadata: {
    source: String,
    campaign: String
  }
}, {
  timestamps: true,
  collection: 'early_access_signups'
});

// Only create index for signupDate (email already has unique: true which creates an index)
earlyAccessSchema.index({ signupDate: -1 });

// Hash sensitive data before saving
earlyAccessSchema.pre('save', async function(next) {
  try {
    if (this.isNew && this.email) {
      // Hash the email for additional security layer
      const salt = await bcrypt.genSalt(10);
      this.emailHash = await bcrypt.hash(this.email, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to verify email hasn't been tampered with
earlyAccessSchema.methods.verifyEmailIntegrity = async function(email) {
  if (!this.emailHash) return false;
  return await bcrypt.compare(email, this.emailHash);
};

export default mongoose.model('EarlyAccess', earlyAccessSchema);
