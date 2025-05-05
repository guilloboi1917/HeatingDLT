import { create } from "zustand";
import { ethers } from "ethers";
import { toast } from "@/components/ui/use-toast";
import SmartMeterCollectionAbi from "@/contracts/SmartMeterCollection.json";
import TNCYAbi from "@/contracts/TNCY.json";
import BillingManagerAbi from "@/contracts/BillingManager.json";
import { mock } from "node:test";
import { Tenant, SmartMeter, Bill, AddressInfo } from "@/types/types";
import { add } from "date-fns";
import TokenBalance from "@/components/token-balance";
import { RSC_ACTION_CLIENT_WRAPPER_ALIAS } from "next/dist/lib/constants";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export function parseBill(raw: any): Bill {
  return {
    billId: raw.billId,
    paid: raw.paid,
    biller: raw.biller,
    billee: raw.billee,
    amountTNCY: BigInt(raw.amountTNCY),
    dateIssuance: Number(raw.dateIssuance),
    datePaid: Number(raw.datePaid),
    description: raw.description,
  };
}

type ContractState = {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  contract: ethers.Contract | null;
  tokenContract: ethers.Contract | null;
  billingManagerContract: ethers.Contract | null;
  isConnected: boolean;
  isAdmin: boolean;
  isTenant: boolean;
  tokenBalance: number; // maybe change to bigint and already format
  fullName: string | null;
  ownerName: string | null;
  ownerContactInfo: AddressInfo;

  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;

  // tenant management
  getTenants: () => Promise<Tenant[]>;
  addTenant: (address: string, name: string) => Promise<boolean>;
  removeTenant: (address: string) => Promise<boolean>;

  // billing
  getBills: (address: string) => Promise<Bill[]>;
  payBill: (billId: string, amount: Number) => Promise<boolean>;

  // smart meter management
  getSmartMeters: () => Promise<SmartMeter[]>;
  registerSmartMeter: (
    name: string,
    ownerName: string,
    address: string,
    smartMeterId: string
  ) => void;
  //   getSmartMeterInfo: (address: string) => Promise<SmartMeter>;
};

export const useContractStore = create<ContractState>((set, get) => ({
  provider: null,
  signer: null,
  account: null,
  contract: null,
  tokenContract: null,
  billingManagerContract: null,
  isConnected: false,
  isAdmin: false,
  isTenant: false,
  tokenBalance: 0,
  fullName: null,
  ownerName: null,
  ownerContactInfo: null,

  connectWallet: async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast({
        title: "No Wallet",
        description: "Install MetaMask",
        variant: "destructive",
      });
      return;
    }

    try {
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const signer = await web3Provider.getSigner();
      const account = accounts[0];
      const contract = new ethers.Contract(
        CONTRACT_ADDRESS,
        SmartMeterCollectionAbi.abi,
        signer
      );

      // Assume getRole() and getTokenBalance() exist on your contract
      const role = await contract.getRole();
      const isAdmin = role === "admin";
      const isTenant = role === "tenant";

      let fullName = null;
      if (isTenant) {
        fullName = await contract.getTenantName(account);
      }
      const ownerName = await contract.getOwnerName();
      const ownerContactInfo = await contract.getOwnerContactInfo();

      let tokenBalance = 0;
      tokenBalance = Number(await contract.getTokenBalance());

      const TOKENCONTRACT_ADDRESS = await contract.getTNCYAddress();

      const tokenContract = new ethers.Contract(
        TOKENCONTRACT_ADDRESS,
        TNCYAbi.abi,
        signer
      );

      const BILLINGMANAGERCONTRACT_ADDRESS = await contract.billingManager();

      const billingManagerContract = new ethers.Contract(
        BILLINGMANAGERCONTRACT_ADDRESS,
        BillingManagerAbi.abi,
        signer
      );

      set({
        provider: web3Provider,
        signer,
        account,
        contract,
        tokenContract,
        billingManagerContract,
        isConnected: true,
        isAdmin,
        isTenant,
        tokenBalance,
        fullName,
        ownerName,
        ownerContactInfo,
      });

      toast({ title: "Connected", description: "Wallet connected!" });
    } catch (err) {
      console.error(err);
      toast({
        title: "Connection Failed",
        description: "Could not connect wallet",
        variant: "destructive",
      });
    }
  },

  disconnectWallet: () => {
    set({
      provider: null,
      signer: null,
      account: null,
      contract: null,
      tokenContract: null,
      billingManagerContract: null,
      isConnected: false,
      isAdmin: false,
      isTenant: false,
      tokenBalance: 0,
      fullName: null,
      ownerName: null,
      ownerContactInfo: null,
    });

    toast({ title: "Disconnected", description: "Wallet disconnected." });
  },

  getTenants: async (): Promise<Tenant[]> => {
    const { contract } = get();
    if (!contract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      return [];
    }
    try {
      const fetchedInfo = await contract.getTenants();
      const fetchedTenantsAddress: string[] = await fetchedInfo[0];
      const fetchedTenantsName: string[] = fetchedInfo[1];

      const tenants: Tenant[] = fetchedTenantsAddress.map(
        (address: string, index) => ({
          address: address,
          name: fetchedTenantsName[index] + " (Tenant " + (index + 1) + ")"
        })
      );

      return tenants;
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to fetch tenants.",
        variant: "destructive",
      });
      return [];
    }
  },

  addTenant: async (address: string, name: string): Promise<boolean> => {
    const { contract } = get();
    if (!contract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const tx = await contract.addTenant(address, name);
      await tx.await();
      return true;
    } catch (error) {
      console.error("Error adding tenant:", error);
      return false;
    }
  },

  removeTenant: async (address: string): Promise<boolean> => {
    const { contract } = get();
    if (!contract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      return false;
    }

    try {
      const tx = await contract.removeTenant(address);
      await tx.await();
      return true;
    } catch (error) {
      console.error("Error removing tenant:", error);
      return false;
    }
  },

  getBills: async (address: string): Promise<Bill[]> => {
    const { contract } = get();
    if (!contract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      // return empty array
      return [] as Bill[];
    }

    try {
      console.log("getting bills");
      const rawBills = await contract.getBills(address);
      console.log(rawBills);

      const bills = rawBills.map(parseBill);

      return bills;
    } catch (err) {
      console.error("Error fetching bills for ", address, " -- ", err);
    }
    return [] as Bill[];
  },

  payBill: async (billId: string, amount: Number): Promise<boolean> => {
    const { contract, tokenContract, billingManagerContract, account } = get();
    if (!contract || !tokenContract || !billingManagerContract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      // return empty array
      return false;
    }

    console.log(contract, tokenContract, billingManagerContract);

    // Convert amount to correct units (e.g., wei)
    try {
      // First approve tokens
      // This is not tidy
      try {
        const approveTx = await tokenContract.approve(
          billingManagerContract.target,
          amount,
          { gasLimit: 1000000 }
        );
        await approveTx.wait(); // wait for mining
      } catch (err) {
        console.error("Couldn't do allowance: ", err);
      }

      try {
        const payTx = await contract.payBillOnBehalf(billId, account);
        await payTx.wait(); // wait for mining
      } catch (err) {
        console.error("Couldn't pay on behalf: ", err);
      }
      toast({
        title: "Payment succesful!",
        description: "",
      });

      try {
        const newBalance = await contract.getTokenBalance();
        set({ tokenBalance: newBalance });
      } catch (err) {
        console.error("Couldn't fetch new token balance");
      }

      return true;
    } catch (err) {
      console.error("PAYMENT FAILED! \n", err);
      return false;
    }
  },

  getSmartMeters: async (): Promise<SmartMeter[]> => {
    const { contract } = get();
    if (!contract) {
      toast({
        title: "Not connected",
        description: "Connect wallet first.",
        variant: "destructive",
      });
      // return empty array
      return [] as SmartMeter[];
    }

    try {
      const smartMetersAddress: string[] = await contract.getSmartMeters();
      console.log("smart meter addresses", smartMetersAddress);

      // Use Promise.all for async mapping
      const smartMeterPromises = smartMetersAddress.map(
        async (address: string) => {
          try {
            return await contract.getMeterInfo(address);
          } catch (err) {
            console.error(`Error fetching smartMeter ${address}:`, err);
            // Return a fallback object or null (will be filtered out)
            return {
              address: address,
              name: "Unknown",
              ownerName: "Unknown",
              smartMeterAddress: "Unknown",
              smartMeterId: "Unknown",
              isActive: false,
              // other required SmartMeter properties
            } as SmartMeter;
          }
        }
      );

      // Wait for all promises and filter out nulls if needed
      const smartMeters = (await Promise.all(smartMeterPromises)).filter(
        Boolean
      );
      return smartMeters;
    } catch (error) {
      console.error("Error fetching smartMeters:", error);
      return [];
    }
  },

  registerSmartMeter: (
    name: string,
    ownerName: string,
    address: string,
    smartMeterId: string
  ): void => {},

  // getEnergyUsage

  //   addSmartMeter: async (meterId: string, location: string) => {
  //     const { contract, account } = get();
  //     if (!contract || !account) {
  //       toast({
  //         title: "Not connected",
  //         description: "Connect wallet first.",
  //         variant: "destructive",
  //       });
  //       return;
  //     }
  //     try {
  //       const tx = await contract.addSmartMeter(meterId, location);
  //       await tx.wait();
  //       toast({ title: "Success", description: "Smart meter added!" });
  //     } catch (err) {
  //       console.error(err);
  //       toast({
  //         title: "Error",
  //         description: "Failed to add smart meter.",
  //         variant: "destructive",
  //       });
  //     }
  //   },

  //   mintToken: async (amount: number) => {
  //     const { contract, account } = get();
  //     if (!contract || !account) {
  //       toast({
  //         title: "Not connected",
  //         description: "Connect wallet first.",
  //         variant: "destructive",
  //       });
  //       return;
  //     }
  //     try {
  //       const tx = await contract.mintToken(account, amount);
  //       await tx.wait();
  //       toast({ title: "Success", description: "Tokens minted!" });
  //     } catch (err) {
  //       console.error(err);
  //       toast({
  //         title: "Error",
  //         description: "Failed to mint tokens.",
  //         variant: "destructive",
  //       });
  //     }
  //   },
}));
