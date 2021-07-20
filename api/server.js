require('dotenv').config({ path: '../.env' })
const axios = require('axios')
const qs = require('qs')
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

fastify.get('/quote', async (request, reply) => {
  const params = {
    buyToken: 'MATIC',
    sellToken: 'DAI',
    buyAmount: 10000000000000000000
  }
  const response = await axios({
    method: 'GET',
    url: 'https://polygon.api.0x.org/swap/v1/quote',
    params: params
  })
  reply.send(response.data)
})


fastify.get('/transfer', async (request, reply) => {
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
