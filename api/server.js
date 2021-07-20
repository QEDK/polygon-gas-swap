require('dotenv').config({ path: '../.env' })
const axios = require('axios')
const Web3 = require('web3')
const ERC20 = require('./config/erc20.json')
const fastify = require('fastify')({
  logger: true
})

if (!process.env.API_KEY) {
  console.error('API key is undefined!')
  process.exit(1)
} else if (!process.env.PRIVATE_KEY) {
  console.error('Private key is undefined!')
  process.exit(1)
}

const web3 = new Web3(process.env.RPC_URL || 'https://rpc-mainnet.matic.quiknode.pro')
var account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY);
web3.eth.accounts.wallet.add(account);

fastify.get('/', (request, reply) => {
  reply.send('Polygon Gas Swap API')
})

fastify.get('/quote', async (request, reply) => {
  try {
    if (request.body.apiKey !== process.env.API_KEY) {
      reply.statusCode = 403
      return
    }
    const params = {
      buyToken: 'MATIC',
      sellToken: 'DAI',
      buyAmount: 100000000000000000
    }
    const response = await axios({
      method: 'GET',
      url: 'https://polygon.api.0x.org/swap/v1/quote',
      params: params
    })
    reply.send(response.data)
  } catch (err) {
    console.error(err)
    reply.statusCode = 500
  } finally {
    if(!reply.sent) {
      reply.send()
    }
  }
})


fastify.get('/transfer', async (request, reply) => {
  try {
    if (request.body.apiKey !== process.env.API_KEY) {
      reply.statusCode = 403
      return
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
