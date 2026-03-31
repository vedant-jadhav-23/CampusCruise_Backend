const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

// User schema
const userSchema = new mongoose.Schema({
  email: { type: String, unique: true, lowercase: true },
  password: String,
  role: {type: String, enum: ["student", "driver"], required:true},
  vehicle_id: { type: String, unique: true, sparse: true }
});

const User = mongoose.model("User", userSchema);

// Signup
router.post("/signup", async (req, res) => {
  let { email, password, role, vehicle_id } = req.body;

  try {
    if (!email || !password || !role) {
      return res.status(400).json({ message: "All fields required" });
    }

    email = email.trim().toLowerCase();

    if (role === "driver" && !vehicle_id) { //checks that driver has entered vehicle_id
      return res.status(400).json({ message: "Vehicle ID required for driver" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      role,
      vehicle_id: role === "driver" ? vehicle_id : undefined
    });

    await user.save();

    res.json({ message: "Signup successful" });

  } catch (err) {
    res.status(500).json({ message: "Error signing up" });
  }
});

// Login
router.post("/login", async (req, res) => {
  let { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Login successful", token });

  } catch (err) {
    res.status(500).json({ message: "Login error" });
  }
});

module.exports = {router, User};
