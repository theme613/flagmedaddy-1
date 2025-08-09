import React from "react";
import ConnectWallet from "./ConnectWallet"; // ✅ RainbowKit Connect Button

export default function Header() {
  return (
    <header className="w-full bg-gray-900 text-white shadow-lg px-6 py-4 flex items-center justify-between">
      {/* Logo Text Only */}
      <span className="text-xl font-bold">FlagMeDaddy</span>

      {/* Connect Wallet */}
      <ConnectWallet />
    </header>
  );
}
