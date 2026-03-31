const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://test.mosquitto.org");

client.on("connect", () => {
    const vehicles = [
        { vehicle_id: "1", lat: 17, lon: 78 },
        { vehicle_id: "2", lat: 17.1, lon: 78.1 },
        { vehicle_id: "3", lat: 17.2, lon: 78.2 }
    ];

    console.log("Sent multiple vehicles");

    setInterval(() => {
        vehicles.forEach(v => {
            client.publish(
                `rickshaw/${v.vehicle_id}/location`,
                JSON.stringify({
                    ...v,
                    timestamp: Date.now()
                })
            );
        });
    }, 3000);
});