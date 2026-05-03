import Fastify from "fastify";
import "dotenv/config";
import { prisma } from "./lib/prisma.ts";

const app = Fastify({
  logger: true,
});

const PORT = parseInt(process.env.PORT || "3000", 10);

app.get("/", function (request, reply) {
  reply.send("hello world");
});

app.post(
  "/users",
  {
    schema: {
      body: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
        },
      },
    },
  },
  async (request, reply) => {
    const { email, password } = request.body as {
      email: string;
      password: string;
    };

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: password,
      },
    });

    return user;
  },
);

const start = async () => {
  try {
    await app.listen({ port: PORT });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
  console.log(`Server is running on port ${PORT}`);
};

start();
