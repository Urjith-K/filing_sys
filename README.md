# The Public's Ledger

**A decentralized accountability layer for public safety.**

This project is a submission for "The Residency" hackathon, built on the theme: **"Build for Real-World Impact using Web3"**.

## 1. The Problem

In many public safety systems, incident reports (like missing persons or public complaints) are filed into a "black box." Reports can be lost, de-prioritized, or tampered with. For the public, there is no transparency, which leads to a lack of accountability.

## 2. Our Solution: A "Glass Box"

We built **The Public's Ledger**: a decentralized application that acts as a permanent, immutable, and publicly verifiable notary for incident reports.

Instead of replacing the current system, we add a transparent accountability layer on top of it. When a citizen files a report, it is logged on-chain where it **cannot be deleted or altered**. The entire lifecycle of the case—from "Filed" to "Acknowledged" to "Verified & Closed"—is tracked publicly, creating a "flight tracker for justice" that ensures no report ever just "disappears."

## 3. Core Features

Our dApp is a multi-page application with 5 distinct roles and dashboards:

1.  **Public Dashboard (`/cases`):** A read-only portal for journalists, NGOs, and the public. It shows a list of *all* cases and their complete, un-editable timeline of updates.
2.  **Citizen Dashboard (`/dashboard/citizen`):** A secure portal for citizens to file new reports and track the real-time status of *their own* submitted cases.
3.  **Police Dashboard (`/dashboard/police`):** A protected work queue for whitelisted police addresses. Officers can `Acknowledge` new cases, `Add Progress Update`s (which are logged on-chain), and `Close Case`s.
4.  **Judicial Dashboard (`/dashboard/judicial`):** A protected portal for a third-party verifier (e.g., a judge or NGO). They see a queue of "Closed" cases and must provide the final `Verify Closure`, ensuring a separation of powers.
5.  **Governor Portal (`/admin`):** A high-security admin panel for the contract owner to grant and revoke `Police` and `Judicial` roles, managing the list of trusted authorities.

## 4. Tech Stack

* **Smart Contract:** Solidity, Foundry
* **Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, DaisyUI
* **Core Framework:** `scaffold-eth 2`

## 5. How to Test (Step-by-Step)

This application has 5 roles. Here is how to test the full flow:

### IMPORTANT: Setting the Governor (Admin)

For this hackathon demo, the **Governor** address is hardcoded in the smart contract.

1.  To test the admin panel, you **must** change this address to your own.
2.  Open `packages/foundry/contracts/YourContract.sol`.
3.  Go to the `constructor()` (around line 77).
4.  Change the hardcoded address to your own wallet address:
    ```solidity
    constructor() {
        // HACKATHON FIX: Change this to your address
        governor = 0xYOUR_ADDRESS_HERE;
    }
    ```
5.  **Re-deploy the contract:**
    ```bash
    yarn deploy
    ```

### Testing the Full Flow

1.  **Connect as Governor:** Connect the wallet you just hardcoded. Go to the homepage and click **[Go to Governor/Admin Portal]**.
2.  **Grant Roles:** On the Admin page, grant the `Police` role and `Judicial` role to two *different* test wallets.
3.  **Connect as Citizen:** Connect with any *normal* wallet (that is not an admin). Go to the **[Citizen Dashboard]** and file a new report. You will see it appear in your "My Filed Complaints" list.
4.  **Connect as Police:** Connect with the wallet you granted the `Police` role. Go to the **[Police Portal]**.
    * You will see the new case.
    * Click `Acknowledge`.
    * Add a progress update using the `Add Update` button.
    * Finally, `Close Case`.
5.  **Connect as Judicial:** Connect with the wallet you granted the `Judicial` role. Go to the **[Judicial Portal]**.
    * You will see the "Closed" case in your verification queue.
    * Add a final memo and click `Verify & Close`.
6.  **View as Public:** Go to the **[View All Cases (Public)]** page. Click "View Details" on the case you just processed. You will see its full, transparent timeline, from filing to final verification.

## 6. The "Vision": Future Work

Given the 6-hour time limit, we used a standard "Connect Wallet" flow. Our next step is to make this app accessible to **"normal people"** by:

* **Invisible Wallets:** Integrating **Privy** to let citizens log in with a simple phone/OTP, which invisibly creates and manages a wallet for them.
* **Gasless Transactions:** Using **Biconomy** to sponsor the gas fees for filing reports, removing the final barrier to entry for users in crisis.