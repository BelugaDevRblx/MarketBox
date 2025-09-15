// server.js
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import bodyParser from "body-parser";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// Simple route for testing
app.get("/", (req, res) => {
  res.send("✅ RblxBox API is online!");
});

// Simulated database (in memory for now)
const users = [];

/**
 * REGISTER
 * User must prove ownership of their Roblox account by adding a phrase to their description
 */
app.post("/register", async (req, res) => {
  const { username, password, robloxId, phrase } = req.body;

  if (!username || !password || !robloxId || !phrase) {
    return res.status(400).json({ error: "Missing fields" });
  }

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }

  try {
    const r = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
    if (!r.ok) {
      return res.status(400).json({ error: "Invalid Roblox ID" });
    }
    const data = await r.json();

    if (!data.description || !data.description.includes(phrase)) {
      return res.status(400).json({
        error: "Verification phrase not found in Roblox description",
      });
    }

    const role = "User";
    const newUser = { username, password, role, robloxId };
    users.push(newUser);

    return res.json({ success: true, user: { username, role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Roblox API error" });
  }
});

/**
 * LOGIN
 * Owner is checked via .env
 */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Owner check
  if (
    username === process.env.OWNER_USER &&
    password === process.env.OWNER_PASS
  ) {
    return res.json({ role: "Owner", username });
  }

  // Normal user check
  const u = users.find(
    (x) => x.username === username && x.password === password
  );
  if (!u) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  res.json({ role: u.role, username: u.username });
});

// Port for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ RblxBox API running on port ${PORT}`);
});
