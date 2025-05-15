// lib/ipfs.ts
"use client";

import { CID } from "multiformats/cid";
import { create } from "ipfs-http-client";

export interface IPFSMeasurementData {
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
    `http://127.0.0.1:5001/api/v0/block/get?arg=${cid}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }
  );

  const data = await response.text();

  return data;
}

export async function fetchIPFSMeasurementData(
  cid: string
): Promise<IPFSMeasurementData> {
  try {
    console.log("1 - Starting fetchIPFSData");
    console.log("1 - CID: ", cid);

    // Decode CID bytes from hex

    const parsedCid = CID.parse(cid);
    console.log("2 - CID decoded:", parsedCid.toString());

    // Fetch and collect chunks 
    const data = await getFromLocalIPFS(cid);

    const parsedData: IPFSMeasurementData = JSON.parse(data);

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

/**
 * Stores a PDF file as an IPFS block
 * @param file PDF file to store
 * @param options Optional parameters for block storage
 * @returns CID of the stored block
 */
export async function putPDFToIPFS(
  file: File,
  options: {
    cidCodec?: string;
    mhtype?: string;
    pin?: boolean;
  } = {}
): Promise<string> {
  const formData = new FormData();
  formData.append("data", file);

  // Configure query parameters
  const params = new URLSearchParams();
  if (options.cidCodec) params.set("cid-codec", options.cidCodec);
  if (options.mhtype) params.set("mhtype", options.mhtype);
  if (options.pin !== undefined) params.set("pin", options.pin.toString());

  try {
    const response = await fetch(
      `http://127.0.0.1:5001/api/v0/block/put?${params.toString()}`,
      {
        method: "POST",
        body: formData,
        // Let browser set Content-Type with boundary
        headers: {},
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`IPFS block/put failed: ${error}`);
    }

    const { Key: cid } = await response.json();
    return cid;
  } catch (error) {
    console.error("IPFS put error:", error);
    throw error;
  }
}

export async function downloadFromIPFS(
  cid: string,
  type: string,
  filename: string = "document"
): Promise<void> {
  if (!cid) throw new Error("CID cannot be empty");

  try {
    const blob = await getPDFFromIPFS(cid); // assuming this returns a Blob

    let finalBlob: Blob;
    let extension: string;

    if (type === "HEATING") {
      // Treat as JSON: convert blob text to pretty JSON blob
      const text = await blob.text();
      let jsonPretty: string;
      try {
        const jsonObj = JSON.parse(text);
        jsonPretty = JSON.stringify(jsonObj, null, 2);
      } catch {
        // fallback if not valid JSON
        jsonPretty = text;
      }
      finalBlob = new Blob([jsonPretty], { type: "application/json" });
      extension = ".json";
    } else {
      // Treat as PDF
      finalBlob = blob;
      extension = ".pdf";
    }

    // Append extension if not present
    if (!filename.endsWith(extension)) {
      filename += extension;
    }

    // Trigger download
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
}

// Core function (unchanged from previous version)
export async function getPDFFromIPFS(cid: string): Promise<Blob> {
  try {
    console.log(`http://127.0.0.1:5001/api/v0/block/get?arg=${cid}`);
    const response = await fetch(
      `http://127.0.0.1:5001/api/v0/block/get?arg=${cid}`,
      {
        method: "POST",
      }
    );

    console.log(response);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`IPFS block/get failed: ${error}`);
    }

    return await response.blob();
  } catch (error) {
    console.error("IPFS get error:", error);
    throw error;
  }
}

// Helper function for PDF upload (using the core putPDFToIPFS)
export const putPDFToIPFSHelper = async (file: File) => {
  return putPDFToIPFS(file, {
    cidCodec: "raw",
    mhtype: "sha2-256",
    pin: true,
  });
};
