'use client';

import { useLedgerStore } from '@/shared/store/useLedgerStore';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { FiLogIn, FiLogOut, FiCopy, FiCheck } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function WalletComponent() {
    const {
        currentAddress,
        walletConnected,
        connectWallet,
        disconnectWallet,
        setNetworkInfo,
        chainId,
        networkName
    } = useLedgerStore();

    const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [isSigning, setIsSigning] = useState(false);
    const router = useRouter();

    // Initialize provider
    useEffect(() => {
        if (walletConnected && window.ethereum) {
            const initProvider = async () => {
                try {
                    const newProvider = new ethers.BrowserProvider(window.ethereum);
                    setProvider(newProvider);

                    const network = await newProvider.getNetwork();
                    setNetworkInfo(Number(network.chainId), network.name);

                    window.ethereum.on('accountsChanged', (accounts: string[]) => {
                        accounts.length > 0 ? connectWallet(accounts[0], 'metamask') : disconnectWallet();
                    });

                    window.ethereum.on('chainChanged', () => window.location.reload());

                } catch (err) {
                    setError('Provider initialization failed');
                    console.error(err);
                }
            };

            initProvider();
            return () => window.ethereum?.removeAllListeners();
        }
    }, [walletConnected]);

    const handleConnect = async () => {
        try {
            if (!window.ethereum) throw new Error('Please install MetaMask');
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            connectWallet(accounts[0], 'metamask');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Connection failed');
        }
    };

    const handleDisconnect = () => {
        disconnectWallet();
        setProvider(null);
    };

    const copyAddress = () => {
        if (!currentAddress) return;
        navigator.clipboard.writeText(currentAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSign = async () => {
        if (!provider) return;
        try {
            setIsSigning(true);
            const signer = await provider.getSigner();
            await signer.signMessage("Hello Web3");
            // Optional: Add toast notification
        } catch (err) {
            setError('User rejected signing');
        } finally {
            setIsSigning(false);
        }
    };

    const handleContinue = async () => {
        if (!walletConnected) return;

        router.push('/dashboard')
    }

    const truncateAddress = (address: string) =>
        `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
        <div className="max-w-md mx-auto bg-white rounded-xl overflow-hidden shadow-lg p-4 space-y-4">
            {/* Connection Status */}
            <div className={`p-4 rounded-lg transition-all space-y-3`}>
                {/* Network Indicator */}
                {chainId && (
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-base font-medium text-gray-700">Network</span>
                        <span className="text-base font-semibold text-green-400">
                            {networkName || `Chain ID: ${chainId}`}
                        </span>
                    </div>
                )}
                {walletConnected ? (
                    <div className="space-y-3">
                        {/* <div className="text-center">
                            <span className="text-black text-base">Connected as</span>
                        </div> */}

                        <div className="flex items-center justify-between px-4 py-3 rounded-lg">
                            <span className="font-mono text-gray-700">
                                {truncateAddress(currentAddress!)}
                            </span>
                            <button
                                onClick={copyAddress}
                                className="text-gray-400 hover:text-black transition-colors"
                                aria-label="Copy address"
                            >
                                {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
                            </button>
                        </div>

                        {/* <button
                            onClick={handleSign}
                            disabled={isSigning}
                            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gray-800 hover:bg-gray-600 transition-colors ${isSigning ? 'opacity-70' : ''}`}
                        >
                            {isSigning ? 'Signing...' : 'Sign Test Message'}
                        </button> */}

                        <button
                            onClick={handleContinue}
                            disabled={!walletConnected}
                            className={`flex items-center justify-between bg-black px-4 py-3 text-white rounded-lg hover:bg-gray-600 transition-colors`}
                        >
                            Continue to dashboard
                        </button>

                        <button
                            onClick={handleDisconnect}
                            className="mx-auto px-4 py-2 flex items-center gap-1 text-red-400 hover:text-red-600 text-base"
                        >
                            <FiLogOut size={14} /> Disconnect
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleConnect}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-black hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        <FiLogIn size={18} /> Connect Wallet
                    </button>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm animate-pulse">
                    {error}
                </div>
            )}
        </div>
    );
}