# CampusCruise

A Node.js backend API for a campus vehicle booking and real-time tracking system (e.g., electric rickshaws).

## Architecture

- **Runtime**: Node.js (CommonJS)
- **Framework**: Express
- **Database**: MongoDB (via Mongoose)
- **Real-time**: MQTT (connects to `mqtt://test.mosquitto.org`)
- **Auth**: JWT-based authentication with role-based access (student/driver)

## Project Structure

```
├── server.js         # Entry point — Express, MongoDB, MQTT init
├── user.js           # User schema + auth routes (signup, login)
├── vehicle.js        # Vehicle schema + location API
├── booking.js        # Booking schema + booking routes (create, accept, reject)
├── mqtt.js           # MQTT client — receives & saves real-time vehicle location
├── send.js           # MQTT publish utility for testing
├── middleware/
│   ├── auth.js       # JWT verification middleware
│   └── role.js       # Role-based access control middleware
```

## Environment Variables / Secrets

| Key         | Description                              |
|-------------|------------------------------------------|
| MONGO_URI   | MongoDB connection string                |
| JWT_SECRET  | Secret key for signing/verifying JWTs    |

## API Routes

- `POST /user/signup` — Register a new user
- `POST /user/login` — Login and receive a JWT
- `GET /vehicle/:id` — Get vehicle location
- `POST /booking` — Create a booking (student)
- `PUT /booking/:id/accept` — Accept a booking (driver)
- `PUT /booking/:id/reject` — Reject a booking (driver)

## Workflow

- **Start application**: `node server.js` on port 3000 (console output)
