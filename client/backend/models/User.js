const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light'
    },
    defaultDatabase: {
      type: String,
      enum: ['movies', 'social', 'company'],
      default: 'movies'
    }
  },
  customDatabases: [{
    name: {
      type: String,
      required: true
    },
    uri: {
      type: String,
      required: true
    },
    username: String,
    description: String,
    password: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// index for better query performance
userSchema.index({ email: 1, googleId: 1 });
userSchema.index({ createdAt: -1 });

// virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    preferences: this.preferences,
    customDatabases: this.customDatabases
  };
});

// method to update last login
userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

// method to add custom database
userSchema.methods.addCustomDatabase = function(databaseInfo) {
  this.customDatabases.push(databaseInfo);
  return this.save();
};

// method to remove custom database
userSchema.methods.removeCustomDatabase = function(databaseId) {
  this.customDatabases = this.customDatabases.filter(
    db => db._id.toString() !== databaseId
  );
  return this.save();
};

// static method to find user by Google ID
userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId });
};

// static method to find user by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// pre-save middleware to ensure email is lowercase
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase();
  }
  next();
});

// ensure virtual fields are serialized
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
