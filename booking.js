const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const { User } = require("./user");


//to restrict access for different types of users
const auth = require("./middleware/auth");
const allowRoles = require("./middleware/role");

//Booking schema
const bookingSchema = new mongoose.Schema({
    studentId: String,
    driverId: String,   // null until accepted
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },
    pickupLat: Number,
    pickupLon: Number,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Booking = mongoose.model("Booking", bookingSchema);

//===========================STUDENT APIS============================

//create booking
router.post("/create", auth, allowRoles("student"), async (req, res) => {
    const { pickupLat, pickupLon } = req.body;
    const studentId = req.user.userId;

    if (!pickupLat || !pickupLon) {
        return res.status(400).json({ message: "Pickup location required" });
    }

    try {
        const existing = await Booking.findOne({
            studentId,
            status: { $in: ["pending", "accepted"] }
        });

        if (existing) {
            return res.status(400).json({ message: "You already have an active booking" });
        }

        const booking = new Booking({
            studentId,
            pickupLat,
            pickupLon
        });

        await booking.save();

        res.json({ message: "Booking created", booking });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

//for student to see assigned EV
router.get("/my", auth, allowRoles("student"), async (req, res) => {
    const studentId = req.user.userId;

    try {
        const booking = await Booking.findOne({
            studentId,
            status: "accepted"
        });

        if (!booking) {
            return res.json({ message: "No active booking" });
        }

        const driver = await User.findById(booking.driverId);

        if (!driver) {
            return res.status(500).json({ message: "Driver not found" });
        }

        res.json({
            vehicle_id: driver.vehicle_id
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

//============================DRIVER APIS==============================

//for driver to see booking
router.get("/pending", auth, allowRoles("driver"), async (req, res) => {
    try {
        const bookings = await Booking.find({ status: "pending" });
        res.json(bookings);
    }
    catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

//for driver to accept bookings
router.post("/accept", auth, allowRoles("driver"), async (req, res) => {
    const { bookingId } = req.body;
    const driverId = req.user.userId;

    try {
        const booking = await Booking.findOneAndUpdate(
            { _id: bookingId, status: "pending" },
            { status: "accepted", driverId },
            { new: true }
        );

        if (!booking) {
            return res.status(400).json({ message: "Already taken or invalid" });
        }

        res.json({ message: "Booking accepted", booking });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

//for driver to reject bookings
router.post("/reject", auth, allowRoles("driver"), async (req, res) => {
    const { bookingId } = req.body;
    try {
        const booking = await Booking.findById(bookingId);

        if (!booking || booking.status !== "pending") {
            return res.status(400).json({ message: "Invalid booking" });
        }

        booking.status = "rejected";
        await booking.save();

        res.json({ message: "Booking rejected" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;





