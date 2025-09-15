// server.js
import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import bodyParser from "body-parser";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// simulate database
const users = [];

// REGISTER with Roblox verification
app.post("/register", async (req, res) => {
  const { username, password, robloxId, phrase } = req.body;

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }

  try {
    const r = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
    const data = await r.json();

    if (!data.description || !data.description.includes(phrase)) {
      return res
        .status(400)
        .json({ error: "Verification phrase not found in Roblox description" });
    }

    const role = "User";
    const newUser = { username, password, role, robloxId };
    users.push(newUser);

    return res.json({ success: true, user: { username, role } });
  } catch (err) {
    return res.status(500).json({ error: "Roblox API error" });
  }
});

// LOGIN (Owner check + normal user)
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.OWNER_USER &&
    password === process.env.OWNER_PASS
  ) {
    return res.json({ role: "Owner", username });
  }

  const u = users.find((x) => x.username === username && x.password === password);
  if (!u) {
    return res.status(400).json({ error: "Invalid credentials" });
  }
  res.json({ role: u.role, username: u.username });
});

// START SERVER
app.listen(3000, () =>
  console.log("✅ RblxBox API running on http://localhost:3000")
);
