require('dotenv').config({ path: '../.env' })
const axios = require('axios')
const Web3 = require('web3')
const ERC20ABI = require('./config/erc20.json')

if (!process.env.API_KEY) {
  console.error('API key is undefined!')
  process.exit(1)
} else if (!process.env.PRIVATE_KEY) {
  console.error('Private key is undefined!')
  process.exit(1)
}

const web3 = new Web3(process.env.RPC_URL || 'https://matic-mainnet.chainstacklabs.com')
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY)
web3.eth.accounts.wallet.add(account)

const fastify = require('fastify')({
  logger: true
})
fastify.register(require('fastify-formbody'))

fastify.get('/', (request, reply) => {
  reply.send('Polygon Gas Swap API')
})

fastify.post('/quote', async (request, reply) => {
  try {
    if (request.body.apiKey !== process.env.API_KEY) {
      reply.statusCode = 403
      return
    }
    const params = {
      buyToken: 'MATIC',
      sellToken: 'DAI',
      sellAmount: 629737448321644662
    }
    const response = await axios({
      method: 'GET',
      url: 'https://polygon.api.0x.org/swap/v1/quote',
      params: params
    })
    const daiContract = new web3.eth.Contract(ERC20ABI, response.data.sellTokenAddress)
    const tx = await daiContract.methods.approve(response.data.allowanceTarget, response.data.sellAmount).send({
      from: account.address,
      gas: 100000,
      gasPrice: response.data.gasPrice
    })
    response.data.from = account.address
    response.data.gas = 500000 // 0x gas estimates are not great
    const tx2 = await web3.eth.sendTransaction(response.data)
    reply.send({})
  } catch (err) {
    console.error(err)
    reply.statusCode = 500
  } finally {
    if (!reply.sent) {
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
