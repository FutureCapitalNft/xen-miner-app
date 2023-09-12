import getConfig from 'next/config';
import { createContext, useState } from 'react';
import { useAccount, useContractRead, useNetwork } from 'wagmi';

import type { TXenCryptoContext } from './types';

const { publicRuntimeConfig } = getConfig();
const xenCryptoAddress = publicRuntimeConfig.xenCryptoAddress;
const xenCryptoABI = publicRuntimeConfig.xenCryptoABI;

const initialValue: TXenCryptoContext = {
  balance: 0n,
  isFetching: false,
  refetchUserBalance: () => {},
};

export const XenCryptoContext = createContext<TXenCryptoContext>(initialValue);

export const XenCryptoProvider = ({ children }: any) => {
  const [balance, setBalance] = useState(0n);
  const { chain } = useNetwork();
  const { address } = useAccount();
  const xenContract = () => ({
    address: xenCryptoAddress,
    abi: xenCryptoABI
  });

  const { refetch: refetchUserBalance, isFetching } = useContractRead({
    ...xenContract(),
    functionName: 'balanceOf',
    args: [address],
    account: address,
    chainId: chain?.id,
    onSuccess: balance => {
      setBalance((balance as unknown) as bigint);
    }
  });

  return (
    <XenCryptoContext.Provider
      value={{
        balance,
        isFetching,
        refetchUserBalance,
      }}
    >
      {children}
    </XenCryptoContext.Provider>
  );
};
