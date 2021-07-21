
import React from 'react';
import Web3 from 'web3';
import { useWeb3Context } from "./Web3Context";

function App() {
  const { connectWeb3, provider } = useWeb3Context();

  const doSomething = async () => {
    const web3 = new Web3(provider);
    const addr = await web3.eth.getAccounts();
    console.log(addr[0]);
  }

  return (
    <React.Fragment>
      <button className="square" onClick={connectWeb3}>
        Connect wallet
      </button>

      <button className="square" onClick={doSomething}>
        Do something
      </button>
    </React.Fragment>
  );
}

export default App;
