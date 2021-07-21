require('dotenv').config()
const axios = require('axios')
const Web3 = require('web3')
const ERC20ABI = require('./api/config/erc20.json')
const { Biconomy } = require('@biconomy/mexa')

if (!process.env.API_KEY) {
  console.error('API key is undefined!')
} else if (!process.env.PRIVATE_KEY) {
  console.error('Private key is undefined!')
}

var web3 = new Web3()
const account = web3.eth.accounts.privateKeyToAccount(process.env.PRIVATE_KEY)
web3.eth.accounts.wallet.add(account)

const biconomy = new Biconomy(web3, {apiKey: process.env.API_KEY, strictMode: true});
web3 = new Web3(biconomy);

const start = async() => {
  const params = {
    buyToken: 'MATIC',
    sellToken: 'DAI',
    sellAmount: 819062558321644662
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
  console.log(tx)
  response.data.from = account.address
  response.data.gas = 500000 // 0x gas estimates are not great
  const tx2 = await web3.eth.sendTransaction(response.data)
  console.log(tx2)
}

start()
