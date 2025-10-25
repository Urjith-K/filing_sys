"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { format } from "date-fns";
import { Address } from "~~/components/scaffold-eth";
import {
  useScaffoldReadContract,
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
 * --- Component 1: The "View Details" Modal ---
 * This component fetches the full details of ONE case
 * and displays its complete timeline.
 */
const CaseDetailsModal = ({ caseId, onClose }: { caseId: bigint; onClose: () => void }) => {
  // Read the full struct data for this specific case ID
  const { data: complaint, isLoading } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getCaseDetails",
    args: [caseId],
  });

  return (
    <dialog id="case_details_modal" className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl">
        <h3 className="font-bold text-2xl">Case #{caseId.toString()} Details</h3>
        
        {isLoading || !complaint ? (
          <p>Loading case details...</p>
        ) : (
          <div className="py-4">
            {/* --- Summary --- */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div><strong>Status:</strong> <span className={`badge ${complaint.status === 0 ? "badge-warning" : complaint.status === 3 ? "badge-success" : "badge-info"}`}>{getStatusString(complaint.status)}</span></div>
              <div><strong>Location:</strong> {complaint.location}</div>
              <div><strong>Filed By:</strong> <Address address={complaint.citizenReporter} /></div>
              <div><strong>Filed On:</strong> {format(new Date(Number(complaint.timestampFiled) * 1000), "PPpp")}</div>
              <div><strong>Assigned Officer:</strong> {complaint.assignedPolice !== "0x0000000000000000000000000000000000000000" ? <Address address={complaint.assignedPolice} /> : "N/A"}</div>
              <div><strong>Verified By:</strong> {complaint.verifyingJudicial !== "0x0000000000000000000000000000000000000000" ? <Address address={complaint.verifyingJudicial} /> : "N/A"}</div>
            </div>
            
            {/* --- Initial Report --- */}
            <div className="mb-6">
              <h4 className="font-bold text-lg">Initial Report Details:</h4>
              <p className="p-2 bg-base-200 rounded-md">{complaint.caseDetails}</p>
            </div>

            {/* --- Full Timeline --- */}
            <div>
              <h4 className="font-bold text-lg mb-2">Case Timeline & Updates</h4>
              <ul className="steps steps-vertical w-full">
                {/* We can't get the timestamp for the *first* event, so we just show the details */}
                <li className="step step-primary">
                  <div className="step-content text-left p-2">
                    <p className="font-bold">Case Filed</p>
                    <p>{complaint.caseDetails}</p>
                    <span className="text-xs text-gray-500">
                      On {format(new Date(Number(complaint.timestampFiled) * 1000), "PPpp")}
                    </span>
                  </div>
                </li>
                
                {/* Map over all the public updates */}
                {complaint.publicUpdates.map((update, index) => (
                  <li key={index} className="step step-primary">
                    <div className="step-content text-left p-2">
                      <p>{update}</p>
                    </div>
                  </li>
                ))}

                {/* Show the final state */}
                {complaint.status === 3 && (
                  <li className="step step-primary">
                    <div className="step-content text-left p-2">
                      <p className="font-bold">Case Verified & Closed</p>
                    </div>
                  </li>
                )}
              </ul>
            </div>
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </dialog>
  );
};


/**
 * --- Component 2: A single row in the "All Cases" list ---
 */
const PublicCaseRow = ({ caseId, onSelectCase }: { caseId: bigint; onSelectCase: (id: bigint) => void }) => {
  // Read the full struct data for this specific case ID
  const { data: complaint, isLoading } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getCaseDetails",
    args: [caseId],
    watch: true, // Keep it live
  });

  if (isLoading || !complaint) {
    return (
      <tr>
        <td colSpan={6}>Loading Case {caseId.toString()}...</td>
      </tr>
    );
  }

  const status = complaint.status;
  const statusString = getStatusString(status);

  return (
    <tr>
      <td><strong>{complaint.id.toString()}</strong></td>
      <td>
        <span className={`badge ${status === 0 ? "badge-warning" : status === 3 ? "badge-success" : "badge-info"}`}>
          {statusString}
        </span>
      </td>
      <td>{complaint.location}</td>
      <td><Address address={complaint.citizenReporter} /></td>
      <td>{format(new Date(Number(complaint.timestampFiled) * 1000), "PP")}</td>
      <td>
        <button className="btn btn-sm btn-outline" onClick={() => onSelectCase(caseId)}>
          View Details
        </button>
      </td>
    </tr>
  );
};


/**
 * --- MAIN PAGE ---
 */
const PublicCasesPage: NextPage = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<bigint | null>(null);

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
      <h1 className="text-3xl font-bold mb-8 text-center">Public Cases Dashboard</h1>
      {isLoadingEvents ? (
        <p className="text-center">Loading all cases...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Status</th>
                <th>Location</th>
                <th>Filed By</th>
                <th>Date Filed</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {uniqueEvents.length > 0 ? (
                uniqueEvents.map(event => (
                  <PublicCaseRow
                    key={event.args.caseId.toString()}
                    caseId={event.args.caseId}
                    onSelectCase={setSelectedCaseId}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center">No cases have been filed yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- The Modal --- */}
      {selectedCaseId !== null && (
        <CaseDetailsModal 
          caseId={selectedCaseId} 
          onClose={() => setSelectedCaseId(null)} 
        />
      )}
    </div>
  );
};

export default PublicCasesPage;