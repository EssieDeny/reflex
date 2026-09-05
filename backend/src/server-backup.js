const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// =========================
// TEST API
// =========================

app.get("/", (req, res) => {
  res.json({
    message: "Reflex API is running",
  });
});

// =========================
// TEST DATABASE CONNECTION
// =========================

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Database connection successful",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

// =========================
// LOGIN
// =========================

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
    });
  }
});

// =========================
// GET RIDERS
// =========================

app.get("/api/riders", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE role = 'Rider'
       ORDER BY name ASC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching riders:", error);

    res.status(500).json({
      message: "Failed to fetch riders",
    });
  }
});

// =========================
// CREATE A NEW DELIVERY
// =========================

app.post("/api/deliveries", async (req, res) => {
  const {
    customer_name,
    customer_phone,
    delivery_address,
    item_description,
  } = req.body;

  if (
    !customer_name ||
    !customer_phone ||
    !delivery_address ||
    !item_description
  ) {
    return res.status(400).json({
      message: "All delivery fields are required",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO deliveries
       (customer_name, customer_phone, delivery_address, item_description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        customer_name,
        customer_phone,
        delivery_address,
        item_description,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating delivery:", error);

    res.status(500).json({
      message: "Failed to create delivery",
    });
  }
});

// =========================
// GET ALL DELIVERIES
// =========================

app.get("/api/deliveries", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM deliveries ORDER BY created_at DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching deliveries:", error);

    res.status(500).json({
      message: "Failed to fetch deliveries",
    });
  }
});

// =========================
// ASSIGN A RIDER
// =========================

app.patch("/api/deliveries/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { rider_name } = req.body;

  if (!rider_name) {
    return res.status(400).json({
      message: "Rider name is required",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE deliveries
       SET rider_name = $1,
           status = 'Assigned'
       WHERE id = $2
       RETURNING *`,
      [rider_name, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Delivery not found",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error assigning rider:", error);

    res.status(500).json({
      message: "Failed to assign rider",
    });
  }
});

// =========================
// MARK DELIVERY AS PICKED UP
// =========================

app.patch("/api/deliveries/:id/pickup", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE deliveries
       SET status = 'Picked Up'
       WHERE id = $1
       AND status = 'Assigned'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Delivery not found or is not currently assigned",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating delivery:", error);

    res.status(500).json({
      message: "Failed to update delivery",
    });
  }
});

// =========================
// MARK DELIVERY AS DELIVERED
// =========================

app.patch("/api/deliveries/:id/deliver", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE deliveries
       SET status = 'Delivered'
       WHERE id = $1
       AND status = 'Picked Up'
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Delivery not found or is not currently picked up",
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error completing delivery:", error);

    res.status(500).json({
      message: "Failed to complete delivery",
    });
  }
});

// =========================
// START SERVER
// =========================

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Reflex server running on port ${PORT}`);
});