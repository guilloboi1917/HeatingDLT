// Using ethers.js with wallet providers
import { ethers } from 'ethers';

export default function Dashboard() {

  async function initializeProvider() {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Only store public information
      useLedgerStore.getState().connectWallet(address, 'metamask');

      return { provider, signer };
    }
    throw new Error("No Ethereum provider found");
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
    </div>
  );
}
