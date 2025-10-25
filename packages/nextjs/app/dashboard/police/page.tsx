"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { Address } from "~~/components/scaffold-eth";
import {
  useScaffoldReadContract,
  useScaffoldWriteContract,
  useScaffoldEventHistory,
} from "~~/hooks/scaffold-eth";

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
 * --- Component 1: A single row in the "Police Work Queue" ---
 * This component is "smart" and handles all actions for a case.
 */
const PoliceCaseRow = ({ caseId }: { caseId: bigint }) => {
  const [updateMessage, setUpdateMessage] = useState("");

  // Read the full struct data for this specific case ID
  const { data: complaint, isLoading } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getCaseDetails",
    args: [caseId],
    watch: true, // Keep it live
  });

  // Get hooks for all possible police actions
  const { writeContractAsync: acknowledgeCase, isPending: isAcknowledging } =
    useScaffoldWriteContract("YourContract");
  const { writeContractAsync: addProgressUpdate, isPending: isUpdating } =
    useScaffoldWriteContract("YourContract");
  const { writeContractAsync: closeCase, isPending: isClosing } =
    useScaffoldWriteContract("YourContract");

  if (isLoading || !complaint) {
    return (
      <tr>
        <td colSpan={6}>Loading Case {caseId.toString()}...</td>
      </tr>
    );
  }

  const status = complaint.status;
  const statusString = getStatusString(status);

  // We only show cases that are "Filed" or "Acknowledged"
  if (status > 1) {
    return null; // This case is closed or verified, hide it from the queue
  }

  // --- Action Handlers ---
  const handleAcknowledge = async () => {
    try {
      await acknowledgeCase({
        functionName: "acknowledgeCase",
        args: [caseId, updateMessage || "Case Acknowledged"],
      });
      setUpdateMessage("");
    } catch (e) {
      console.error("Error acknowledging case:", e);
    }
  };

  const handleUpdate = async () => {
    if (!updateMessage) return; // Don't allow empty updates
    try {
      await addProgressUpdate({
        functionName: "addProgressUpdate",
        args: [caseId, updateMessage],
      });
      setUpdateMessage("");
    } catch (e) {
      console.error("Error adding update:", e);
    }
  };

  const handleClose = async () => {
    try {
      await closeCase({
        functionName: "closeCase",
        args: [caseId, updateMessage || "Case Closed"],
      });
      setUpdateMessage("");
    } catch (e) {
      console.error("Error closing case:", e);
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
        <span className={`badge ${status === 0 ? "badge-warning" : "badge-info"}`}>
          {statusString}
        </span>
      </td>
      {/* Location */}
      <td>{complaint.location}</td>
      {/* Filed By */}
      <td>
        <Address address={complaint.citizenReporter} />
      </td>
      {/* Details */}
      <td>{complaint.caseDetails}</td>
      
      {/* --- Actions Column --- */}
      <td className="min-w-[400px]">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Add update message or closing note..."
            className="input input-bordered input-sm"
            value={updateMessage}
            onChange={e => setUpdateMessage(e.target.value)}
          />
          <div className="flex gap-2">
            
            {/* --- Button Logic --- */}

            {/* If status is "Filed" (0), show "Acknowledge" */}
            {status === 0 && (
              <button
                className="btn btn-sm btn-primary"
                onClick={handleAcknowledge}
                disabled={isAcknowledging}
              >
                {isAcknowledging ? <span className="loading loading-spinner"></span> : "Acknowledge"}
              </button>
            )}

            {/* If status is "Acknowledged" (1), show "Update" and "Close" */}
            {status === 1 && (
              <>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={handleUpdate}
                  disabled={isUpdating || !updateMessage}
                >
                  {isUpdating ? <span className="loading loading-spinner"></span> : "Add Update"}
                </button>
                <button
                  className="btn btn-sm btn-error"
                  onClick={handleClose}
                  disabled={isClosing}
                >
                  {isClosing ? <span className="loading loading-spinner"></span> : "Close Case"}
                </button>
              </>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
};

/**
 * --- MAIN PAGE ---
 */
const PoliceDashboard: NextPage = () => {
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
      <h1 className="text-3xl font-bold mb-8 text-center">Police Work Queue</h1>
      {isLoadingEvents ? (
        <p className="text-center">Loading case history...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Status</th>
                <th>Location</th>
                <th>Filed By</th>
                <th>Details</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uniqueEvents.length > 0 ? (
                uniqueEvents.map(event => (
                  <PoliceCaseRow
                    key={event.args.caseId.toString()}
                    caseId={event.args.caseId}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center">No cases found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PoliceDashboard;