import Fastify from "fastify";
import fastifyWebSockets from "@fastify/websocket";
import fastifyStatic from "@fastify/static"; "@fastify/static";
import path from "path";

const fastify = Fastify();
fastify.register(fastifyWebSockets);

fastify.register(fastifyStatic, {
   root: path.join(process.cwd(), 'public'),
})

function randomDigit(min, max) {
   return Math.floor(Math.random() * (max - min) + min);
}

function randomLetter() {
   return 'abcdefghijklmnopqrstuvwxyz'[randomDigit(1, 26)];
}

function broadcast(message) {
   for (let client of fastify.websocketServer.clients) {
      client.send(JSON.stringify(message));
   }
}

fastify.register(async (fastify) => {
   fastify.get('/hello-ws', { websocket: true }, (connection, request) => {
      console.log('Client Connected');

      connection.on('message', (message) => {
         connection.send(`Hello, I from Fastify WebSockets ${message}`);
      })

      connection.on('close', () => {
         console.log('Client disconnected');
      })
   })
})

fastify.register(async (fastify) => {
   fastify.get('/digits', { websocket: true }, (connection, req) => {
      let timer = setInterval(() => {
         connection.send(randomDigit(1, 10).toString());
      }, 1000);
      connection.on('close', () => {
         clearInterval(timer);
      });
   });
})

fastify.register(async (fastify) => {
   fastify.get('/letters', { websocket: true }, (connection, req) => {
      let timer = setInterval(() => {
         connection.send(randomLetter());
      }, 1000);
      connection.on('close', () => {
         clearInterval(timer);
      });
   });
})

fastify.addHook('preValidation', async (request, reply) => {
   if (request.routerPath == '/chat' && !request.query.username) {
      reply.code(403).send({ error: 'Connection rejected' });
   }
})

fastify.register(async (fastify) => {
   fastify.get('/chat', { websocket: true }, (connection, request) => {
      broadcast({
         sender: '__server',
         message: `${request.query.username} joined`
      });

      connection.on('close', () => {
         broadcast({
            sender: '__server',
            message: `${request.query.username} left`
         })
      });

      connection.on('message', (message => {
         message = JSON.parse(message.toString());
         broadcast({
            sender: request.query.username,
            ...message,
         })
      }))

      connection.send(`Hello ${request.query.username}`);
   })
});

try {
   const PORT = 3000;
   await fastify.listen({ port: PORT });
   fastify.log.info(`Server is running on port ${PORT}`)
} catch (error) {
   fastify.log.error(error);
   process.exit(1);
}