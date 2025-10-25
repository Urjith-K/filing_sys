//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging
import "forge-std/console.sol";

/**
 * @title PublicLedger
 * @author Based on the WnCC Hackathon brief
 * @notice An immutable, publicly verifiable notary for incident reports
 * to create a transparent accountability layer.
 */
contract YourContract {
    // --- Data Structures ---

    /**
     * @notice The complete data structure for a single case.
     */
    struct CaseReport {
        uint256 id; // The unique case ID
        address citizenReporter; // The invisible wallet of the filer
        address assignedPolice; // The police wallet that acknowledged it
        address verifyingJudicial; // The judicial wallet that stamped it
        uint256 timestampFiled; // The block.timestamp when filed
        uint256 timestampLastUpdate; // The timestamp of the last update
        string caseDetails; // The encrypted/hashed details of the report
        string location; // Public location (e.g., "District 7")
        CaseStatus status; // The current status from our enum
        string[] publicUpdates; // A log of all updates
    }

    /**
     * @notice The distinct lifecycle stages of a case.
     */
    enum CaseStatus {
        Filed, // 0: Just filed by a citizen
        Acknowledged, // 1: Acknowledged by a Police wallet
        ClosedByPolice, // 2: Resolved by Police, pending verification
        VerifiedClosed // 3: Final verification by Judiciary
    }

    // --- State Variables ---

    // Role-Based Access Control (RBAC)
    address public immutable governor; // This is OUR wallet (the deployer)
    mapping(address => bool) public isPolice;
    mapping(address => bool) public isJudicial;

    // The "Database"
    uint256 public caseCounter;
    mapping(uint256 => CaseReport) public cases;

    // --- Event ---

    /**
     * @notice Emitted every time a case changes state.
     * The frontend dashboard will listen for this.
     */
    event CaseUpdated(uint256 indexed caseId, CaseStatus newStatus, string updateMessage);

    // --- Modifiers ---

    modifier onlyGovernor() {
        require(msg.sender == governor, "GOV: Only governor");
        _;
    }

    modifier onlyPolice() {
        require(isPolice[msg.sender] == true, "AUTH: Not Police");
        _;
    }

    modifier onlyJudicial() {
        require(isJudicial[msg.sender] == true, "AUTH: Not Judicial");
        _;
    }

    // --- Constructor ---

    /**
     * @notice Sets our wallet as the 'admin' (governor) on deploy.
     */
    constructor() {
        // HACKATHON FIX: Hardcoded to your governor address
        governor = 0xc65353D7424054567d08E053FBb83462B33bafD4;
    }

    // --- 1. Governor Functions (Admin) ---

    function grantPoliceRole(address _policeWallet) public onlyGovernor {
        isPolice[_policeWallet] = true;
    }

    function revokePoliceRole(address _policeWallet) public onlyGovernor {
        isPolice[_policeWallet] = false;
    }

    function grantJudicialRole(address _judicialWallet) public onlyGovernor {
        isJudicial[_judicialWallet] = true;
    }

    function revokeJudicialRole(address _judicialWallet) public onlyGovernor {
        isJudicial[_judicialWallet] = false;
    }

    /**
     * @notice Governor: Resets the entire complaint log.
     * FOR DEMO/TESTING ONLY. This is a destructive action.
     */
    function resetAllComplaints() public onlyGovernor {
        // By resetting the counter, all old cases become inaccessible
        // and new cases will overwrite them starting from ID 1.
        // This is the most gas-efficient way to "clear" the mapping.
        caseCounter = 0;

        // Emit an event so the frontend knows to refresh
        // We'll re-use CaseUpdated for this
        emit CaseUpdated(0, CaseStatus.Filed, "ALL_CASES_RESET");
    }

    // --- 2. Filer Function (Public, but Gas-less) ---

    /**
     * @notice Called by the Filer's invisible wallet, with gas paid by a Relayer.
     */
    function fileReport(string memory _details, string memory _location) public {
        caseCounter++;
        uint256 _id = caseCounter;

        CaseReport storage _case = cases[_id];
        _case.id = _id;
        _case.citizenReporter = msg.sender; // This is the Filer's invisible wallet
        _case.timestampFiled = block.timestamp;
        _case.timestampLastUpdate = block.timestamp;
        _case.caseDetails = _details;
        _case.location = _location;
        _case.status = CaseStatus.Filed;
        // All other fields are 0 / empty by default

        emit CaseUpdated(_id, CaseStatus.Filed, "New case filed.");
    }

    // --- 3. Authority Functions (Role-Protected) ---

    /**
     * @notice Police: Acknowledge a 'Filed' case.
     */
    function acknowledgeCase(uint256 _caseId, string memory _updateMessage) public onlyPolice {
        CaseReport storage _case = cases[_caseId];
        require(_case.status == CaseStatus.Filed, "CASE: Not in filed state");

        _case.status = CaseStatus.Acknowledged;
        _case.assignedPolice = msg.sender;
        _case.timestampLastUpdate = block.timestamp;
        _case.publicUpdates.push(_updateMessage);

        emit CaseUpdated(_caseId, _case.status, _updateMessage);
    }

    /**
     * @notice Police: Add a public progress update to an 'Acknowledged' case.
     */
    function addProgressUpdate(uint256 _caseId, string memory _updateMessage) public onlyPolice {
        CaseReport storage _case = cases[_caseId];
        // Can only update cases that are actively being investigated
        require(_case.status == CaseStatus.Acknowledged, "CASE: Not in 'Acknowledged' state");

        _case.timestampLastUpdate = block.timestamp;
        _case.publicUpdates.push(_updateMessage);

        // We emit the same event, just with the new message
        emit CaseUpdated(_caseId, _case.status, _updateMessage);
    }

    /**
     * @notice Police: Close an 'Acknowledged' case.
     */
    function closeCase(uint256 _caseId, string memory _finalReport) public onlyPolice {
        CaseReport storage _case = cases[_caseId];
        require(_case.status == CaseStatus.Acknowledged, "CASE: Not acknowledged");

        _case.status = CaseStatus.ClosedByPolice;
        _case.timestampLastUpdate = block.timestamp;
        _case.publicUpdates.push(_finalReport);

        emit CaseUpdated(_caseId, _case.status, _finalReport);
    }

    /**
     * @notice Judiciary: Verify a 'ClosedByPolice' case.
     */
    function verifyClosure(uint256 _caseId, string memory _verificationMessage) public onlyJudicial {
        CaseReport storage _case = cases[_caseId];
        require(_case.status == CaseStatus.ClosedByPolice, "CASE: Not closed by police");

        _case.status = CaseStatus.VerifiedClosed;
        _case.verifyingJudicial = msg.sender;
        _case.timestampLastUpdate = block.timestamp;
        _case.publicUpdates.push(_verificationMessage);

        emit CaseUpdated(_caseId, _case.status, _verificationMessage);
    }

    // --- 4. Viewer Functions (Read-Only) ---

    function getCaseDetails(uint256 _caseId) public view returns (CaseReport memory) {
        return cases[_caseId];
    }

    function getTotalCases() public view returns (uint256) {
        return caseCounter;
    }
}
