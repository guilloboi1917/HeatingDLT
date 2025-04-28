import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type WalletType = 'metamask' | 'walletconnect' | 'coinbase' | null;

interface LedgerState {
  currentAddress: string | null;
  walletConnected: boolean;
  walletType: WalletType;
  chainId: number | null;
  networkName: string | null;
  connectWallet: (address: string, walletType: WalletType) => void;
  disconnectWallet: () => void;
  setNetworkInfo: (chainId: number, networkName: string) => void;
}

export const useLedgerStore = create<LedgerState>()(
  persist(
    (set) => ({
      currentAddress: null,
      walletConnected: false,
      walletType: null,
      chainId: null,
      networkName: null,

      connectWallet: (address, walletType) => {
        set({
          currentAddress: address,
          walletConnected: true,
          walletType,
        });
      },

      disconnectWallet: () => {
        set({
          currentAddress: null,
          walletConnected: false,
          walletType: null,
          chainId: null,
          networkName: null,
        });
      },

      setNetworkInfo: (chainId, networkName) => {
        set({ chainId, networkName });
      },
    }),
    {
      name: 'heatingdlt-ledger-storage', // localStorage key
    }
  )
);