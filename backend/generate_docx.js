const fs = require('fs');
const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');

const doc = new Document({
    creator: "Antigravity Agent",
    description: "Payroll Module Documentation",
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                text: "Payroll Module Workflow & Database Documentation",
                heading: HeadingLevel.TITLE,
            }),
            new Paragraph({ text: "", spacing: { before: 200 } }),
            
            // 1. Workflow for All Sub Tabs
            new Paragraph({
                text: "1. Workflow for All Sub Tabs",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: "The Payroll module in the frontend application is designed with several integrated sub-tabs to manage the entire lifecycle of payroll processing:",
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Settings: ", bold: true }),
                    new TextRun("Configures global payroll preferences for the company such as Provident Fund (PF) Employee Rates, ESI Employee Rates, and Professional Tax (PT) Monthly Amounts. This acts as the baseline configuration for all calculations.")
                ],
                bullet: { level: 0 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Salary Structures: ", bold: true }),
                    new TextRun("Manages templates and individual salary structures. This involves mapping 'Salary Components' (like Basic, HRA, Special Allowances, PF, ESI) to employees and defining them as either Earnings or Deductions.")
                ],
                bullet: { level: 0 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Employees: ", bold: true }),
                    new TextRun("The central hub for managing the workforce. Includes an EmployeeList for viewing and filtering, an EmployeeForm for onboarding new hires (collecting personal, contact, and employment details), and an EmployeeImport feature for bulk onboarding via CSV.")
                ],
                bullet: { level: 0 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Attendance: ", bold: true }),
                    new TextRun("An interface for logging and monitoring daily attendance. It supports individual daily logs, bulk attendance imports, and an approval workflow.")
                ],
                bullet: { level: 0 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Process Payroll: ", bold: true }),
                    new TextRun("A step-by-step wizard to generate salaries for a specific month and year. It fetches active employees, calculates their pay based on their salary structures and attendance records, and maps the total payout to the appropriate accounting ledger.")
                ],
                bullet: { level: 0 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Payslips: ", bold: true }),
                    new TextRun("A repository of all processed payroll records, allowing administrators to view, print to PDF, or distribute payslips to employees.")
                ],
                bullet: { level: 0 }
            }),
            
            new Paragraph({ text: "", spacing: { before: 400 } }),
            
            // 2. Database Storage
            new Paragraph({
                text: "2. Database Storage Architecture",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: "The backend uses Sequelize (MySQL/PostgreSQL) to store payroll data relationally:",
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Employees Table (employee.model.js): ", bold: true }),
                    new TextRun("Stores fundamental employee details, linked to the CompanyId. Tracks status (active/inactive/archived), department, designation, and joining dates.")
                ],
                bullet: { level: 0 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "PayrollSettings Table (payrollSettings.model.js): ", bold: true }),
                    new TextRun("Stores the company-level configurations (PF/ESI percentages, PT amounts) to ensure historical accuracy if rules change.")
                ],
                bullet: { level: 0 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "SalaryComponents & SalaryStructures: ", bold: true }),
                    new TextRun("SalaryComponents define individual pay elements (e.g., 'Transport Allowance'). SalaryStructures group these components together and map them to an EmployeeId.")
                ],
                bullet: { level: 0 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Attendances Table (attendance.model.js): ", bold: true }),
                    new TextRun("Maintains daily logs with a composite unique index on (CompanyId, EmployeeId, AttendanceDate) to prevent duplicate entries.")
                ],
                bullet: { level: 0 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "SalarySlips Table (salarySlip.model.js): ", bold: true }),
                    new TextRun("Stores the finalized processing output for each employee per month, freezing the earnings, deductions, and net pay at the time of processing.")
                ],
                bullet: { level: 0 }
            }),

            new Paragraph({ text: "", spacing: { before: 400 } }),

            // 3. Attendance Implementation Decisions
            new Paragraph({
                text: "3. Attendance Implementation Decisions",
                heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
                text: "Based on the models and frontend components, the following architectural and functional decisions have been made for the Attendance module:",
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Comprehensive Status Tracking: ", bold: true }),
                    new TextRun("The system goes beyond Present/Absent. It supports 'Half-Day', 'Sick-Leave', 'Casual-Leave', 'Earned-Leave', 'Comp-Off', and 'Holiday', allowing precise payroll deductions or leave balance tracking.")
                ],
                bullet: { level: 0 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Time and Location Tracking: ", bold: true }),
                    new TextRun("The database includes fields for CheckInTime and CheckOutTime (stored as 'HH:MM' strings) and WorkingHours (stored as a decimal). Crucially, it includes Latitude and Longitude fields to support geofenced check-ins or location verification for remote/field workers.")
                ],
                bullet: { level: 0 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Approval Workflow: ", bold: true }),
                    new TextRun("The model includes IsApproved (boolean), ApprovedBy, and ApprovedDate. This indicates a multi-tier workflow where managers must review and approve attendance logs before they are considered final for payroll processing.")
                ],
                bullet: { level: 0 }
            }),
            new Paragraph({
                children: [
                    new TextRun({ text: "Bulk Import Capabilities: ", bold: true }),
                    new TextRun("Recognizing that many companies use external biometric systems, the application includes an AttendanceBulkImport component to seamlessly ingest CSV/Excel files into the Attendances table.")
                ],
                bullet: { level: 0 }
            }),
        ],
    }],
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("Payroll_Module_Documentation.docx", buffer);
    console.log("Document created successfully");
}).catch(console.error);
