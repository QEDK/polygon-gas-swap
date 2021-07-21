import dotenv from 'dotenv';
dotenv.config({ file: '../.env' });
import axios from "axios";
import Web3 from "web3";
import ERC20ABI from "./api/config/erc20.json"
import Biconomy from '@biconomy/mexa'
import Web3Modal from "web3modal";

const web3Modal = new Web3Modal({
  network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
  cacheProvider: true, // optional
  theme:"light" // optional. Change to "dark" for a dark theme.
})

const ConnectWallet = () => {
  async function start {
    const provider = await web3Modal.connect();

    const web3 = new Web3(provider);

    const biconomy = new Biconomy(web3, {apiKey: process.env.REACT_APP_API_KEY, strictMode: true});
    web3 = new Web3(biconomy);
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

    const handleClickConnect = async () => {
      await start();
    };
    return (<button
          onClick={handleClickConnect}
        >Click</button>
  });
}

export default ConnectWallet;
export { web3 };


