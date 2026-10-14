const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    building: {
      type: String,
      trim: true,
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
    radiusMetres: {
      type: Number,
      default: 50,
    },
  },
  {
    timestamps: true,
  }
);

const Venue = mongoose.model('Venue', venueSchema);

module.exports = Venue;
