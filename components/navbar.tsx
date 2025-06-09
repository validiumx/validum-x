"use client"

import { ConnectWalletButton } from "@/components/web3-provider"
import { ModeToggle } from "@/components/mode-toggle"

export function Navbar() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src="/images/vldx-icon-new.png" alt="VLDX Logo" className="h-10 w-10" />
          <div>
            <span className="text-xl font-bold">Validium-X</span>
            <span className="ml-2 text-sm text-muted-foreground">Presale</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ModeToggle />
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  )
}
