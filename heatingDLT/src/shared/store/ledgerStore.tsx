import { create } from 'zustand';

interface LedgerState {
  currentAddress: string | null;
  walletConnected: boolean;
  walletType: 'metamask' | 'walletconnect' | 'coinbase' | null;
  chainId: number | null;
  networkName: string | null;
  connectWallet: (address: string, walletType: 'metamask' | 'walletconnect' | 'coinbase') => void;
  disconnectWallet: () => void;
  setNetworkInfo: (chainId: number, networkName: string) => void;
}

export const useLedgerStore = create<LedgerState>((set) => ({
  currentAddress: null,
  walletConnected: false,
  walletType: null,
  chainId: null,
  networkName: null,
  
  connectWallet: (address, walletType) => set({
    currentAddress: address,
    walletConnected: true,
    walletType,
  }),
  
  disconnectWallet: () => set({
    currentAddress: null,
    walletConnected: false,
    walletType: null,
    chainId: null,
    networkName: null,
  }),
  
  setNetworkInfo: (chainId, networkName) => set({ chainId, networkName }),
}));