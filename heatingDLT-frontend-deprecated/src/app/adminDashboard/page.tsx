'use client'

import { useLedgerStore } from '@/shared/store/useLedgerStore';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';
import MeterChart from '@/shared/components/MeterChart';

// Import your contract ABI (create this file from your compiled contract)
import collectionABI from '@/contracts/SmartMeterCollection.json'; // change this to actual path so no need to copy paste

interface Measurement {
  timestamp: number;
  value: bigint;
  unit: string;
}

interface SmartMeterInfo {
  name: string;
  ownerName: string;
  smartMeterAddress: string;
  smartMeterId: string;
  isActive: boolean;
}

export default function AdminDashboard() {

  const {
    currentAddress,
    walletConnected,
    chainId,
    networkName
  } = useLedgerStore();

  const [smartMeters, setSmartMeters] = useState<SmartMeterInfo[] | null>(null);
  const [metersAddress, setMetersAddress] = useState<string[] | null>(null);
  const [fetchMetersError, setFetchMetersError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  async function getSmartMetersInfo() {
    if (!walletConnected || !currentAddress) {
      return;
    }

    try {
      setLoading(true);

      // 1. Connect to local Hardhat network
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner(currentAddress); // Get signer for current address

      // 2. Get contract instance
      const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default Hardhat first contract address
      const contract = new ethers.Contract(
        contractAddress,
        collectionABI.abi,
        signer
      );

      const smartMeterAddresses = await contract.getSmartMeters();

      let fetchedSmartMeters: SmartMeterInfo[]= [];

      for (let index = 0; index < smartMeterAddresses.length; index++) {
        const address = smartMeterAddresses[index];
        try {
          const smartMeter: SmartMeterInfo = await contract.smartMeters(address);
          fetchedSmartMeters.push(smartMeter);
        }
        catch (err) {
          console.log(err);
          console.log("Couldn't fetch info for smart meter: " + address);
        }
      }

      setSmartMeters(fetchedSmartMeters);

    } catch (err) {
      setFetchMetersError('Failed to fetch meters');
      console.error("Failed to read meter info data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (walletConnected) {
      getSmartMetersInfo();
    }
  }, [walletConnected, currentAddress]);



  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 bg-gray-50">
      {/* Meter Info Section */}
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">My Smart Meters</h2>

        {loading && <p className="text-center py-4 text-gray-500">Loading smart meters...</p>}

        {fetchMetersError && (
          <div className="text-red-500 p-4 bg-red-50 rounded-md flex items-center justify-between">
            <span>{fetchMetersError}</span>
            <button
              onClick={getSmartMetersInfo}
              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {smartMeters && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 font-medium text-gray-700">Name</th>
                  <th className="text-left p-3 font-medium text-gray-700">Owner</th>
                  <th className="text-left p-3 font-medium text-gray-700">Address</th>
                  <th className="text-left p-3 font-medium text-gray-700">ID</th>
                  <th className="text-left p-3 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {smartMeters?.map((data, index) => (

                  <tr
                    key={index}
                    className="border-b hover:bg-gray-50">
                    <td className="p-3 text-gray-800">{data.name}</td>
                    <td className="p-3 text-gray-800">{data.ownerName}</td>
                    <td className="p-3 text-gray-600 font-mono text-sm">{data.smartMeterAddress}</td>
                    <td className="p-3 text-gray-800">{data.smartMeterId}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${data.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                        }`}>
                        {data.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        )}

        {!loading && smartMeters === null && !fetchMetersError && (
          <p className="text-center py-8 text-gray-500">No meter information found</p>
        )}
      </div>
    </div>
  );
}
