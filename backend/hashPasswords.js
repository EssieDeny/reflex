const bcrypt = require("bcryptjs");
const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const users = [
  {
    email: "retailer@reflex.co.ke",
    password: "retailer123",
  },
  {
    email: "dispatcher@reflex.co.ke",
    password: "dispatcher123",
  },
  {
    email: "rider@reflex.co.ke",
    password: "rider123",
  },
];

async function hashPasswords() {
  try {
    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);

      await pool.query(
        "UPDATE users SET password = $1 WHERE email = $2",
        [hashedPassword, user.email]
      );

      console.log(`Password updated for ${user.email}`);
    }

    console.log("All passwords have been securely hashed.");
  } catch (error) {
    console.error("Error hashing passwords:", error);
  } finally {
    await pool.end();
  }
}

hashPasswords();