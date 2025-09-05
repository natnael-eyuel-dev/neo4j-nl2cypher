const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  prompt: {
    type: String,
    required: true,
    trim: true
  },
  cypherQuery: {
    type: String,
    required: true,
    trim: true
  },
  databaseType: {
    type: String,
    enum: ['movies', 'social', 'company', 'custom'],
    required: true
  },
  databaseName: {
    type: String,
    required: true
  },
  results: {
    nodes: [{
      id: String,
      labels: [String],
      properties: mongoose.Schema.Types.Mixed
    }],
    relationships: [{
      id: String,
      type: String,
      startNode: String,
      endNode: String,
      properties: mongoose.Schema.Types.Mixed
    }],
    summary: {
      nodeCount: Number,
      relationshipCount: Number,
      executionTime: Number
    }
  },
  explanation: {
    type: String,
    required: true,
    trim: true
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    executionTime: Number,
    tokensUsed: Number,
    modelUsed: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  isFavorite: {
    type: Boolean,
    default: false
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: String,
    submittedAt: Date
  }
}, {
  timestamps: true
});

// indexes for better query performance
conversationSchema.index({ user: 1, createdAt: -1 });
conversationSchema.index({ databaseType: 1, createdAt: -1 });
conversationSchema.index({ tags: 1 });
conversationSchema.index({ isFavorite: 1 });

// virtual for conversation summary
conversationSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    prompt: this.prompt,
    databaseType: this.databaseType,
    databaseName: this.databaseName,
    createdAt: this.createdAt,
    isFavorite: this.isFavorite,
    feedback: this.feedback
  };
});

// method to add feedback
conversationSchema.methods.addFeedback = function(rating, comment) {
  this.feedback = {
    rating,
    comment,
    submittedAt: new Date()
  };
  return this.save();
};

// method to toggle favorite status
conversationSchema.methods.toggleFavorite = function() {
  this.isFavorite = !this.isFavorite;
  return this.save();
};

// method to add tags
conversationSchema.methods.addTags = function(newTags) {
  const uniqueTags = [...new Set([...this.tags, ...newTags])];
  this.tags = uniqueTags;
  return this.save();
};

// method to remove tags
conversationSchema.methods.removeTags = function(tagsToRemove) {
  this.tags = this.tags.filter(tag => !tagsToRemove.includes(tag));
  return this.save();
};

// static method to find conversations by user
conversationSchema.statics.findByUser = function(userId, options = {}) {
  const query = { user: userId };
  
  if (options.databaseType) {
    query.databaseType = options.databaseType;
  }
  
  if (options.isFavorite !== undefined) {
    query.isFavorite = options.isFavorite;
  }
  
  if (options.tags && options.tags.length > 0) {
    query.tags = { $in: options.tags };
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

// static method to find favorite conversations
conversationSchema.statics.findFavorites = function(userId) {
  return this.find({ user: userId, isFavorite: true })
    .sort({ createdAt: -1 });
};

// static method to get conversation statistics
conversationSchema.statics.getStats = function(userId) {
  return this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalConversations: { $sum: 1 },
        totalFavorites: { $sum: { $cond: ['$isFavorite', 1, 0] } },
        databaseUsage: {
          $push: '$databaseType'
        },
        averageExecutionTime: { $avg: '$metadata.executionTime' }
      }
    }
  ]);
};

// pre-save middleware to update summary
conversationSchema.pre('save', function(next) {
  if (this.isModified('results')) {
    this.results.summary = {
      nodeCount: this.results.nodes ? this.results.nodes.length : 0,
      relationshipCount: this.results.relationships ? this.results.relationships.length : 0,
      executionTime: this.metadata.executionTime || 0
    };
  }
  next();
});

// ensure virtual fields are serialized
conversationSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Conversation', conversationSchema);
