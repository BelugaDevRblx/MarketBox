import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const app = express();
app.use(bodyParser.json());

// Fix __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Memory DB (codes temporaires)
const sessions = {};

// Génération du code
app.post("/api/request-code", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "Missing username" });

  // Owner direct
  if (username === process.env.OWNER_USER) {
    return res.json({ success: true, role: "Owner", username });
  }

  const code = "RBX-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  sessions[username] = code;
  res.json({ success: true, code });
});

// Vérification du code
app.post("/api/verify-code", async (req, res) => {
  const { username } = req.body;
  const code = sessions[username];
  if (!code) return res.status(400).json({ error: "No code requested" });

  try {
    // Get Roblox user data
    const resp = await fetch(`https://users.roblox.com/v1/usernames/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [username] }),
    });
    const data = await resp.json();
    if (!data.data || data.data.length === 0) {
      return res.status(400).json({ error: "Roblox user not found" });
    }

    const userId = data.data[0].id;
    const resp2 = await fetch(`https://users.roblox.com/v1/users/${userId}`);
    const profile = await resp2.json();

    if (profile.description && profile.description.includes(code)) {
      delete sessions[username];
      return res.json({ success: true, role: "User", username });
    } else {
      return res.status(400).json({ error: "Code not found in description" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Roblox API error" });
  }
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ RblxBox API running on port ${PORT}`));
