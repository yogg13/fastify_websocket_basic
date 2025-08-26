import Fastify from "fastify";
import fastifyWebSockets from "@fastify/websocket";
import cors from "@fastify/cors";

const fastify = Fastify({
   logger: true
});

fastify.register(cors);
fastify.register(fastifyWebSockets);

const usersOnline = new Set();

fastify.register(async (fastify) => {
   fastify.get(
      '/online-status',
      { websocket: true },
      (connection, request) => {
         connection.on('message', msg => {
            // connection.send(`Hello, this from fastify server. Your message is ${msg}`)
            const data = JSON.parse(msg.toString());

            if (typeof data === 'object' && 'onlineStatus' in data && 'userId' in data) {
               if (data.onlineStatus && !usersOnline.has(data.userId)) {
                  usersOnline.add(data.userId);
               } else if (!data.onlineStatus && usersOnline.has(data.userId)) {
                  usersOnline.delete(data.userId);
               }

               fastify.websocketServer.clients.forEach(client => {
                  if (client.readyState === 1) {
                     client.send(JSON.stringify({
                        onlineUserCount: usersOnline.size,
                     })
                     );
                  }
               })
            }
         });
      }
   );
});

fastify.get('/', async (request, reply) => {
   return { message: "Hello this message from server" }
});

try {
   const PORT = 3000;
   await fastify.listen({ port: PORT });
   fastify.log.info(`Server is running on port ${PORT}`)
} catch (error) {
   fastify.log.error(error);
   process.exit(1);
}