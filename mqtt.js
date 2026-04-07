const jwt = require("jsonwebtoken");
const { User } = require("./user");

const mqtt = require("mqtt");
const { Vehicle } = require("./vehicle");

const client = mqtt.connect("mqtt://test.mosquitto.org");

client.on("connect", () => {
  console.log("Connected to MQTT");
  client.subscribe("rickshaw/+/location");
});

// Receive + Save
client.on("message", async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());

    // Basic validation
    if (
      !data.vehicle_id ||
      typeof data.lat !== "number" ||
      typeof data.lon !== "number" ||
      !data.timestamp ||
      !data.token
    ) {
      console.log("Invalid data");
      return;
    }

    //VERIFY TOKEN
    let decoded;
    try {
      decoded = jwt.verify(data.token, process.env.JWT_SECRET);
    } catch {
      console.log("Invalid JWT");
      return;
    }

    //CHECK USER IS DRIVER
    if (decoded.role !== "driver") {
      console.log("Not a driver");
      return;
    }

    //verify driver owns this vehicle
    const user = await User.findById(decoded.userId);

    if (!user || user.vehicle_id !== data.vehicle_id) {
      console.log("Vehicle mismatch");
      return;
    }

    // Ignore old data
    const existing = await Vehicle.findOne({ vehicle_id: data.vehicle_id });

    if (existing && existing.timestamp > data.timestamp) {
      return;
    }
    // Save data
    const { token, ...safeData } = data; // removing token before saving to DB

    await Vehicle.findOneAndUpdate(
      { vehicle_id: data.vehicle_id },
      {
        ...safeData,
        lastUpdated: new Date(),
      },
      { upsert: true },
    );

    // console.log("Saved:", data.vehicle_id);
  } catch (err) {
    console.log("MQTT ERROR:", err.message);
  }
});
