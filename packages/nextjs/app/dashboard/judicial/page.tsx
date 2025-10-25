"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory, useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

// --- Helper to convert status enum to text ---
const getStatusString = (status: number) => {
  switch (status) {
    case 0:
      return "Filed";
    case 1:
      return "Acknowledged";
    case 2:
      return "Closed by Police";
    case 3:
      return "Verified & Closed";
    default:
      return "Unknown";
  }
};

/**
 * --- Component 1: A single row in the "Verification Queue" ---
 */
const JudicialCaseRow = ({ caseId }: { caseId: bigint }) => {
  const [verificationMessage, setVerificationMessage] = useState("");

  // Read the full struct data for this specific case ID
  const { data: complaint, isLoading } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getCaseDetails",
    args: [caseId],
    watch: true, // Keep it live
  });

  // Get hooks for the judicial action
  const { writeContractAsync: verifyClosure, isPending: isVerifying } = useScaffoldWriteContract("YourContract");

  if (isLoading || !complaint) {
    return (
      <tr>
        <td colSpan={7}>Loading Case {caseId.toString()}...</td>
      </tr>
    );
  }

  const status = complaint.status;
  const statusString = getStatusString(status);

  // --- This is the key filter for this page ---
  // We only show cases that are "Closed by Police" (status 2)
  if (status !== 2) {
    return null; // Hide this case from the queue
  }

  // --- Action Handler ---
  const handleVerify = async () => {
    try {
      await verifyClosure({
        functionName: "verifyClosure",
        args: [caseId, verificationMessage || "Closure Verified"],
      });
      setVerificationMessage("");
    } catch (e) {
      console.error("Error verifying case:", e);
    }
  };

  return (
    <tr>
      {/* Case ID */}
      <td>
        <strong>{complaint.id.toString()}</strong>
      </td>
      {/* Status */}
      <td>
        <span className="badge badge-info">{statusString}</span>
      </td>
      {/* Location */}
      <td>{complaint.location}</td>
      {/* Filed By */}
      <td>
        <Address address={complaint.citizenReporter} />
      </td>
      {/* Assigned Police */}
      <td>
        <Address address={complaint.assignedPolice} />
      </td>
      {/* Police's Final Report */}
      <td>
        {complaint.publicUpdates.length > 0 ? complaint.publicUpdates[complaint.publicUpdates.length - 1] : "N/A"}
      </td>

      {/* --- Actions Column --- */}
      <td className="min-w-[300px]">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add verification memo..."
            className="input input-bordered input-sm"
            value={verificationMessage}
            onChange={e => setVerificationMessage(e.target.value)}
          />
          <button className="btn btn-sm btn-success" onClick={handleVerify} disabled={isVerifying}>
            {isVerifying ? <span className="loading loading-spinner"></span> : "Verify & Close"}
          </button>
        </div>
      </td>
    </tr>
  );
};

/**
 * --- MAIN PAGE ---
 */
const JudicialDashboard: NextPage = () => {
  // Fetch all "CaseUpdated" events to build the case list
  const { data: allEvents, isLoading: isLoadingEvents } = useScaffoldEventHistory({
    contractName: "YourContract",
    eventName: "CaseUpdated",
    fromBlock: 0n,
    watch: true,
  });

  // De-duplicate events to show only the latest status per case
  const latestEvents = new Map<bigint, any>();
  allEvents?.forEach(event => {
    if (event.args.caseId) {
      latestEvents.set(event.args.caseId, event);
    }
  });
  // Newest first
  const uniqueEvents = Array.from(latestEvents.values()).reverse();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Judicial Verification Queue</h1>
      {isLoadingEvents ? (
        <p className="text-center">Loading cases for verification...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Status</th>
                <th>Location</th>
                <th>Filed By</th>
                <th>Assigned Officer</th>
                <th>Officer&aposs Final Report</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uniqueEvents.length > 0 ? (
                uniqueEvents.map(event => (
                  <JudicialCaseRow key={event.args.caseId.toString()} caseId={event.args.caseId} />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center">
                    No cases pending verification.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default JudicialDashboard;
