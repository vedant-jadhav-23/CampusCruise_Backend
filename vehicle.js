const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// Schema
const vehicleSchema = new mongoose.Schema({
  vehicle_id: { type: String, unique: true },
  lat: Number,
  lon: Number,
  timestamp: Number,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

const Vehicle = mongoose.model("Vehicle", vehicleSchema);

// API
router.get("/live", async (req, res) => {
  try {
    const vehicles = await Vehicle.find().lean(); // lean() apparently improves performance by removing mongoose overhead

    const now = new Date();

    const result = vehicles.map(v => {
      const diff = (now - v.lastUpdated) / 1000;

      let status = "online";
      const OFFLINE_THRESHOLD = 30;
      if (diff > OFFLINE_THRESHOLD) status = "offline";

      return {
        vehicle_id: v.vehicle_id,
        lat: v.lat,
        lon: v.lon,
        status,
        lastUpdated: v.lastUpdated
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: "Error fetching vehicles" })
  }
});

module.exports = { router, Vehicle };