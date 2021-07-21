import React, { useCallback, useContext, useState } from 'react';
import Web3 from 'web3';
import Web3Modal from 'web3modal';
import { Biconomy } from "@biconomy/mexa";
import WalletConnectProvider from '@walletconnect/web3-provider';

export const Web3Context = React.createContext({});
export const useWeb3Context = () => useContext(Web3Context);

const providerOptions = {
  walletconnect: {
    package: WalletConnectProvider,
    options: {
      infuraId: "196440d5d02d41dfa2a8ee5bfd2e96bd",
    },
  },
};

const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions,
});

export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(undefined);
  const [biconomyProvider, setBiconomyProvider] = useState(undefined);

  const connectWeb3 = async () => {
    try {
      const externalProvider = await web3Modal.connect();

      const biconomy = new Biconomy(
        new Web3.providers.HttpProvider("https://matic-mainnet-full-rpc.bwarelabs.com"),
        {
          apiKey: 'api_key_here',
          debug: true
        }
      );
      setBiconomyProvider(new Web3(biconomy));

      let w3 = new Web3(externalProvider);
      setProvider(w3);

      biconomy
        .onEvent(biconomy.READY, () => {
          console.log("initialized");
        })
        .onEvent(biconomy.ERROR, (error, message) => {
          console.log(error);
          console.log(message);
        });
    } catch (e) {
      console.log("NO_WALLET_CONNECTED", e);
    }
  };

  const disconnect = useCallback(async () => {
    web3Modal.clearCachedProvider();
    setProvider(undefined);
  }, []);

  return (
    <Web3Context.Provider
      value={{
        connectWeb3,
        disconnect,
        provider,
        biconomyProvider
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};