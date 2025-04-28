import { create } from 'zustand';
import { persist } from 'zustand/middleware'

interface SmartMeterState {
    name: string | null;
    ownerName: string | null;
    smartMeterAddress: string | null;
    smartMeterId: string | null;
    isActive: boolean;
    connectSmartMeter: (address: string) => void;
    disconnectSmartMeter: () => void
}

export const useSmartMeterStore = create<SmartMeterState>()(
    persist(
        (set) => ({
            name: null,
            ownerName: null,
            smartMeterAddress: null,
            smartMeterId: null,
            isActive: false,

            connectSmartMeter: (address) => {
                // Fetch smart meter data from contract
                set({
                    smartMeterAddress: address,
                    isActive: true
                });
            },

            disconnectSmartMeter: () => {
                set({
                    name: null,
                    ownerName: null,
                    smartMeterAddress: null,
                    smartMeterId: null,
                    isActive: false,
                })
            }
        }),
        { name: 'heatingdlt-smartmeter-storage', }
    )
)