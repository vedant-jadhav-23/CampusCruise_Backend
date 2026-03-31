const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// 📄 Schema
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

// 🌐 API
router.get("/live", async (req, res) => {
  const vehicles = await Vehicle.find();

  const now = new Date();

  const result = vehicles.map(v => {
    const diff = (now - v.lastUpdated) / 1000;

    let status = "online";
    if (diff > 30) status = "offline";

    return {
      vehicle_id: v.vehicle_id,
      lat: v.lat,
      lon: v.lon,
      status,
      lastUpdated: v.lastUpdated
    };
  });

  res.json(result);
});

module.exports = { router, Vehicle };