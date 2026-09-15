export interface SampleContract {
  id: string;
  title: string;
  tagline: string;
  filename: string;
  text: string;
}

export const SAMPLES: SampleContract[] = [
  {
    id: "trap-agency",
    title: "The Trap Agency Contract",
    tagline: "Net-90 • unlimited liability • full IP grab",
    filename: "trap-agency-contract.txt",
    text: `MASTER SERVICES AGREEMENT — TRAP AGENCY LLC

1. SERVICES. Contractor shall provide software development services as assigned by Client, and shall revise all Work until Client is fully satisfied, without additional compensation.

2. COMPENSATION. Client shall pay Contractor within Net-90 days of invoice receipt. Contractor acknowledges payment is pay-when-paid: if Client's end-customer fails to pay Client, no payment shall be due to Contractor.

3. INTELLECTUAL PROPERTY. Contractor hereby assigns all right, title, and interest in and to all Work Product, including all pre-existing tools, libraries, frameworks, and code snippets used in performance of the Services, to Client as of creation.

4. LIABILITY & INDEMNITY. Contractor's liability shall be unlimited. Contractor shall indemnify and hold harmless Client, its affiliates, officers, and customers against all claims, damages, losses, and legal fees arising from the Services.

5. NON-COMPETE. For 24 months following termination, Contractor shall not provide services to any business in the software, technology, or digital industry worldwide.

6. TERMINATION. Client may terminate this Agreement immediately without notice or kill fee. No compensation shall be due for partially completed milestones.

7. GOVERNING LAW. This Agreement shall be governed by the laws of the State of Delaware.`,
  },
  {
    id: "unlimited-revisions",
    title: "The Unlimited Revisions Dev Agreement",
    tagline: "Endless revisions • vague milestones • no kill fee",
    filename: "unlimited-revisions-agreement.txt",
    text: `INDEPENDENT CONTRACTOR AGREEMENT — DEV SHOP CO.

1. SCOPE. Contractor will build a marketing website and mobile app. Milestone deliverables to be defined later as the project evolves. Additional work requested by Client shall be handled via informal change requests.

2. REVISIONS. Contractor shall revise Work until Client is satisfied. All revisions are included in the fixed fee. Client may request new features during revision rounds at no extra charge.

3. PAYMENT. Fixed fee of $4,000 payable Net-60 after final acceptance. Final acceptance occurs only after all revisions are approved. 50% of the fee is contingent on end-client approval (pay-if-paid).

4. IP. All Work Product is owned by Client upon creation. Contractor retains no portfolio or reuse rights.

5. LIABILITY. Contractor agrees to indemnify Client against any claims. No liability cap is stated.

6. TERMINATION. Either party may terminate without prior notice. Upon termination, Client owes nothing for work in progress.

7. CONFIDENTIALITY. Both parties agree to keep confidential information secret (mutual confidentiality).`,
  },
  {
    id: "fair-freelance",
    title: "The Fair Freelance Agreement",
    tagline: "Net-15 • capped liability • balanced IP — the healthy baseline",
    filename: "fair-freelance-agreement.txt",
    text: `FREELANCE SERVICES AGREEMENT — FAIR CLIENT INC.

1. SCOPE. Contractor will deliver the milestones in Exhibit A. Two revision rounds per deliverable are included; additional rounds are billed at $120/hour subject to written approval via change order.

2. PAYMENT. Client pays within 15 days of invoice (Net-15). A 50% deposit is due before work begins. Late payments accrue 1.5% monthly interest. Contractor may suspend work if an invoice is more than 15 days overdue.

3. IP. Upon full payment, Contractor assigns project-specific deliverables to Client. Contractor retains all pre-existing tools, libraries, and prior inventions listed in Exhibit B, licensed to Client for the project.

4. LIABILITY. Each party's total liability shall not exceed the fees paid in the prior 3 months. Each party indemnifies the other solely for third-party IP claims caused by its own deliverables.

5. NON-COMPETE. None. Contractor may work with other clients freely, subject to mutual confidentiality.

6. TERMINATION. Either party may terminate with 14 days written notice. Client pays for all work performed plus a 25% kill fee on the active milestone.

7. CONFIDENTIALITY. Both parties agree to keep confidential information secret (mutual confidentiality).

8. GOVERNING LAW. This Agreement is governed by the laws of Contractor's home state, with disputes resolved by good-faith negotiation first.`,
  },
];
