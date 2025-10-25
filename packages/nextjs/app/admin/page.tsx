"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { AddressInput } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

// --- This type MUST be updated ---
// Add the new "resetAllComplaints" function
type YourContractWriteFunctions =
  | "acknowledgeCase"
  | "closeCase"
  | "fileReport"
  | "grantJudicialRole"
  | "grantPoliceRole"
  | "revokeJudicialRole"
  | "revokePoliceRole"
  | "verifyClosure"
  | "addProgressUpdate"
  | "resetAllComplaints"; // <-- ADD THIS LINE

// --- RoleManager Component (Unchanged) ---
const RoleManager = ({
  roleName,
  grantFn,
  revokeFn,
}: {
  roleName: string;
  grantFn: YourContractWriteFunctions;
  revokeFn: YourContractWriteFunctions;
}) => {
  const [address, setAddress] = useState("");

  const { writeContractAsync: grantRole, isPending: isGranting } = useScaffoldWriteContract("YourContract");
  const { writeContractAsync: revokeRole, isPending: isRevoking } = useScaffoldWriteContract("YourContract");

  const handleGrant = async () => {
    try {
      await grantRole({ functionName: grantFn, args: [address] });
      setAddress("");
    } catch (e) {
      console.error(`Error granting ${roleName} role:`, e);
    }
  };

  const handleRevoke = async () => {
    try {
      await revokeRole({ functionName: revokeFn, args: [address] });
      setAddress("");
    } catch (e) {
      console.error(`Error revoking ${roleName} role:`, e);
    }
  };

  return (
    <div className="card w-full max-w-md bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Manage {roleName} Role</h2>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Wallet Address</span>
          </label>
          <AddressInput value={address} onChange={setAddress} placeholder="Enter wallet address" />
        </div>
        <div className="card-actions justify-between mt-4">
          <button className="btn btn-primary" onClick={handleGrant} disabled={isGranting || !address}>
            {isGranting ? <span className="loading loading-spinner"></span> : "Grant Role"}
          </button>
          <button className="btn btn-secondary" onClick={handleRevoke} disabled={isRevoking || !address}>
            {isRevoking ? <span className="loading loading-spinner"></span> : "Revoke Role"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- NEW COMPONENT FOR RESETTING ---
const ResetComplaints = () => {
  const { writeContractAsync: resetAll, isPending: isResetting } = useScaffoldWriteContract("YourContract");

  const handleReset = async () => {
    // Add a simple confirmation for this dangerous action
    if (window.confirm("ARE YOU SURE? This will delete all complaints permanently.")) {
      try {
        await resetAll({ functionName: "resetAllComplaints" });
      } catch (e) {
        console.error("Error resetting complaints:", e);
      }
    }
  };

  return (
    <div className="card w-full max-w-md bg-error text-error-content shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Danger Zone</h2>
        <p>This will reset the `caseCounter` to 0 and effectively delete all complaint logs.</p>
        <div className="card-actions justify-end mt-4">
          <button className="btn btn-warning" onClick={handleReset} disabled={isResetting}>
            {isResetting ? <span className="loading loading-spinner"></span> : "Reset All Complaints"}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- The main admin page ---
const AdminPage: NextPage = () => {
  return (
    <div className="container mx-auto p-4 flex flex-col items-center gap-8">
      <h1 className="text-3xl font-bold">Governor Admin Panel</h1>

      <RoleManager roleName="Police" grantFn="grantPoliceRole" revokeFn="revokePoliceRole" />

      <RoleManager roleName="Judicial" grantFn="grantJudicialRole" revokeFn="revokeJudicialRole" />

      {/* --- ADD THE NEW COMPONENT HERE --- */}
      <div className="divider"></div>
      <ResetComplaints />
    </div>
  );
};

export default AdminPage;
