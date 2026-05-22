const fs = require('fs');
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

const doc = new Document({
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "Tally Main: Architecture, Current Workflows, and SaaS Evolution Plan",
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
            }),
            new Paragraph({ text: "", spacing: { after: 200 } }),

            new Paragraph({
                text: "1. Executive Summary",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: "This document outlines the existing features and workflows of the Tally Main application. It highlights the strengths of the current Double-Entry Accounting engine, identifies critical areas for improvement, and provides a strategic blueprint for evolving the platform into a high-level SaaS product with automated payments and bank feeds.",
                spacing: { after: 200 }
            }),

            new Paragraph({
                text: "2. Current Application Workflow & Features",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: "2.1 The Universal Journal Engine (AccountingService.js)",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "At the core of the application lies the AccountingService, which acts as the Universal Journal Engine. It enforces double-entry accounting rules (Debits = Credits), updates Ledger balances in real-time, and generates immutable Audit Logs for fraud prevention.",
                spacing: { after: 120 }
            }),
            
            new Paragraph({
                text: "2.2 Sales & Accounts Receivable (Invoicing)",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Workflow: ", bold: true }),
                    new TextRun("Sales Orders are created and converted to Sales Invoices. When a customer makes a payment, the recordPayment API is invoked.")
                ]
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Ledger Impact: ", bold: true }),
                    new TextRun("Uses AccountingService to Debit the Bank/Cash account and Credit the Customer Ledger, ensuring accurate real-time balances.")
                ],
                spacing: { after: 120 }
            }),

            new Paragraph({
                text: "2.3 Purchases & Accounts Payable (Bills)",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Workflow: ", bold: true }),
                    new TextRun("Purchase Orders are converted into Bills. Payments to vendors are recorded manually through paymentMade.controller.js.")
                ]
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Flaw Identified: ", bold: true }),
                    new TextRun("The current implementation bypasses the AccountingService. It directly writes to Voucher and Transaction tables, failing to update the Ledger's currentBalance or generate an Audit Log. This causes the Bank and Vendor ledger balances to fall out of sync with their underlying transactions.")
                ],
                spacing: { after: 200 }
            }),

            new Paragraph({
                text: "3. Future Improvements: The SaaS Blueprint",
                heading: HeadingLevel.HEADING_1,
            }),
            
            new Paragraph({
                text: "Phase 1: Architectural Integrity (Immediate Fix)",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "Refactor paymentMade.controller.js to route all payment creations through AccountingService.recordJournalEntry. This is non-negotiable for a SaaS product to ensure ledger integrity.",
                spacing: { after: 120 }
            }),

            new Paragraph({
                text: "Phase 2: Automated Payment Gateways (Stripe / Razorpay)",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "Instead of manual data entry, the system should generate Payment Links (Intents) on Invoices. When a customer pays online, the payment gateway sends a Webhook to the backend. The backend will automatically trigger AccountingService to record the Receipt and mark the Invoice as Paid.",
                spacing: { after: 120 }
            }),

            new Paragraph({
                text: "Phase 3: Automated Bank Feeds (Plaid / Setu)",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "Integrate with bank aggregators to fetch raw daily bank statements into a new 'BankStatementLine' table. Build a Reconciliation Dashboard where users can match raw bank lines to system Ledger transactions, ensuring 100% accuracy between the physical bank and the software ledger.",
                spacing: { after: 120 }
            }),

            new Paragraph({
                text: "Phase 4: SaaS Subscription Billing",
                heading: HeadingLevel.HEADING_2,
            }),
            new Paragraph({
                text: "Implement recurring billing logic with proration, upgrades, and downgrades. For global SaaS, implement a Multi-Currency engine that calculates Realized Forex Gains/Losses when settling invoices in different currencies.",
                spacing: { after: 120 }
            })
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Tally_SaaS_Workflow_and_Improvements.docx", buffer);
    console.log("Successfully generated Tally_SaaS_Workflow_and_Improvements.docx");
});
