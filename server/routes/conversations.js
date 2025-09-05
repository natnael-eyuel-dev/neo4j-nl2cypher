const express = require('express');
const { protect } = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const mongoose = require('mongoose');

const router = express.Router();

// all routes require authentication
router.use(protect);

// get user's conversation history
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      databaseType, 
      isFavorite, 
      tags,
      search 
    } = req.query;
    
    const skip = (page - 1) * limit;
    const options = {
      limit: parseInt(limit),
      skip: parseInt(skip)
    };
    
    // build query filters
    const query = { user: req.user._id };
    if (databaseType) query.databaseType = databaseType;
    if (isFavorite !== undefined) query.isFavorite = isFavorite === 'true';
    if (tags) query.tags = { $in: tags.split(',') };

    // get conversations
    const conversations = await Conversation.find(query)
      .select('_id prompt cypherQuery explanation databaseType databaseName createdAt isFavorite tags executionTime')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Conversation.countDocuments(query);
    
    // search functionality
    let filteredConversations = conversations;
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filteredConversations = conversations.filter(conv => 
        conv.prompt.match(searchRegex) || 
        conv.explanation.match(searchRegex)
      );
    }

    // convert MongoDB objects to plain JavaScript objects with string IDs
    const conversationsWithStringIds = filteredConversations.map(conv => {
      const convObj = conv.toObject(); // Convert to plain JavaScript object
      convObj._id = convObj._id.toString(); // Convert ObjectId to string
      return convObj;
    });
    
    res.json({
      success: true,
      data: {
        conversations: conversationsWithStringIds,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Get conversations failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversations'
    });
  }
});

// get specific conversation by ID
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    res.json({
      success: true,
      data: conversation
    });
    
  } catch (error) {
    console.error('❌ Get conversation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation'
    });
  }
});

// update conversation (add feedback, toggle favorite, add tags)
router.put('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { feedback, isFavorite, tags, action } = req.body;
    
    const conversation = await Conversation.findOne({
      _id: conversationId,
      user: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    // handle different update actions
    if (action === 'toggleFavorite') {
      await conversation.toggleFavorite();
    } else if (action === 'addFeedback' && feedback) {
      await conversation.addFeedback(feedback.rating, feedback.comment);
    } else if (action === 'addTags' && tags) {
      await conversation.addTags(tags);
    } else if (action === 'removeTags' && tags) {
      await conversation.removeTags(tags);
    } else if (isFavorite !== undefined) {
      conversation.isFavorite = isFavorite;
      await conversation.save();
    }
    
    res.json({
      success: true,
      data: conversation,
      message: 'Conversation updated successfully'
    });
    
  } catch (error) {
    console.error('❌ Update conversation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update conversation'
    });
  }
});

// delete conversation
router.delete('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // add validation for conversationId
    if (!conversationId || conversationId === 'undefined' || conversationId === 'null') {
      return res.status(400).json({
        success: false,
        error: 'Invalid conversation ID'
      });
    }
    
    // check if conversationId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid conversation ID format'
      });
    }

    const conversation = await Conversation.findOneAndDelete({
      _id: conversationId,
      user: req.user._id
    });
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Conversation deleted successfully'
    });
    
  } catch (error) {
    console.error('❌ Delete conversation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete conversation'
    });
  }
});

// get favorite conversations
router.get('/favorites', async (req, res) => {
  try {
    const conversations = await Conversation.findFavorites(req.user._id);
    
    res.json({
      success: true,
      data: conversations
    });
    
  } catch (error) {
    console.error('❌ Get favorites failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get favorite conversations'
    });
  }
});

// get conversation statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await Conversation.getStats(req.user._id);
    
    // process stats
    const processedStats = stats.length > 0 ? stats[0] : {
      totalConversations: 0,
      totalFavorites: 0,
      databaseUsage: [],
      averageExecutionTime: 0
    };
    
    // calculate database usage breakdown
    const databaseBreakdown = {};
    processedStats.databaseUsage.forEach(dbType => {
      databaseBreakdown[dbType] = (databaseBreakdown[dbType] || 0) + 1;
    });
    
    res.json({
      success: true,
      data: {
        ...processedStats,
        databaseBreakdown
      }
    });
    
  } catch (error) {
    console.error('❌ Get stats failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get conversation statistics'
    });
  }
});

// export conversations (CSV format)
router.get('/export/csv', async (req, res) => {
  try {
    const { databaseType, startDate, endDate } = req.query;
    
    // Build query
    const query = { user: req.user._id };
    if (databaseType) query.databaseType = databaseType;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const conversations = await Conversation.find(query)
      .sort({ createdAt: -1 })
      .select('prompt cypherQuery databaseType databaseName explanation createdAt isFavorite tags');
    
    // convert to CSV format
    const csvData = conversations.map(conv => ({
      Date: conv.createdAt.toISOString().split('T')[0],
      Prompt: conv.prompt,
      'Cypher Query': conv.cypherQuery,
      'Database Type': conv.databaseType,
      'Database Name': conv.databaseName,
      Explanation: conv.explanation,
      Favorite: conv.isFavorite ? 'Yes' : 'No',
      Tags: conv.tags.join(', ')
    }));
    
    // set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="conversations_${new Date().toISOString().split('T')[0]}.csv"`);
    
    // convert to CSV string
    const csvString = convertToCSV(csvData);
    res.send(csvString);
    
  } catch (error) {
    console.error('❌ Export conversations failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export conversations'
    });
  }
});

// bulk operations
router.post('/bulk', async (req, res) => {
  try {
    const { action, conversationIds } = req.body;
    
    if (!action || !conversationIds || !Array.isArray(conversationIds)) {
      return res.status(400).json({
        success: false,
        error: 'Action and conversation IDs are required'
      });
    }
    
    let updateData = {};
    let message = '';
    
    switch (action) {
      case 'favorite':
        updateData = { isFavorite: true };
        message = 'Conversations marked as favorite';
        break;
      case 'unfavorite':
        updateData = { isFavorite: false };
        message = 'Conversations unmarked as favorite';
        break;
      case 'delete':
        await Conversation.deleteMany({
          _id: { $in: conversationIds },
          user: req.user._id
        });
        return res.json({
          success: true,
          message: 'Conversations deleted successfully'
        });
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }
    
    const result = await Conversation.updateMany(
      {
        _id: { $in: conversationIds },
        user: req.user._id
      },
      updateData
    );
    
    res.json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount
      },
      message
    });
    
  } catch (error) {
    console.error('❌ Bulk operation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform bulk operation'
    });
  }
});

// helper function to convert data to CSV format
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];
  
  return csvRows.join('\n');
}

module.exports = router;
