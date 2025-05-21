"use client"

import { useState } from "react"
import { useContractStore } from "@/store/useContractStore"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { formatUnits, ethers } from "ethers";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Flame } from "lucide-react"

export default function TokenBalance() {
  const { tokenBalance } = useContractStore()
  const [topUpAmount, setTopUpAmount] = useState<number>(100)
  const [isProcessing, setIsProcessing] = useState(false)

  const formattedTokenBalance = Number(
    formatUnits(
      BigInt(tokenBalance), // Directly use BigInt constructor
      "ether"
    )
  ).toFixed(2);

  const handleTopUp = async () => {
    toast.success("Topped up (MOCK)", { description: "This functionality is mocked" })
    return
    // if (!topUpAmount || topUpAmount <= 0) {
    //   toast({
    //     title: "Invalid amount",
    //     description: "Please enter a valid amount to top up",
    //     variant: "destructive",
    //   })
    //   return
    // }

    // try {
    //   setIsProcessing(true)
    //   const success = await topUpTokens(topUpAmount)

    //   if (success) {
    //     toast({
    //       title: "Top-up successful",
    //       description: `Successfully added ${topUpAmount} TNCY tokens to your balance`,
    //     })
    //   } else {
    //     toast({
    //       title: "Top-up failed",
    //       description: "Failed to top up your TNCY tokens. Please try again.",
    //       variant: "destructive",
    //     })
    //   }
    // } catch (error) {
    //   console.error("Error topping up tokens:", error)
    //   toast({
    //     title: "Top-up failed",
    //     description: "Failed to top up your TNCY tokens. Please try again.",
    //     variant: "destructive",
    //   })
    // } finally {
    //   setIsProcessing(false)
    // }
  }

  return (
    <div className="space-y-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <Flame className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-center">TNCY Token Balance</CardTitle>
          <CardDescription className="text-center">Your current heating token balance</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-5xl font-bold mb-6">{formattedTokenBalance}</div>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            TNCY tokens are used to pay for your heating bills. Top up your balance to ensure uninterrupted service.
          </p>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topUpAmount">Top-up Amount</Label>
              <Input
                id="topUpAmount"
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(Number(e.target.value))}
                min={1}
                className="w-full"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleTopUp} disabled={isProcessing || !topUpAmount || topUpAmount <= 0}>
            {isProcessing ? "Processing..." : `Top Up ${topUpAmount} TNCY Tokens`}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Token Usage Guide</CardTitle>
          <CardDescription>How TNCY tokens work in the heating system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">What are TNCY tokens?</h3>
              <p className="text-slate-600 dark:text-slate-300">
                TNCY tokens are the digital currency used to pay for heating services in this building. Each token
                represents a unit of heating energy.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">How to use tokens</h3>
              <p className="text-slate-600 dark:text-slate-300">
                Your heating usage is automatically measured by smart meters and billed in TNCY tokens. Ensure you have
                enough tokens to cover your bills to avoid service interruptions.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-1">Token conversion rate</h3>
              <p className="text-slate-600 dark:text-slate-300">
                1 TNCY token = 0.01 ETH. When you top up, your ETH is converted to TNCY tokens at this rate.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
