// lib/ipfs.ts
import { Await, createHelia } from "helia";
import { unixfs } from "@helia/unixfs";
import { CID } from "multiformats/cid";
import { create } from "ipfs-http-client";
import { AwardIcon } from "lucide-react";

// Cache Helia instance for performance
let heliaInstance: Awaited<ReturnType<typeof createHelia>> | null = null;
let ipfsInstance: Awaited<ReturnType<typeof create>> | null = null;

async function getHelia() {
  if (!heliaInstance) {
    heliaInstance = await createHelia();
  }
  return {
    helia: heliaInstance,
  };
}

async function getIPFS() {
  if (!ipfsInstance) {
    ipfsInstance = await create({
      host: "localhost",
      port: 5001,
      protocol: "http",
    });
  }

  return { ipfs: ipfsInstance };
}

export interface IPFSData {
  meterID: string;
  dataBlockID: string;
  measurements: {
    timestamp: string;
    value: number;
    unit: string;
  }[];
}

export async function fetchIPFSData(cid: string): Promise<IPFSData> {
  // if (!heliaInstance) {
  //   heliaInstance = await createHelia();
  // }
  // const fs = unixfs(heliaInstance);

  if (!ipfsInstance) {
    ipfsInstance = await create({
      host: "localhost",
      port: 5001,
      protocol: "http",
    });
  }

  try {
    console.log("1 - Starting fetchIPFSData");
    console.log("1 - CID: ", cid);

    // Decode CID bytes from hex

    const parsedCid = CID.parse(cid);
    console.log("2 - CID decoded:", parsedCid.toString());

    // Fetch and collect chunks from the Helia UnixFS interface
    const stream = ipfsInstance.cat(parsedCid);
    const chunks: Uint8Array[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    // Join all chunks into one buffer
    const totalLength = chunks.reduce((len, chunk) => len + chunk.length, 0);
    const complete = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      complete.set(chunk, offset);
      offset += chunk.length;
    }

    const jsonString = new TextDecoder().decode(complete);
    const parsedData: IPFSData = JSON.parse(jsonString);

    if (
      !parsedData ||
      typeof parsedData.meterID !== "string" ||
      !Array.isArray(parsedData.measurements)
    ) {
      throw new Error("Invalid IPFS data structure");
    }

    return parsedData;
  } catch (error) {
    console.error("IPFS fetch error:", error);
    throw new Error(
      `Failed to fetch IPFS data: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// // Utility to pin data to IPFS
// export async function storeIPFSData(data: IPFSData): Promise<string> {
//   try {
//     console.log("1 - Storing data to IPFS");
//     const added = await ipfs.add(JSON.stringify(data));
//     console.log("2 - Data added to IPFS:", added.path);
//     return added.path;
//   } catch (error) {
//     console.error("IPFS store error:", error);
//     throw new Error(
//       `Failed to store IPFS data: ${
//         error instanceof Error ? error.message : String(error)
//       }`
//     );
//   }
// }

// export async function cleanupIPFS() {
//   console.log("Cleanup function is not necessary for ipfs-http-client.");
// }
