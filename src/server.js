import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import connectDB from "./config/db.js";
import Channel from "./models/Channel.js";

const PORT = process.env.PORT || 3000;

// Seed default channels if none exist
const seedChannels = async () => {
  const count = await Channel.countDocuments();
  if (count === 0) {
    await Channel.insertMany([
      { name: "general", description: "General discussion" },
      { name: "announcements", description: "Important announcements" },
      { name: "random", description: "Random chatter" },
    ]);
    console.log("Default channels seeded");
  }
};

const startServer = async () => {
  await connectDB();
  await seedChannels();
  app.listen(PORT, () =>
    console.log(`Server running on port ${PORT}`)
  );
};

startServer();