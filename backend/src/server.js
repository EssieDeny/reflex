const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Reflex API is running",
  });
});

// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      message: "Database connected successfully",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      message: "Database connection failed",
    });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  try {
    const result = await pool.query(
      `SELECT id, name, email, role, password
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.rows[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
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

// Get riders
app.get("/api/riders", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email
       FROM users
       WHERE role = 'Rider'
       ORDER BY name`
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching riders:", error);

    res.status(500).json({
      message: "Failed to fetch riders",
    });
  }
});

// Get deliveries
app.get("/api/deliveries", async (req, res) => {
  const { rider_id } = req.query;

  try {
    let result;

    if (rider_id) {
      result = await pool.query(
        `SELECT *
         FROM deliveries
         WHERE rider_id = $1
         ORDER BY id DESC`,
        [rider_id]
      );
    } else {
      result = await pool.query(
        `SELECT *
         FROM deliveries
         ORDER BY id DESC`
      );
    }

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching deliveries:", error);

    res.status(500).json({
      message: "Failed to fetch deliveries",
    });
  }
});

// Create a delivery
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
       (customer_name, customer_phone, delivery_address, item_description, status)
       VALUES ($1, $2, $3, $4, 'Pending')
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

// Assign a rider
app.patch("/api/deliveries/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { rider_id } = req.body;

  if (!rider_id) {
    return res.status(400).json({
      message: "Rider ID is required",
    });
  }

  try {
    const riderResult = await pool.query(
      `SELECT id, name
       FROM users
       WHERE id = $1
       AND role = 'Rider'`,
      [rider_id]
    );

    if (riderResult.rows.length === 0) {
      return res.status(404).json({
        message: "Rider not found",
      });
    }

    const rider = riderResult.rows[0];

    const result = await pool.query(
      `UPDATE deliveries
       SET rider_id = $1,
           rider_name = $2,
           status = 'Assigned'
       WHERE id = $3
       AND status = 'Pending'
       RETURNING *`,
      [rider.id, rider.name, id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        message: "Delivery not found or is not currently pending",
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

// Mark delivery as picked up
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
    console.error("Error updating pickup status:", error);

    res.status(500).json({
      message: "Failed to update delivery",
    });
  }
});

// Mark delivery as delivered
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

// Delete a delivery
app.delete("/api/deliveries/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM deliveries
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Delivery not found",
      });
    }

    res.json({
      message: "Delivery deleted successfully",
      delivery: result.rows[0],
    });
  } catch (error) {
    console.error("Error deleting delivery:", error);

    res.status(500).json({
      message: "Failed to delete delivery",
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Reflex server running on port ${PORT}`);
});