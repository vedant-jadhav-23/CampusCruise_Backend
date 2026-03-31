const mqtt = require("mqtt")
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

        if (
            !data.vehicle_id ||
            typeof data.lat !== "number" ||
            typeof data.lon !== "number" ||
            !data.timestamp
        ) {
            console.log("Invalid data ignored");
            return;
        }

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
