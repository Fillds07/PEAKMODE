const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Activity name is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['physical', 'mental', 'social', 'relaxation', 'work', 'other'],
      default: 'other'
    },
    energyImpact: {
      type: Number,
      min: -10, // Energy draining (-10 to -1)
      max: 10,  // Energy boosting (1 to 10), 0 = neutral
      default: 0
    },
    duration: {
      type: Number, // Duration in minutes
      min: 0,
      default: 30
    },
    date: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      maxlength: 500
    },
    tags: [String],
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      },
      placeName: String
    },
    mood: {
      before: {
        type: Number,
        min: 1,
        max: 10
      },
      after: {
        type: Number,
        min: 1,
        max: 10
      }
    }
  },
  {
    timestamps: true
  }
);

// Index for geospatial queries if you add location-based features later
activitySchema.index({ location: '2dsphere' });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity; 