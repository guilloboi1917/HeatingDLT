'use client'

import { useLedgerStore } from '@/shared/store/useLedgerStore';
import { ethers } from 'ethers';
import { useEffect, useState } from 'react';

// Import your contract ABI (create this file from your compiled contract)
import collectionABI from '@/contracts/SmartMeterCollection.json';

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

export default function Dashboard() {

  const {
    currentAddress,
    walletConnected,
    chainId,
    networkName
  } = useLedgerStore();

  const [meterData, setMeterData] = useState<any[]>([]);
  const [meterInfo, setMeterInfo] = useState<SmartMeterInfo>();
  const [loading, setLoading] = useState(false);
  const [readMeasurementError, setReadMeasurementError] = useState<string | null>(null);
  const [readInfoError, setReadInfoError] = useState<string | null>(null);


  async function readMeasurementData() {
    if (!walletConnected || !currentAddress) {
      setReadMeasurementError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setReadMeasurementError(null);

      // 1. Connect to local Hardhat network
      const provider = new ethers.BrowserProvider(window.ethereum);

      // 2. Get contract instance
      const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default Hardhat first contract address
      const contract = new ethers.Contract(
        contractAddress,
        collectionABI.abi,
        provider
      );

      // 3. Call getMeterData function
      // Then in your readData function:
      const data: Measurement[] = await contract.getMeterData(currentAddress);

      // 4. Format the data
      const formattedData = data.map((item: any) => ({
        timestamp: new Date(Number(item.timestamp) * 1000).toLocaleString(),
        value: item.value.toString(), // or formatUnits for decimals
        unit: item.unit
      }));

      setMeterData(formattedData);
    } catch (err) {
      console.error("Failed to read data:", err);
      setReadMeasurementError('Failed to fetch meter data');
    } finally {
      setLoading(false);
    }
  }

  async function readMeterInfo() {
    if (!walletConnected || !currentAddress) {
      setReadInfoError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setReadInfoError(null);

      // 1. Connect to local Hardhat network
      const provider = new ethers.BrowserProvider(window.ethereum);

      // 2. Get contract instance
      const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Default Hardhat first contract address
      const contract = new ethers.Contract(
        contractAddress,
        collectionABI.abi,
        provider
      );

      // 3. Call getMeterData function
      // Then in your readData function:
      const data: SmartMeterInfo = await contract.getMeterInfo(currentAddress);

      console.log(data)

      // // 4. Format the data
      // const formattedData = data.map((item: any) => ({
      //   timestamp: new Date(Number(item.timestamp) * 1000).toLocaleString(),
      //   value: item.value.toString(), // or formatUnits for decimals
      //   unit: item.unit
      // }));

      setMeterInfo(data);
    } catch (err) {
      console.error("Failed to read meter info data:", err);
      setReadInfoError('Failed to fetch meter info data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (walletConnected) {
      readMeasurementData();
      readMeterInfo();
    }
  }, [walletConnected, currentAddress]);



  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 bg-gray-50">
  {/* Meter Info Section */}
  <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6 mb-8">
    <h2 className="text-2xl font-bold mb-6 text-gray-800">Meter Information</h2>
    
    {loading && <p className="text-center py-4 text-gray-500">Loading meter info...</p>}

    {readInfoError && (
      <div className="text-red-500 p-4 bg-red-50 rounded-md flex items-center justify-between">
        <span>{readInfoError}</span>
        <button
          onClick={readMeterInfo}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    )}

    {meterInfo && (
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
            <tr className="border-b hover:bg-gray-50">
              <td className="p-3 text-gray-800">{meterInfo.name}</td>
              <td className="p-3 text-gray-800">{meterInfo.ownerName}</td>
              <td className="p-3 text-gray-600 font-mono text-sm">{meterInfo.smartMeterAddress}</td>
              <td className="p-3 text-gray-800">{meterInfo.smartMeterId}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  meterInfo.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {meterInfo.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )}

    {!loading && meterInfo === null && !readInfoError && (
      <p className="text-center py-8 text-gray-500">No meter information found</p>
    )}
  </div>

  {/* Meter Data Section */}
  <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6">
    <h2 className="text-2xl font-bold mb-6 text-gray-800">Meter Readings</h2>
    
    {loading && <p className="text-center py-4 text-gray-500">Loading meter data...</p>}

    {readMeasurementError && (
      <div className="text-red-500 p-4 bg-red-50 rounded-md flex items-center justify-between">
        <span>{readMeasurementError}</span>
        <button
          onClick={readMeasurementData}
          className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    )}

    {meterData.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="text-left p-3 font-medium text-gray-700">Timestamp</th>
              <th className="text-left p-3 font-medium text-gray-700">Value</th>
              <th className="text-left p-3 font-medium text-gray-700">Unit</th>
            </tr>
          </thead>
          <tbody>
            {meterData.map((data, index) => (
              <tr 
                key={index} 
                className="border-b hover:bg-gray-50 transition-colors"
              >
                <td className="p-3 text-gray-800">{data.timestamp}</td>
                <td className="p-3 text-gray-800 font-medium">{data.value}</td>
                <td className="p-3 text-gray-600">{data.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      !loading && !readMeasurementError && (
        <p className="text-center py-8 text-gray-500">No meter data available</p>
      )
    )}
  </div>
</div>
  );
}
