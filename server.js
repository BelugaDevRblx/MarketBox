import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👉 Sert ton index.html à la racine
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Test API route
app.get("/api", (req, res) => {
  res.send("✅ RblxBox API is online!");
});

// Fake DB
const users = [];

// Register
app.post("/api/register", async (req, res) => {
  const { username, password, robloxId, phrase } = req.body;

  if (users.find((u) => u.username === username)) {
    return res.status(400).json({ error: "Username already exists" });
  }

  try {
    const r = await fetch(`https://users.roblox.com/v1/users/${robloxId}`);
    const data = await r.json();
    if (!data.description || !data.description.includes(phrase)) {
      return res.status(400).json({ error: "Verification phrase not found in Roblox description" });
    }

    const newUser = { username, password, role: "User", robloxId };
    users.push(newUser);
    res.json({ success: true, user: newUser });
  } catch (err) {
    res.status(500).json({ error: "Roblox API error" });
  }
});

// Login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (username === process.env.OWNER_USER && password === process.env.OWNER_PASS) {
    return res.json({ role: "Owner", username });
  }

  const u = users.find(x => x.username === username && x.password === password);
  if (!u) return res.status(400).json({ error: "Invalid credentials" });
  res.json({ role: u.role, username: u.username });
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ RblxBox API running on port ${PORT}`));
