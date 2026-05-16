import Fastify from "fastify";
import cors from "@fastify/cors";
import "dotenv/config";
import { appRoutes } from "./routes/video.routes";
import { initSocketServer } from "./lib/socket";
import { startEventSubscriber } from "./workers/event.subscriber";

const app = Fastify({ logger: true });
const PORT = parseInt(process.env.PORT || "3000", 10);

app.register(cors);
app.register(appRoutes);

initSocketServer(app.server);
startEventSubscriber();

app.get("/", async (request, reply) => {
  return "Bakend is up and running!";
});

const start = async () => {
  try {
    await app.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 System environment processing grid active on port: ${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();