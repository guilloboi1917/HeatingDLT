// lib/ipfs.ts
"use client";

import { CID } from "multiformats/cid";
import { create } from "ipfs-http-client";

export interface IPFSData {
  meterID: string;
  dataBlockID: string;
  measurements: {
    timestamp: string;
    value: number;
    unit: string;
  }[];
}

async function getFromLocalIPFS(cid: string): Promise<string> {
  const response = await fetch(
    "http://127.0.0.1:5001/api/v0/block/get?arg=bafkreifcwx7zhzjfln2twokw25q5hfytfxrcrcshmpmn5mgpexl54b25be",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  const data = await response.text();


  return data;
}

export async function fetchIPFSData(cid: string): Promise<IPFSData> {
  try {
    console.log("1 - Starting fetchIPFSData");
    console.log("1 - CID: ", cid);

    // Decode CID bytes from hex

    const parsedCid = CID.parse(cid);
    console.log("2 - CID decoded:", parsedCid.toString());

    // Fetch and collect chunks from the Helia UnixFS interface
    const data = await getFromLocalIPFS(cid);

    const parsedData: IPFSData = JSON.parse(data);

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
