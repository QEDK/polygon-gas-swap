
import React from 'react';
import Web3 from 'web3';
import { useWeb3Context } from "./Web3Context";
import axios from "axios";
import ERC20ABI from "./erc20.json";
import GasSwapABI from "./gasswap.json"
import sigUtil from "eth-sig-util";
import { ethers } from "ethers";

const domainType = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
    { name: "verifyingContract", type: "address" },
    { name: "salt", type: "bytes32" },
];

const metaTransactionType = [
    { name: "nonce", type: "uint256" },
    { name: "from", type: "address" },
    { name: "functionSignature", type: "bytes" }
];

const GASSWAP_CONTRACT_ADDR = "0x1fdc5e69729eecf8e933c904e86faf7a8886f661";

const getSignatureParameters = signature => {
    if (!ethers.utils.isHexString(signature)) {
        throw new Error(
            'Given value "'.concat(signature, '" is not a valid hex string.')
        );
    }
    var r = signature.slice(0, 66);
    var s = "0x".concat(signature.slice(66, 130));
    var v = "0x".concat(signature.slice(130, 132));
    v = ethers.BigNumber.from(v).toNumber();
    if (![27, 28].includes(v)) v += 27;
    return {
        r: r,
        s: s,
        v: v
    };
};

function App() {
  const { connectWeb3, provider, biconomyProvider } = useWeb3Context();

  const doSomething = async () => {
    const walletProvider = new ethers.providers.Web3Provider(window.ethereum);
    const web3 = new Web3(biconomyProvider);
    const addr = await web3.eth.getAccounts();
    console.log(addr[0]);
    const params = {
      buyToken: 'MATIC',
      sellToken: 'DAI',
      buyAmount: 1000000000000000000
    }
    const response = await axios({
      method: 'GET',
      url: 'https://polygon.api.0x.org/swap/v1/quote',
      params: params
    })
    console.log(response.data)
    const ERC20Contract = new web3.eth.Contract(ERC20ABI, response.data.sellTokenAddress)
    const ERC20ContractInterface = new ethers.utils.Interface(ERC20ABI);
    var nonce = await ERC20Contract.methods.getNonce(addr[0]).call();
    const slippage = ((parseFloat(response.data.guaranteedPrice) - parseFloat(response.data.price))/parseFloat(response.data.price))*100;
    const updatedAllowance = parseInt(parseInt(response.data.sellAmount) + ((slippage*parseInt(response.data.sellAmount))/100));
    console.log(slippage, updatedAllowance);
    var functionSignature = await ERC20ContractInterface.encodeFunctionData("approve", [GASSWAP_CONTRACT_ADDR, String(updatedAllowance)])
    var message = {
      nonce: nonce,
      from: addr[0],
      functionSignature: functionSignature
    };
    var domainData = {
      name: "(PoS) Dai Stablecoin",
      version: "1",
      verifyingContract: response.data.sellTokenAddress,
      salt: ethers.utils.hexZeroPad((ethers.BigNumber.from(137)).toHexString(), 32)
    };
    var dataToSign = JSON.stringify({
      types: {
        EIP712Domain: domainType,
        MetaTransaction: metaTransactionType,
      },
      domain: domainData,
      primaryType: "MetaTransaction",
      message: message,
    });
    var signature = await walletProvider.send("eth_signTypedData_v3", [addr[0], dataToSign]);
    var { r, s, v } = getSignatureParameters(signature);
    const tx = await ERC20Contract.methods.executeMetaTransaction(addr[0], functionSignature, r, s, v).send({
      from: addr[0],
      gasPrice: response.data.gasPrice,
      gas: 200000
    });
    console.log(tx);
    const gasSwapContract = new web3.eth.Contract(GasSwapABI, GASSWAP_CONTRACT_ADDR);
    const gasSwapContractInterface = new ethers.utils.Interface(GasSwapABI);
    var functionSignature = await gasSwapContractInterface.encodeFunctionData("fillQuote", [response.data.allowanceTarget, response.data.data])
    var nonce = await gasSwapContract.methods.getNonce(addr[0]).call();
    var message = {
      nonce: nonce,
      from: addr[0],
      functionSignature: functionSignature
    };
    var domainData = {
      name: "GasSwap",
      version: "2",
      verifyingContract: GASSWAP_CONTRACT_ADDR,
      salt: ethers.utils.hexZeroPad((ethers.BigNumber.from(137)).toHexString(), 32)
    };
    var dataToSign = JSON.stringify({
      types: {
        EIP712Domain: domainType,
        MetaTransaction: metaTransactionType,
      },
      domain: domainData,
      primaryType: "MetaTransaction",
      message: message,
    });
    var signature = await walletProvider.send("eth_signTypedData_v3", [addr[0], dataToSign]);
    var { r, s, v } = getSignatureParameters(signature);
    const tx2 = await gasSwapContract.methods.executeMetaTransaction(addr[0], functionSignature, r, s, v).send({
      from: addr[0],
      gasPrice: response.data.gasPrice,
      gas: 750000
    });
    console.log(tx2);
  }

  return (
    <React.Fragment>
      <button className="square" onClick={connectWeb3}>
        Connect wallet
      </button>

      <button className="square" onClick={doSomething}>
        Trigger metatx
      </button>
    </React.Fragment>
  );
}

export default App;
