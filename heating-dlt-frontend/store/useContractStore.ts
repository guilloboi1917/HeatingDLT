import { create } from "zustand";
import { ethers } from "ethers";
import { toast } from "@/components/ui/use-toast";
import SmartMeterCollectionAbi from "@/contracts/SmartMeterCollection.json";
import { mock } from "node:test";
import { Tenant, SmartMeter, Bill } from "@/types/types";
import { add } from "date-fns";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

type ContractState = {
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  account: string | null;
  contract: ethers.Contract | null;
  isConnected: boolean;
  isAdmin: boolean;
  isTenant: boolean;
  tokenBalance: number;

  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;

  // tenant management
  getTenants: () => Promise<Tenant[]>;
  addTenant: (address: string, name: string) => Promise<boolean>;
  removeTenant: (address: string) => Promise<boolean>;

  // billing
  getBills: (address: string) => Promise<Bill[]>;
  payBill: (billId: string, amount: Number) => void;

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
  isConnected: false,
  isAdmin: false,
  isTenant: false,
  tokenBalance: 0,

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

      let tokenBalance = 0;
      if (isTenant) {
        tokenBalance = Number(await contract.getTokenBalance());
      }

      set({
        provider: web3Provider,
        signer,
        account,
        contract,
        isConnected: true,
        isAdmin,
        isTenant,
        tokenBalance,
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
      isConnected: false,
      isAdmin: false,
      isTenant: false,
      tokenBalance: 0,
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
      const fetchedTenantsAddress: string[] = await contract.getTenants();

      const tenants: Tenant[] = fetchedTenantsAddress.map(
        (address: string, index) => ({
          address: address,
          name: "TestName_" + index,
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
      const bills: Bill[] = await contract.getBills(address);
      console.log(bills);
      return bills;
    } catch (err) {
      console.error("Error fetching bills for ", address, " -- ", err);
    }
    return [] as Bill[];
  },

  payBill: async (billId: string, amount: Number) => {},

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
