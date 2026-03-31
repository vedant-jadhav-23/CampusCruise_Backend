const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const userRoutes = require("./user");
const { router: vehicleRoutes } = require("./vehicle");
const bookingRoutes = require("./booking");

const app = express();

app.use(express.json());

// Routes
app.use("/user", userRoutes);
app.use("/vehicle", vehicleRoutes);
app.use("/booking", bookingRoutes);

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log("Mongo error:", err));

// MQTT service
require("./mqtt");

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});