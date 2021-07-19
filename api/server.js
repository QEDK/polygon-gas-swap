require('dotenv').config({ path: '../.env' })
// Require the framework and instantiate it
const fastify = require('fastify')({
  logger: true
})

if (!process.env.API_KEY) {
  console.error('API key is undefined!')
  process.exit(1)
}

// Declare a route
fastify.get('/', (request, reply) => {
  reply.send({ hello: 'world' })
})

fastify.get('/transfer', (request, reply) => {
  try {
    if (request.body.apiKey !== process.env.API_KEY) {
      reply.statusCode = 403
    }
  } catch (err) {
    console.error(err)
    reply.statusCode = 500
  } finally {
    if (!reply.sent) {
      reply.send()
    }
  }
})

// Run the server!
fastify.listen(3000, (err, address) => {
  if (err) throw err
  // Server is now listening on ${address}
})
