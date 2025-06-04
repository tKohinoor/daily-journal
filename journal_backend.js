// server.js - Express server with MongoDB
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dailyjournal';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Journal Entry Schema
const entrySchema = new mongoose.Schema({
    date: {
        type: String,
        required: true,
        unique: true // One entry per date
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field before saving
entrySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const JournalEntry = mongoose.model('JournalEntry', entrySchema);

// Routes

// Get all journal entries
app.get('/api/entries', async (req, res) => {
    try {
        const entries = await JournalEntry.find()
            .sort({ date: -1 }) // Sort by date, newest first
            .select('_id date content createdAt updatedAt');
        
        res.json({
            success: true,
            data: entries
        });
    } catch (error) {
        console.error('Error fetching entries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch journal entries'
        });
    }
});

// Get a specific journal entry by date
app.get('/api/entries/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const entry = await JournalEntry.findOne({ date });
        
        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'No entry found for this date'
            });
        }
        
        res.json({
            success: true,
            data: entry
        });
    } catch (error) {
        console.error('Error fetching entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch journal entry'
        });
    }
});

// Create or update a journal entry
app.post('/api/entries', async (req, res) => {
    try {
        const { date, content } = req.body;
        
        // Validation
        if (!date || !content) {
            return res.status(400).json({
                success: false,
                message: 'Date and content are required'
            });
        }
        
        if (content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Content cannot be empty'
            });
        }
        
        // Check if entry exists for this date
        let entry = await JournalEntry.findOne({ date });
        
        if (entry) {
            // Update existing entry
            entry.content = content.trim();
            entry.updatedAt = new Date();
            await entry.save();
            
            res.json({
                success: true,
                message: 'Journal entry updated successfully',
                data: entry
            });
        } else {
            // Create new entry
            entry = new JournalEntry({
                date,
                content: content.trim()
            });
            
            await entry.save();
            
            res.status(201).json({
                success: true,
                message: 'Journal entry created successfully',
                data: entry
            });
        }
    } catch (error) {
        console.error('Error saving entry:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Invalid data provided'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to save journal entry'
        });
    }
});

// Update a journal entry
app.put('/api/entries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }
        
        const entry = await JournalEntry.findByIdAndUpdate(
            id,
            { 
                content: content.trim(),
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );
        
        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Journal entry not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Journal entry updated successfully',
            data: entry
        });
    } catch (error) {
        console.error('Error updating entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update journal entry'
        });
    }
});

// Delete a journal entry
app.delete('/api/entries/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const entry = await JournalEntry.findByIdAndDelete(id);
        
        if (!entry) {
            return res.status(404).json({
                success: false,
                message: 'Journal entry not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Journal entry deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete journal entry'
        });
    }
});

// Get journal statistics
app.get('/api/stats', async (req, res) => {
    try {
        const totalEntries = await JournalEntry.countDocuments();
        const firstEntry = await JournalEntry.findOne().sort({ date: 1 });
        const lastEntry = await JournalEntry.findOne().sort({ date: -1 });
        
        // Calculate average words per entry
        const entries = await JournalEntry.find().select('content');
        const totalWords = entries.reduce((sum, entry) => {
            return sum + entry.content.split(/\s+/).length;
        }, 0);
        const avgWords = totalEntries > 0 ? Math.round(totalWords / totalEntries) : 0;
        
        res.json({
            success: true,
            data: {
                totalEntries,
                avgWordsPerEntry: avgWords,
                firstEntryDate: firstEntry ? firstEntry.date : null,
                lastEntryDate: lastEntry ? lastEntry.date : null,
                totalWords
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
});

// Search entries
app.get('/api/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }
        
        const entries = await JournalEntry.find({
            content: { $regex: q, $options: 'i' }
        }).sort({ date: -1 });
        
        res.json({
            success: true,
            data: entries,
            count: entries.length
        });
    } catch (error) {
        console.error('Error searching entries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search entries'
        });
    }
});

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Handle 404 for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Journal server running on port ${PORT}`);
    console.log(`📝 Access your journal at: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Shutting down gracefully...');
    await mongoose.connection.close();
    process.exit(0);
});

module.exports = app;