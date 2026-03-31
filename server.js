const express = require("express");
const mqtt = require("mqtt");
const mongoose = require("mongoose");
const userRoutes = require("./user");
const { router: vehicleRoutes, Vehicle } = require("./vehicle");
require("dotenv").config();

const app = express();
app.use(express.json());  // make sure this exists
app.use("/user", userRoutes);

// 🔌 Connect MongoDB
mongoose.connect(process.env.MONGO_URI);

mongoose.connection.on("connected", () => {
  console.log("MongoDB connected");
});


// MQTT
const client = mqtt.connect("mqtt://test.mosquitto.org");

client.on("connect", () => {
  console.log("Connected to MQTT");
  client.subscribe("rickshaw/+/location");
});

// Receive + Save
client.on("message", async (topic, message) => {
  console.log("RAW MESSAGE:", message.toString());

  try {
    const data = JSON.parse(message.toString());

    const existing = await Vehicle.findOne({ vehicle_id: data.vehicle_id });

    // Ignore old data
    if (existing && existing.timestamp > data.timestamp) {
      console.log("Ignored old data");
      return;
    }

    await Vehicle.findOneAndUpdate(
      { vehicle_id: data.vehicle_id },
      {
        ...data,
        lastUpdated: new Date()
      },
      { upsert: true }
    );

    console.log("Saved to DB:", data);

  } catch (err) {
    console.log("JSON ERROR:", err.message);
  }
});

// API
app.get("/vehicles/live", async (req, res) => {
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

app.listen(3000, () => {
  console.log("Server running on port 3000");
});