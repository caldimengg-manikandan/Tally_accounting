const PDFDocument = require('pdfkit');

class PDFService {
    static async generateRetainerInvoice(retainer, items) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // --- HEADER ---
            doc.fillColor('#000000')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('Indus CAI private Ltd', 50, 50);
            
            doc.fontSize(10)
               .font('Helvetica')
               .text('Tamil Nadu', 50, 65)
               .text('India', 50, 78)
               .text('naveenswathi1811@gmail.com', 50, 91);

            doc.fontSize(36)
               .font('Helvetica-Bold')
               .text('RETAINER INVOICE', 250, 50, { align: 'right' });

            doc.fontSize(12)
               .text(`Retainer# ${retainer.invoiceNumber}`, 250, 95, { align: 'right' });

            // --- BALANCE DUE BOX ---
            doc.fontSize(10)
               .fillColor('#888888')
               .text('Balance Due', 400, 130, { align: 'right' });
            
            doc.fontSize(18)
               .fillColor('#000000')
               .text(`₹${parseFloat(retainer.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 400, 145, { align: 'right' });

            // --- BILL TO ---
            doc.fillColor('#888888')
               .fontSize(10)
               .text('Bill To', 50, 200);
            
            doc.fillColor('#000000')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text(retainer.customerName, 50, 215);

            doc.font('Helvetica')
               .fontSize(10)
               .text('Retainer Date :', 350, 215)
               .text(new Date(retainer.invoiceDate).toLocaleDateString('en-GB'), 500, 215, { align: 'right' });

            // --- TABLE HEADER ---
            const tableTop = 260;
            doc.rect(50, tableTop, 500, 25).fill('#444444');
            
            doc.fillColor('#ffffff')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('#', 60, tableTop + 8)
               .text('Description', 100, tableTop + 8)
               .text('Amount', 450, tableTop + 8, { width: 90, align: 'right' });

            // --- TABLE ITEMS ---
            let currentCursor = tableTop + 25;
            doc.fillColor('#000000').font('Helvetica');

            items.forEach((item, index) => {
                doc.text(index + 1, 60, currentCursor + 10)
                   .text(item.description || 'Retainer Amount', 100, currentCursor + 10)
                   .text(parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 450, currentCursor + 10, { width: 90, align: 'right' });
                
                currentCursor += 30;
                doc.moveTo(50, currentCursor).lineTo(550, currentCursor).strokeColor('#eeeeee').stroke();
            });

            // --- TOTALS ---
            const totalStart = currentCursor + 20;
            doc.fillColor('#555555')
               .fontSize(10)
               .text('Sub Total', 350, totalStart)
               .fillColor('#000000')
               .text(parseFloat(retainer.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 450, totalStart, { width: 90, align: 'right' });

            doc.font('Helvetica-Bold')
               .fontSize(12)
               .text('Total', 350, totalStart + 25)
               .text(`₹${parseFloat(retainer.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, totalStart + 25, { width: 90, align: 'right' });

            doc.rect(350, totalStart + 50, 200, 30).fill('#f9f9f9');
            doc.fillColor('#000000')
               .text('Balance Due', 360, totalStart + 60)
               .text(`₹${parseFloat(retainer.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, totalStart + 60, { width: 90, align: 'right' });

            // --- WORDS ---
            doc.fillColor('#888888')
               .fontSize(9)
               .font('Helvetica-Oblique')
               .text('Total In Words:', 350, totalStart + 100);
            
            doc.fillColor('#333333')
               .fontSize(10)
               .font('Helvetica-BoldOblique')
               .text('Indian Rupee Two Thousand Only', 420, totalStart + 100);

            // --- SIGNATURE ---
            doc.font('Helvetica-Bold')
               .fontSize(11)
               .text('Authorized Signature', 50, totalStart + 150);
            
            doc.moveTo(160, totalStart + 160).lineTo(350, totalStart + 160).strokeColor('#000000').stroke();

            doc.end();
        });
    }

    static async generateQuote(quote, items) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // --- HEADER ---
            doc.fillColor('#000000')
               .fontSize(14)
               .font('Helvetica-Bold')
               .text('Indus CAI private Ltd', 50, 50);
            
            doc.fontSize(10)
               .font('Helvetica')
               .text('Tamil Nadu', 50, 68)
               .text('India', 50, 81)
               .text('naveenswathi1811@gmail.com', 50, 94);

            doc.fontSize(36)
               .font('Helvetica-Bold')
               .text('QUOTE', 250, 50, { align: 'right' });

            doc.fontSize(12)
               .text(`Quote# ${quote.quoteNumber}`, 250, 95, { align: 'right' });

            // --- QUOTE DETAILS ---
            doc.fontSize(10)
               .fillColor('#666666')
               .text('Quote Date :', 50, 150)
               .fillColor('#000000')
               .text(new Date(quote.quoteDate).toLocaleDateString('en-GB'), 120, 150);

            if (quote.expiryDate) {
                doc.fillColor('#666666')
                   .text('Valid Until  :', 50, 165)
                   .fillColor('#000000')
                   .text(new Date(quote.expiryDate).toLocaleDateString('en-GB'), 120, 165);
            }

            // --- BILL TO ---
            doc.fillColor('#888888')
               .fontSize(10)
               .text('Customer Details', 50, 200);
            
            doc.fillColor('#000000')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text(quote.customerName, 50, 215);

            // --- TABLE HEADER ---
            const tableTop = 260;
            doc.rect(50, tableTop, 500, 25).fill('#444444');
            
            doc.fillColor('#ffffff')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('#', 60, tableTop + 8)
               .text('Description', 100, tableTop + 8)
               .text('Qty', 350, tableTop + 8, { width: 50, align: 'center' })
               .text('Rate', 400, tableTop + 8, { width: 70, align: 'right' })
               .text('Total', 470, tableTop + 8, { width: 80, align: 'right' });

            // --- TABLE ITEMS ---
            let currentCursor = tableTop + 25;
            doc.fillColor('#000000').font('Helvetica');

            items.forEach((item, index) => {
                doc.text(index + 1, 60, currentCursor + 10)
                   .text(item.itemDetails, 100, currentCursor + 10, { width: 240 })
                   .text(item.quantity, 350, currentCursor + 10, { width: 50, align: 'center' })
                   .text(parseFloat(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 400, currentCursor + 10, { width: 70, align: 'right' })
                   .text(parseFloat(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 470, currentCursor + 10, { width: 80, align: 'right' });
                
                currentCursor += 30;
                doc.moveTo(50, currentCursor).lineTo(550, currentCursor).strokeColor('#eeeeee').stroke();
            });

            // --- TOTALS ---
            const totalStart = currentCursor + 20;
            doc.fillColor('#555555')
               .fontSize(10)
               .text('Sub Total', 350, totalStart)
               .fillColor('#000000')
               .text(parseFloat(quote.subTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 470, totalStart, { width: 80, align: 'right' });

            if (quote.taxAmount > 0) {
                doc.fillColor('#555555')
                   .text(`Tax (${quote.selectedTax || 'GST'})`, 350, totalStart + 20)
                   .fillColor('#000000')
                   .text(parseFloat(quote.taxAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 470, totalStart + 20, { width: 80, align: 'right' });
            }

            doc.font('Helvetica-Bold')
               .fontSize(12)
               .text('Total', 350, totalStart + 50)
               .text(`₹${parseFloat(quote.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 470, totalStart + 50, { width: 80, align: 'right' });

            // --- TERMS & NOTES ---
            if (quote.termsConditions) {
                doc.fontSize(9)
                   .fillColor('#888888')
                   .text('Terms & Conditions:', 50, totalStart + 100);
                doc.fontSize(9)
                   .fillColor('#555555')
                   .font('Helvetica')
                   .text(quote.termsConditions, 50, totalStart + 115, { width: 250 });
            }

            // --- SIGNATURE ---
            doc.font('Helvetica-Bold')
               .fontSize(11)
               .text('Authorized Signature', 400, totalStart + 150, { align: 'right' });
            
            doc.moveTo(350, totalStart + 190).lineTo(550, totalStart + 190).strokeColor('#000000').stroke();

            doc.end();
        });
    }
}

module.exports = PDFService;
