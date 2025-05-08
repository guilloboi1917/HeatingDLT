import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { ethers } from "ethers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function shortenAddress(address: string): string {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
}

export function formatPhoneNumber(raw: string) {
  const phoneNumber = parsePhoneNumberFromString(raw, "CH"); // 'CH' = Switzerland
  return phoneNumber?.formatInternational() ?? raw;
}

export function isZeroAddress(address: string): boolean {
  return ethers.isAddress(address) && address == ethers.ZeroAddress;
}
