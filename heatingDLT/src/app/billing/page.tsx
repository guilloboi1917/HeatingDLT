'use client'

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useLedgerStore } from '@/shared/store/useLedgerStore';
import collectionABI from '@/contracts/SmartMeterCollection.json'; // change this to actual path so no need to copy paste
import { FiCheck, FiX } from 'react-icons/fi';


interface Bill {
  billId: string; // should be a unique hash from biller, billee, amount and date issuance
  paid: boolean;
  biller: string;
  billee: string;
  amountHEAT: bigint;
  dateIssuance: bigint;
  datePaid: bigint;
  description: string;
}
export default function Billing() {

  const [readBillsError, setReadBillsError] = useState<string | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setIsLoading] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payBillError, setPayBillError] = useState<string | null>(null);
  const [tokenSupply, setTokenSupply] = useState<bigint | null>(null);

  const {
    currentAddress,
    walletConnected,
    chainId,
    networkName
  } = useLedgerStore();


  async function readBillsData() {
    if (!walletConnected || !currentAddress) {
      setReadBillsError('Please connect your wallet first');
      return;
    }

    try {
      setIsLoading(true);
      setReadBillsError(null);

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

      const data: Bill[] = await contract.getBills(signer);

      // 4. Format the data
      const formattedData = data.map((item: any) => ({
        billId: item.billId,
        paid: item.paid,
        biller: item.biller,
        billee: item.billee,
        amountHEAT: item.amountHEAT.toString(),
        dateIssuance: new Date(Number(item.dateIssuance) * 1000).toLocaleString(),
        datePaid: new Date(Number(item.datePaid) * 1000).toLocaleString(),
        description: item.description
      }));

      setBills(formattedData);

      const supply = await contract.getTokenSupply();

      setTokenSupply(supply.toString());
    }
    catch (err) {
      console.error("Failed to read bills data:", err);
      setReadBillsError('Failed to fetch bills data');
    }
    finally {
      setIsLoading(false);
    }

  }

  async function payBill(billId, amountHEAT) {
    if (!walletConnected || !currentAddress) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      setIsPaying(true);
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

      await contract.payBill(billId, amountHEAT);
    }
    catch (err) {
      console.error("Failed to pay bill:", err);
      setPayBillError('Failed to pay bill');
    } finally {
      setIsPaying(false);

      // read new bills data
      readBillsData();
    }
  }


  useEffect(() => {
    if (walletConnected) {
      readBillsData();
    }
  }, [walletConnected, currentAddress]);



  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 bg-gray-50">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Token Supply
        <p className='font-medium text-gray-700'>{tokenSupply} Wei</p>
      </h2>

      <div className="w-full max-w-4xl bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Bills</h2>

        {loading && <p className="text-center py-4 text-gray-500">Loading meter data...</p>}

        {readBillsError && (
          <div className="text-red-500 p-4 bg-red-50 rounded-md flex items-center justify-between">
            <span>{readBillsError}</span>
            <button
              onClick={readBillsData}
              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {bills.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-3 font-medium text-gray-700">Bill Id</th>
                  <th className="text-left p-3 font-medium text-gray-700">Paid</th>
                  {/* <th className="text-left p-3 font-medium text-gray-700">Biller</th> */}
                  {/* <th className="text-left p-3 font-medium text-gray-700">Billee</th> */}
                  <th className="text-left p-3 font-medium text-gray-700">amountHEAT</th>
                  <th className="text-left p-3 font-medium text-gray-700">dateIssuance</th>
                  <th className="text-left p-3 font-medium text-gray-700">datePaid</th>
                  <th className="text-left p-3 font-medium text-gray-700">description</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((data, index) => (
                  <tr
                    key={index}
                    className={`border-b hover:bg-gray-50 transition-colors ${!data.paid ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    onClick={() => {
                      if (!data.paid) {  // Only allow clicking unpaid bills
                        payBill(data.billId, data.amountHEAT);
                      }
                    }}
                  >
                    <td className="p-3 text-gray-800">{data.billId}</td>
                    <td className="p-3 text-gray-800">{data.paid ? <FiCheck size={18} /> : <FiX size={18} />}</td>
                    {/* <td className="p-3 text-gray-600">{data.biller}</td> */}
                    {/* <td className="p-3 text-gray-800">{data.billee}</td> */}
                    <td className="p-3 text-gray-800">{data.amountHEAT}</td>
                    <td className="p-3 text-gray-600">{data.dateIssuance}</td>
                    <td className="p-3 text-gray-600">{data.datePaid}</td>
                    <td className="p-3 text-gray-600">{data.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !loading && !readBillsError && (
            <p className="text-center py-8 text-gray-500">No bills available</p>
          )
        )}
      </div>
    </div>
  );
}
