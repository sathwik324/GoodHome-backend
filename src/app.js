import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import memberRoutes from "./routes/member.routes.js";
import eventRoutes from "./routes/event.routes.js";
import channelRoutes from "./routes/channel.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();

app.use(cors());
app.use(express.json());


app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/maggi", (req, res) => {
  res.json({ status: "GoodHome API running" });
});

export default app;
