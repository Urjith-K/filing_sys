"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

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
 * --- Component 1: The "File Complaint" Form ---
 * (NEW ELEGANT STYLING)
 */
const FileComplaintForm = () => {
  const [details, setDetails] = useState("");
  const [location, setLocation] = useState("");

  const { writeContractAsync: fileReport, isPending: isFiling } = useScaffoldWriteContract("YourContract");

  const handleSubmit = async () => {
    try {
      await fileReport({
        functionName: "fileReport",
        args: [details, location],
      });
      setDetails("");
      setLocation("");
    } catch (e) {
      console.error("Error filing report:", e);
    }
  };

  return (
    // Card container
    <div className="card w-full max-w-4xl bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-3xl">File a New Secure Report</h2>
        <p className="text-base-content/70">
          This report will be submitted to the blockchain. It is permanent and cannot be edited or deleted. Please
          provide clear and accurate information.
        </p>

        <div className="divider"></div>

        {/* --- Form Section --- */}
        <div className="space-y-6">
          {/* Location Input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg">Location of Incident</span>
            </label>
            <input
              type="text"
              placeholder='e.g., "District 7" or "Main St & 12th Ave"'
              className="input input-lg w-full bg-base-200 rounded-md transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-primary"
              value={location}
              onChange={e => setLocation(e.target.value)}
            />
            <label className="label">
              <span className="label-text-alt">Provide a general location. Do not include private addresses.</span>
            </label>
          </div>

          {/* Case Details Input */}
          <div className="form-control">
            <label className="label">
              <span className="label-text text-lg">Case Details</span>
            </label>
            <textarea
              className="textarea textarea-lg w-full bg-base-200 rounded-md h-36 transition-all duration-200
                         focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Describe the incident. What happened? When did it happen?"
              value={details}
              onChange={e => setDetails(e.target.value)}
            ></textarea>
            <label className="label">
              <span className="label-text-alt">
                This information will be public. Do not include personal names or sensitive data.
              </span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="card-actions justify-end mt-8">
          <button
            className="btn btn-primary btn-lg"
            disabled={isFiling || !details || !location}
            onClick={handleSubmit}
          >
            {isFiling ? <span className="loading loading-spinner"></span> : "Submit Secure Report"}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * --- Component 2: A single row in the "My Complaints" list ---
 * (This component is unchanged and correct)
 */
const MyCaseRow = ({ caseId, connectedAddress }: { caseId: bigint; connectedAddress?: string }) => {
  // Read the full struct data for this specific case ID
  const { data: complaint, isLoading } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getCaseDetails",
    args: [caseId],
  });

  if (isLoading) {
    return (
      <tr>
        <td colSpan={5}>Loading Case {caseId.toString()}...</td>
      </tr>
    );
  }

  if (!complaint || complaint.citizenReporter.toLowerCase() !== connectedAddress?.toLowerCase()) {
    return null;
  }

  const status = complaint.status;
  const statusString = getStatusString(status);

  return (
    <tr>
      <td>
        <strong>{complaint.id.toString()}</strong>
      </td>
      <td>
        <span className={`badge ${status === 0 ? "badge-warning" : status === 3 ? "badge-success" : "badge-info"}`}>
          {statusString}
        </span>
      </td>
      <td>{complaint.location}</td>
      <td>
        {complaint.publicUpdates.length > 0 ? complaint.publicUpdates[complaint.publicUpdates.length - 1] : "N/A"}
      </td>
      <td>
        <Address address={complaint.assignedPolice} />
      </td>
    </tr>
  );
};

/**
 * --- Component 3: The list of "My Complaints" ---
 * (This is the NEW, STYLED version)
 */
const MyComplaintsList = () => {
  const { address: connectedAddress } = useAccount();

  // Get the total number of cases
  const { data: caseCounter, isLoading: isLoadingCounter } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getTotalCases",
    watch: true, // This is the fix to auto-refresh the list
  });

  // Create an array of case IDs, e.g., [1n, 2n, 3n]
  const caseIds = Array.from({ length: Number(caseCounter || 0) }, (_, i) => BigInt(i + 1));

  return (
    // We wrapped this in a card to make it look cleaner
    <div className="card w-full max-w-7xl bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-3xl mb-4">My Filed Complaints</h2>
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Status</th>
                <th>Location</th>
                <th>Last Update</th>
                <th>Assigned Officer</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingCounter ? (
                <tr>
                  <td colSpan={5}>Loading my cases...</td>
                </tr>
              ) : caseIds.length > 0 ? (
                caseIds.map(id => <MyCaseRow key={id.toString()} caseId={id} connectedAddress={connectedAddress} />)
              ) : null}

              {!isLoadingCounter && caseIds.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center">
                    You have not filed any complaints yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * --- MAIN PAGE ---
 * (Added more padding and gap)
 */
const CitizenDashboard: NextPage = () => {
  return (
    // Added more padding and a larger gap
    <div className="container mx-auto p-8 flex flex-col items-center gap-12">
      <FileComplaintForm />
      <MyComplaintsList />
    </div>
  );
};

export default CitizenDashboard;
