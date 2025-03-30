'use client';

import { useLedgerStore } from '@/shared/store/ledgerStore';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import { FiLogIn, FiLogOut, FiCopy, FiCheck } from 'react-icons/fi';

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

    const truncateAddress = (address: string) =>
        `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
        <div className="max-w-md mx-auto bg-gray-900 rounded-xl overflow-hidden shadow-lg p-6 space-y-4">
            {/* Network Indicator */}
            {chainId && (
                <div className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded-lg">
                    <span className="text-sm font-medium text-gray-300">Network</span>
                    <span className="text-sm font-semibold text-green-400">
                        {networkName || `Chain ID: ${chainId}`}
                    </span>
                </div>
            )}

            {/* Connection Status */}
            <div className={`p-4 rounded-lg transition-all ${walletConnected ? 'bg-green-900/20 border border-green-500' : 'bg-gray-800'}`}>
                {walletConnected ? (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-300 text-sm">Connected as</span>
                            <button
                                onClick={handleDisconnect}
                                className="flex items-center gap-1 text-red-400 hover:text-red-300 text-sm"
                            >
                                <FiLogOut size={14} /> Disconnect
                            </button>
                        </div>

                        <div className="flex items-center justify-between bg-gray-800 px-4 py-3 rounded-lg">
                            <span className="font-mono text-blue-300">
                                {truncateAddress(currentAddress!)}
                            </span>
                            <button
                                onClick={copyAddress}
                                className="text-gray-400 hover:text-white transition-colors"
                                aria-label="Copy address"
                            >
                                {copied ? <FiCheck size={18} /> : <FiCopy size={18} />}
                            </button>
                        </div>

                        <button
                            onClick={handleSign}
                            disabled={isSigning}
                            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors ${isSigning ? 'opacity-70' : ''}`}
                        >
                            {isSigning ? 'Signing...' : 'Sign Test Message'}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleConnect}
                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-lg transition-all"
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

            {/* Chain Warning */}
            {chainId && chainId !== 1 && (
                <div className="p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-yellow-200 text-sm">
                    Youre not on Ethereum Mainnet
                </div>
            )}
        </div>
    );
}