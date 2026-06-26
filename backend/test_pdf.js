const fs = require('fs');
const PDFDocument = require('pdfkit');

function generatePayslipPDF(slip, company, employee) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Fonts and Colors
        const primaryColor = '#52698f'; // Dark bluish grey from template
        const secondaryColor = '#8fa0b5';
        const textColor = '#333333';
        const lightBg = '#f4f6f8';
        const borderColor = '#c4cdd5';

        // --- HEADER ---
        // Left Header: PAYSLIP text
        doc.fillColor(primaryColor)
           .fontSize(32)
           .font('Helvetica-Bold')
           .text('PAYSLIP', 40, 50, { characterSpacing: 2 });
           
        doc.fontSize(28)
           .fillColor(secondaryColor)
           .text('TEMPLATE', 40, 85, { characterSpacing: 1 });

        // Right Header: Company Name
        doc.fillColor(primaryColor)
           .fontSize(24)
           .font('Helvetica-Bold')
           .text(company.name || 'Company Name', 250, 65, { align: 'right' });

        // --- METADATA SECTION (Two Boxes) ---
        const metaY = 160;
        const boxWidth = 245;
        
        // Left Box
        doc.rect(40, metaY, boxWidth, 90).stroke(borderColor);
        doc.moveTo(40, metaY + 22).lineTo(40 + boxWidth, metaY + 22).stroke(borderColor);
        doc.moveTo(40, metaY + 44).lineTo(40 + boxWidth, metaY + 44).stroke(borderColor);
        doc.moveTo(40, metaY + 66).lineTo(40 + boxWidth, metaY + 66).stroke(borderColor);
        
        doc.moveTo(40 + 100, metaY).lineTo(40 + 100, metaY + 90).stroke(borderColor); // Vertical line

        doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold');
        doc.text('EMPLOYEE', 45, metaY + 8);
        doc.text('EMPLOYEE ID', 45, metaY + 30);
        doc.text('DESIGNATION', 45, metaY + 52);
        doc.text('DEPARTMENT', 45, metaY + 74);

        doc.fillColor(textColor).fontSize(9).font('Helvetica');
        doc.text(employee.name || 'N/A', 145, metaY + 7);
        doc.text(employee.employeeId || 'N/A', 145, metaY + 29);
        doc.text(employee.designation || 'N/A', 145, metaY + 51);
        doc.text(employee.department || 'N/A', 145, metaY + 73);

        // Right Box
        const rightX = 310;
        doc.rect(rightX, metaY, boxWidth, 90).stroke(borderColor);
        doc.moveTo(rightX, metaY + 22).lineTo(rightX + boxWidth, metaY + 22).stroke(borderColor);
        doc.moveTo(rightX, metaY + 44).lineTo(rightX + boxWidth, metaY + 44).stroke(borderColor);
        
        doc.moveTo(rightX + 90, metaY).lineTo(rightX + 90, metaY + 66).stroke(borderColor); // Vertical line
        
        // Bottom section of right box (colored)
        doc.rect(rightX, metaY + 66, boxWidth, 24).fill(primaryColor);

        doc.fillColor(primaryColor).fontSize(8).font('Helvetica-Bold');
        doc.text('BANK A/C NO', rightX + 5, metaY + 8);
        doc.text('UAN / PF NO', rightX + 5, metaY + 30);
        doc.text('PAN', rightX + 5, metaY + 52);
        
        doc.fillColor(textColor).fontSize(9).font('Helvetica');
        doc.text(employee.bankAccountNumber || 'N/A', rightX + 95, metaY + 7);
        doc.text(employee.uanNumber || 'N/A', rightX + 95, metaY + 29);
        doc.text(employee.panNumber || 'N/A', rightX + 95, metaY + 51);

        doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
        doc.text('SALARY MONTH', rightX + 10, metaY + 74);
        doc.text(`${slip.month} ${slip.year}`, rightX + 95, metaY + 74);


        // --- FINANCIAL TABLE ---
        const tableY = 280;
        
        // Table Header
        doc.rect(40, tableY, 515, 20).fill(primaryColor);
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
        doc.text('EARNINGS', 50, tableY + 6);
        doc.text('AMOUNT', 220, tableY + 6, { width: 70, align: 'right' });
        doc.text('DEDUCTIONS', 310, tableY + 6);
        doc.text('AMOUNT', 475, tableY + 6, { width: 70, align: 'right' });
        
        // Table Body
        let currentY = tableY + 20;
        
        const earnings = [
            { name: 'Basic Salary', amount: slip.basicSalary },
            { name: 'House Rent Allowance', amount: slip.hra },
            { name: 'Dearness Allowance', amount: slip.da },
            { name: 'Special Allowance', amount: slip.specialAllowance },
            { name: 'Other Allowances', amount: slip.otherAllowances }
        ].filter(e => parseFloat(e.amount) > 0);
        
        const deductions = [
            { name: 'Provident Fund (Employee)', amount: slip.pfEmployeeContribution },
            { name: 'ESI (Employee)', amount: slip.esiEmployeeContribution },
            { name: 'Professional Tax', amount: slip.professionalTax },
            { name: 'Income Tax', amount: slip.incomeTax },
            { name: 'Other Deductions', amount: slip.otherDeductions }
        ].filter(d => parseFloat(d.amount) > 0);

        const maxRows = Math.max(earnings.length, deductions.length);
        
        doc.fillColor(textColor).font('Helvetica').fontSize(9);
        
        for (let i = 0; i < maxRows; i++) {
            // Alternating background
            if (i % 2 === 0) {
                doc.rect(40, currentY, 515, 20).fill(lightBg);
            }
            
            // Vertical separators
            doc.moveTo(40, currentY).lineTo(40, currentY + 20).stroke(borderColor);
            doc.moveTo(300, currentY).lineTo(300, currentY + 20).stroke(borderColor);
            doc.moveTo(555, currentY).lineTo(555, currentY + 20).stroke(borderColor);

            doc.fillColor(textColor);
            
            // Earnings side
            if (earnings[i]) {
                doc.text(earnings[i].name, 50, currentY + 6);
                doc.text(parseFloat(earnings[i].amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 220, currentY + 6, { width: 70, align: 'right' });
            }
            
            // Deductions side
            if (deductions[i]) {
                doc.text(deductions[i].name, 310, currentY + 6);
                doc.text(parseFloat(deductions[i].amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 475, currentY + 6, { width: 70, align: 'right' });
            }
            
            currentY += 20;
        }

        // Draw horizontal line after last item
        doc.moveTo(40, currentY).lineTo(555, currentY).stroke(borderColor);
        
        // --- TOTALS ROW ---
        doc.rect(40, currentY, 515, 25).fill(lightBg);
        doc.moveTo(40, currentY).lineTo(40, currentY + 25).stroke(borderColor);
        doc.moveTo(300, currentY).lineTo(300, currentY + 25).stroke(borderColor);
        doc.moveTo(555, currentY).lineTo(555, currentY + 25).stroke(borderColor);
        doc.moveTo(40, currentY + 25).lineTo(555, currentY + 25).stroke(borderColor);

        doc.fillColor(primaryColor).font('Helvetica-Bold');
        doc.text('Total Earnings', 50, currentY + 8);
        doc.text(parseFloat(slip.grossSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 220, currentY + 8, { width: 70, align: 'right' });
        
        doc.text('Total Deductions', 310, currentY + 8);
        doc.text(parseFloat(slip.totalDeductions).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 475, currentY + 8, { width: 70, align: 'right' });

        currentY += 35;
        
        // --- NET PAYABLE ---
        doc.rect(40, currentY, 515, 30).fill(primaryColor);
        doc.fillColor('#ffffff').fontSize(12);
        doc.text('NET PAYABLE', 50, currentY + 9);
        doc.text(`Rs. ${parseFloat(slip.netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 350, currentY + 9, { width: 195, align: 'right' });
        
        // Amount in words (simple placeholder)
        currentY += 40;
        doc.fillColor(textColor).fontSize(9).font('Helvetica-Oblique');
        doc.text(`Amount in words: Rupees Forty Six Thousand Four Hundred Only`, 40, currentY); // Hardcoded for test
        
        doc.end();
    });
}

const mockSlip = {
    month: 'June',
    year: '2026',
    basicSalary: '25000',
    hra: '12500',
    da: '0',
    specialAllowance: '10700',
    otherAllowances: '0',
    grossSalary: '48200',
    pfEmployeeContribution: '1800',
    esiEmployeeContribution: '0',
    professionalTax: '0',
    incomeTax: '0',
    otherDeductions: '0',
    totalDeductions: '1800',
    netSalary: '46400'
};
const mockComp = { name: 'Energize Inc.' };
const mockEmp = { 
    name: 'Rahul Sharma', 
    employeeId: 'EMP-001', 
    department: 'Engineering', 
    designation: 'Senior Developer',
    bankAccountNumber: '1234567890',
    uanNumber: '100023456789',
    panNumber: 'ABCDE1234F'
};

generatePayslipPDF(mockSlip, mockComp, mockEmp).then(buffer => {
    fs.writeFileSync('C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\619946a5-1ce5-4807-abaa-9ebdb8d2bf83\\scratch\\test_payslip.pdf', buffer);
    console.log('PDF saved to test_payslip.pdf');
});
