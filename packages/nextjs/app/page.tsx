"use client";

import type { NextPage } from "next";
import Link from "next/link";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  return (
    <div className="flex flex-col flex-grow">
      {/* --- Hero Section --- */}
      <div className="hero min-h-[60vh] bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <h1 className="text-6xl font-bold">The Public's Ledger</h1>
            <p className="py-6 text-2xl">
              Transparency. Accountability. Justice.
              <br />
              <span className="text-xl opacity-70">
                A decentralized accountability layer for public safety.
                Your voice, permanently on-chain.
              </span>
            </p>
            
            {/* This is the main "Connect Wallet" button from scaffold-eth */}
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      </div>

      {/* --- Demo Navigation (for Hackathon) --- */}
      <div className="flex-grow bg-base-300 w-full p-10">
        <div className="flex justify-center">
          <div className="card w-full max-w-lg bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Hackathon Demo Portals</h2>
              <p>Connect your wallet, then select your role to continue.</p>
              
              <div className="flex flex-col gap-4 mt-4">
                <Link href="/dashboard/citizen" className="btn btn-primary">
                  Go to Citizen Dashboard
                </Link>
                <Link href="/dashboard/police" className="btn btn-secondary">
                  Go to Police Portal
                </Link>
                <Link href="/dashboard/judicial" className="btn btn-accent">
                  Go to Judicial Portal
                </Link>
                <Link href="/admin" className="btn btn-error">
                  Go to Governor/Admin Portal
                </Link>
                <Link href="/cases" className="btn btn-outline">
                  View All Cases (Public)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;