const PDFDocument = require('pdfkit');

class PDFService {
    static async generateRetainerInvoice(retainer, items, company = {}) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            const companyName = company.name || 'Your Company';
            const companyState = company.state || '';
            const companyEmail = company.email || '';

            // --- HEADER ---
            doc.fillColor('#000000')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text(companyName, 50, 50);
            
            doc.fontSize(10)
               .font('Helvetica');
            
            let headerY = 65;
            if (companyState) { doc.text(companyState, 50, headerY); headerY += 13; }
            if (companyEmail) { doc.text(companyEmail, 50, headerY); }

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
               .text(`Rs. ${parseFloat(retainer.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 400, 145, { align: 'right' });

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
               .text(`Rs. ${parseFloat(retainer.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, totalStart + 25, { width: 90, align: 'right' });

            doc.rect(350, totalStart + 50, 200, 30).fill('#f9f9f9');
            doc.fillColor('#000000')
               .text('Balance Due', 360, totalStart + 60)
               .text(`Rs. ${parseFloat(retainer.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 450, totalStart + 60, { width: 90, align: 'right' });

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

    static async generateQuote(quote, items, company = {}) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            const companyName = company.name || 'Your Company';
            const companyState = company.state || '';
            const companyEmail = company.email || '';

            // --- HEADER ---
            doc.fillColor('#000000')
               .fontSize(14)
               .font('Helvetica-Bold')
               .text(companyName, 50, 50);
            
            doc.fontSize(10)
               .font('Helvetica');

            let headerY = 68;
            if (companyState) { doc.text(companyState, 50, headerY); headerY += 13; }
            if (companyEmail) { doc.text(companyEmail, 50, headerY); }

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
               .text(`Rs. ${parseFloat(quote.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 470, totalStart + 50, { width: 80, align: 'right' });

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

    static async generateInvoice(invoice, items, company) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // --- HEADER ---
            doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold').text(company?.name || 'Indus CAI private Ltd', 50, 50);
            doc.fontSize(10).font('Helvetica').text(company?.state || 'Tamil Nadu', 50, 68).text('India', 50, 81).text(company?.email || 'support@induscai.com', 50, 94);
            doc.fontSize(36).font('Helvetica-Bold').text('TAX INVOICE', 250, 50, { align: 'right' });
            doc.fontSize(12).text(`Invoice# ${invoice.invoiceNumber}`, 250, 95, { align: 'right' });

            // --- BILL TO ---
            doc.fillColor('#888888').fontSize(10).text('Bill To', 50, 200);
            doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text(invoice.CustomerLedger?.name || 'Customer Name', 50, 215);
            
            // Format Address for PDF
            let addrStr = '';
            const rawAddr = invoice.CustomerLedger?.billingAddress || invoice.CustomerLedger?.address;
            if (rawAddr) {
                try {
                    const parsed = typeof rawAddr === 'string' ? JSON.parse(rawAddr) : rawAddr;
                    addrStr = [parsed.street1, parsed.street2, parsed.city, parsed.state, parsed.pinCode].filter(Boolean).join(', ');
                } catch (e) {
                    addrStr = rawAddr;
                }
            }
            doc.font('Helvetica').fontSize(10).text(addrStr, 50, 230, { width: 250 });

            doc.font('Helvetica').fontSize(10).text('Invoice Date :', 350, 215).text(new Date(invoice.date).toLocaleDateString('en-GB'), 500, 215, { align: 'right' });
            doc.text('Due Date :', 350, 230).text(new Date(invoice.dueDate || invoice.date).toLocaleDateString('en-GB'), 500, 230, { align: 'right' });

            // --- TABLE HEADER ---
            const tableTop = 280;
            doc.rect(50, tableTop, 500, 25).fill('#333333');
            doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('#', 60, tableTop + 8).text('Item & Description', 100, tableTop + 8).text('Qty', 350, tableTop + 8, { width: 50, align: 'center' }).text('Rate', 400, tableTop + 8, { width: 70, align: 'right' }).text('Amount', 470, tableTop + 8, { width: 80, align: 'right' });

            // --- TABLE ITEMS ---
            let currentCursor = tableTop + 25;
            doc.fillColor('#000000').font('Helvetica');
            items.forEach((item, index) => {
                const itemName = item.Item?.name || 'Service Item';
                doc.text(index + 1, 60, currentCursor + 10).text(`${itemName}\n${item.description || ''}`, 100, currentCursor + 10, { width: 240 }).text(item.quantity, 350, currentCursor + 10, { width: 50, align: 'center' }).text(parseFloat(item.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 400, currentCursor + 10, { width: 70, align: 'right' }).text(parseFloat(item.amount || (item.quantity * item.rate)).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 470, currentCursor + 10, { width: 80, align: 'right' });
                currentCursor += 40;
                doc.moveTo(50, currentCursor).lineTo(550, currentCursor).strokeColor('#eeeeee').stroke();
            });

            // --- TOTALS ---
            const totalStart = Math.max(currentCursor + 20, 500);
            doc.fillColor('#555555').fontSize(10).text('Sub Total', 350, totalStart).fillColor('#000000').text(parseFloat(invoice.subTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 470, totalStart, { width: 80, align: 'right' });
            doc.text(`GST (18%)`, 350, totalStart + 20).text(parseFloat(invoice.gstAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }), 470, totalStart + 20, { width: 80, align: 'right' });
            doc.font('Helvetica-Bold').fontSize(12).text('Total', 350, totalStart + 50).text(`Rs. ${parseFloat(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 470, totalStart + 50, { width: 80, align: 'right' });

            doc.end();
        });
    }

    static async generateDeliveryChallan(challan, items, company) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // --- HEADER ---
            doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold').text(company?.name || 'Indus CAI private Ltd', 50, 50);
            doc.fontSize(10).font('Helvetica').text(company?.state || 'Tamil Nadu', 50, 68).text('India', 50, 81).text(company?.email || 'support@induscai.com', 50, 94);
            doc.fontSize(36).font('Helvetica-Bold').text('DELIVERY CHALLAN', 100, 50, { align: 'right' });
            doc.fontSize(12).text(`Challan# ${challan.challanNumber}`, 250, 95, { align: 'right' });

            // --- BILL TO ---
            doc.fillColor('#888888').fontSize(10).text('Deliver To', 50, 200);
            doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold').text(challan.Customer?.name || 'Customer Name', 50, 215);

            doc.font('Helvetica').fontSize(10).text('Challan Date :', 350, 215).text(new Date(challan.date).toLocaleDateString('en-GB'), 500, 215, { align: 'right' });

            // --- TABLE HEADER ---
            const tableTop = 260;
            doc.rect(50, tableTop, 500, 25).fill('#333333');
            doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('#', 60, tableTop + 8).text('Item & Description', 100, tableTop + 8).text('Qty', 350, tableTop + 8, { width: 50, align: 'center' }).text('Rate', 400, tableTop + 8, { width: 70, align: 'right' }).text('Amount', 470, tableTop + 8, { width: 80, align: 'right' });

            // --- TABLE ITEMS ---
            let currentCursor = tableTop + 25;
            doc.fillColor('#000000').font('Helvetica');
            items.forEach((item, index) => {
                const itemName = item.Item?.name || 'Product Item';
                doc.text(index + 1, 60, currentCursor + 10).text(`${itemName}\n${item.description || ''}`, 100, currentCursor + 10, { width: 240 }).text(item.quantity, 350, currentCursor + 10, { width: 50, align: 'center' }).text(parseFloat(item.rate).toLocaleString('en-IN'), 400, currentCursor + 10, { width: 70, align: 'right' }).text(parseFloat(item.amount).toLocaleString('en-IN'), 470, currentCursor + 10, { width: 80, align: 'right' });
                currentCursor += 40;
                doc.moveTo(50, currentCursor).lineTo(550, currentCursor).strokeColor('#eeeeee').stroke();
            });

            // --- TOTALS ---
            const totalStart = Math.max(currentCursor + 20, 500);
            doc.fillColor('#555555').fontSize(10).text('Sub Total', 350, totalStart).fillColor('#000000').text(parseFloat(challan.subTotal || 0).toLocaleString('en-IN'), 470, totalStart, { width: 80, align: 'right' });
            doc.font('Helvetica-Bold').fontSize(12).text('Total', 350, totalStart + 25).text(`Rs. ${parseFloat(challan.totalAmount || 0).toLocaleString('en-IN')}`, 470, totalStart + 25, { width: 80, align: 'right' });

            doc.end();
        });
    }

    static async generatePurchaseOrder(order, items, company, vendor) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // ─── HEADER ──────────────────────────────────────────────────
            doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold')
               .text(company?.name || 'Our Company', 40, 40);
            
            let companyInfoY = 56;
            doc.fontSize(9).font('Helvetica').fillColor('#444444');
            if (company?.state) {
                doc.text(company.state, 40, companyInfoY);
                companyInfoY += 12;
            }
            if (company?.location) {
                doc.text(company.location, 40, companyInfoY);
                companyInfoY += 12;
            }
            if (company?.phone) {
                doc.text(company.phone, 40, companyInfoY);
                companyInfoY += 12;
            }
            if (company?.email) {
                doc.text(company.email, 40, companyInfoY);
                companyInfoY += 12;
            }

            // Right side: TITLE
            doc.fontSize(22).font('Helvetica-Bold').fillColor('#000000')
               .text('PURCHASE ORDER', 250, 40, { width: 305, align: 'right' });

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333')
               .text(`# ${order.orderNumber || order.poNumber || 'PENDING'}`, 250, 66, { width: 305, align: 'right' });

            // ─── ADDRESSES & DATES SECTION ────────────────────────────────
            const addressY = 130;
            
            // 1. Vendor Address
            doc.fillColor('#555555').fontSize(9).font('Helvetica-Bold')
               .text('Vendor Address', 40, addressY);
            
            doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold')
               .text(vendor?.name || order.vendorName || 'Vendor', 40, addressY + 13);
            
            // Build vendor address lines
            const vendorLines = [];
            const rawAddr = vendor?.billingAddressJson || vendor?.billingAddress || vendor?.address;
            if (rawAddr) {
                try {
                    const parsed = typeof rawAddr === 'string' && (rawAddr.startsWith('{') || rawAddr.startsWith('[')) ? JSON.parse(rawAddr) : rawAddr;
                    if (parsed && typeof parsed === 'object') {
                        if (parsed.attention) vendorLines.push(parsed.attention);
                        const street = [parsed.street1 || parsed.address1, parsed.street2 || parsed.address2].filter(Boolean).join(', ');
                        if (street) vendorLines.push(street);
                        const cityStatePin = [parsed.city, parsed.state, parsed.pinCode || parsed.zip || parsed.zipCode || parsed.pincode].filter(Boolean).join(', ');
                        if (cityStatePin) vendorLines.push(cityStatePin);
                        if (parsed.country) vendorLines.push(parsed.country);
                        if (parsed.phone) vendorLines.push(parsed.phone);
                    } else if (typeof rawAddr === 'string') {
                        vendorLines.push(rawAddr);
                    }
                } catch (e) {
                    if (typeof rawAddr === 'string') vendorLines.push(rawAddr);
                }
            }
            
            // Date formatting helper to prevent timezone / local offset issues
            const formatDate = (dateVal) => {
                if (!dateVal) return '—';
                try {
                    if (typeof dateVal === 'string') {
                        const match = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
                        if (match) {
                            return `${match[3]}/${match[2]}/${match[1]}`;
                        }
                    }
                    const d = new Date(dateVal);
                    if (isNaN(d.getTime())) return '—';
                    const day = String(d.getDate()).padStart(2, '0');
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const year = d.getFullYear();
                    return `${day}/${month}/${year}`;
                } catch (e) {
                    return '—';
                }
            };

            doc.font('Helvetica').fontSize(9).fillColor('#444444');
            doc.x = 40;
            doc.y = addressY + 26;
            vendorLines.forEach(line => {
                doc.text(line, { width: 170 });
            });
            let currentVendorY = doc.y;

            // 2. Deliver To Address
            doc.fillColor('#555555').fontSize(9).font('Helvetica-Bold')
               .text('Deliver To', 220, addressY);

            // Build delivery address lines
            const deliveryLines = [];
            let parsedDelivery = null;
            try {
                if (order.deliveryAddressDataJson) {
                    parsedDelivery = JSON.parse(order.deliveryAddressDataJson);
                }
            } catch (e) {}

            const isEmptyDelivery = !parsedDelivery || (!parsedDelivery.street1 && !parsedDelivery.city && !parsedDelivery.attention);
            if ((order.deliveryAddress === 'Organization' || !order.deliveryAddress) && isEmptyDelivery && company) {
                parsedDelivery = {
                    attention: company.name || '',
                    street1: company.street1 || '',
                    street2: company.street2 || '',
                    city: company.city || '',
                    state: company.state || '',
                    zip: company.pincode || '',
                    country: company.location || 'India',
                    phone: company.phone || ''
                };
            }

            if (parsedDelivery) {
                if (parsedDelivery.attention) deliveryLines.push(parsedDelivery.attention);
                const street = [parsedDelivery.street1, parsedDelivery.street2].filter(Boolean).join(', ');
                if (street) deliveryLines.push(street);
                const cityStateZip = [parsedDelivery.city, parsedDelivery.state, parsedDelivery.zip || parsedDelivery.pincode || parsedDelivery.zipCode].filter(Boolean).join(', ');
                if (cityStateZip) deliveryLines.push(cityStateZip);
                if (parsedDelivery.country) deliveryLines.push(parsedDelivery.country);
                if (parsedDelivery.phone) deliveryLines.push(parsedDelivery.phone);
            } else if (order.deliveryAddressText) {
                deliveryLines.push(order.deliveryAddressText);
            }
            if (company?.email && !deliveryLines.includes(company.email)) {
                deliveryLines.push(company.email);
            }

            doc.font('Helvetica').fontSize(9).fillColor('#444444');
            doc.x = 220;
            doc.y = addressY + 13;
            deliveryLines.forEach(line => {
                doc.text(line, { width: 180 });
            });
            let currentDeliveryY = doc.y;

            // 3. Date / Order Info
            const orderDate = formatDate(order.date);
            const deliveryDate = formatDate(order.deliveryDate);
            
            let dateY = addressY + 50;
            doc.fillColor('#555555').fontSize(9).font('Helvetica');
            
            doc.text('Date :', 410, dateY);
            doc.fillColor('#000000').font('Helvetica').text(orderDate, 470, dateY, { width: 85, align: 'right' });
            dateY += 15;

            doc.fillColor('#555555').text('Delivery Date :', 410, dateY);
            doc.fillColor('#000000').text(deliveryDate, 470, dateY, { width: 85, align: 'right' });
            dateY += 15;

            if (order.paymentTerms) {
                doc.fillColor('#555555').text('Payment Terms :', 410, dateY);
                doc.fillColor('#000000').text(order.paymentTerms, 470, dateY, { width: 85, align: 'right' });
                dateY += 15;
            }
            if (order.reference) {
                doc.fillColor('#555555').text('Reference :', 410, dateY);
                doc.fillColor('#000000').text(order.reference, 470, dateY, { width: 85, align: 'right' });
                dateY += 15;
            }

            // ─── HORIZONTAL DIVIDER ───────────────────────────────────────
            const maxAddressEnd = Math.max(currentVendorY, currentDeliveryY, dateY) + 15;
            const dividerY = Math.max(maxAddressEnd, 235);
            doc.moveTo(40, dividerY).lineTo(555, dividerY).strokeColor('#dddddd').lineWidth(0.5).stroke();

            // ─── TABLE HEADER ─────────────────────────────────────────────
            const tableTop = dividerY + 15;
            doc.rect(40, tableTop, 515, 20).fill('#3c3c3c');
            doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
               .text('#', 50, tableTop + 6)
               .text('Item & Description', 80, tableTop + 6)
               .text('Qty', 340, tableTop + 6, { width: 50, align: 'right' })
               .text('Rate', 400, tableTop + 6, { width: 70, align: 'right' })
               .text('Amount', 480, tableTop + 6, { width: 75, align: 'right' });

            // ─── TABLE ROWS ───────────────────────────────────────────────
            let currentY = tableTop + 20;
            let parsedItems = items;
            if (!Array.isArray(items)) {
                try { parsedItems = JSON.parse(items || '[]'); } catch (e) { parsedItems = []; }
            }
            doc.fillColor('#000000').font('Helvetica');

            parsedItems.forEach((item, idx) => {
                const itemName = item.itemDetails || item.itemName || item.name || item.description || 'Item';
                const qty = parseFloat(item.quantity || item.qty || 0);
                const rate = parseFloat(item.rate || item.unitPrice || 0);
                const amount = parseFloat(item.amount || item.total || (qty * rate) || 0);

                // Estimate row height
                const textHeight = Math.max(20, Math.ceil(itemName.length / 45) * 12 + 8);
                
                doc.fillColor('#000000').fontSize(9)
                   .text(idx + 1, 50, currentY + 6)
                   .text(itemName, 80, currentY + 6, { width: 250 })
                   .text(qty.toFixed(2), 340, currentY + 6, { width: 50, align: 'right' })
                   .text(rate.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 400, currentY + 6, { width: 70, align: 'right' })
                   .text(amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), 480, currentY + 6, { width: 75, align: 'right' });

                currentY += textHeight;
                doc.moveTo(40, currentY).lineTo(555, currentY).strokeColor('#eeeeee').lineWidth(0.5).stroke();
            });

            if (parsedItems.length === 0) {
                doc.fillColor('#888888').fontSize(9).font('Helvetica-Oblique')
                   .text('No items found.', 80, currentY + 8);
                currentY += 24;
            }

            // ─── TOTALS ───────────────────────────────────────────────────
            const totalStart = currentY + 15;
            const subtotal = parseFloat(order.subtotal || order.subTotal || 0);
            const discountAmt = parseFloat(order.discountAmount || 0);
            const taxAmt = parseFloat(order.taxAmount || 0);
            const adjustment = parseFloat(order.adjustment || 0);
            const total = parseFloat(order.totalAmount || 0);

            let totY = totalStart;
            
            // Sub Total
            doc.fillColor('#555555').fontSize(9).font('Helvetica')
               .text('Sub Total', 380, totY)
               .fillColor('#000000')
               .text(`${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 480, totY, { width: 75, align: 'right' });
            totY += 15;

            if (discountAmt > 0) {
                doc.fillColor('#555555').text(`Discount`, 380, totY).fillColor('#000000').text(`-${discountAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 480, totY, { width: 75, align: 'right' });
                totY += 15;
            }
            if (taxAmt > 0) {
                doc.fillColor('#555555').text(`Tax`, 380, totY).fillColor('#000000').text(`${taxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 480, totY, { width: 75, align: 'right' });
                totY += 15;
            }
            if (adjustment !== 0) {
                doc.fillColor('#555555').text('Adjustment', 380, totY).fillColor('#000000').text(`${adjustment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 480, totY, { width: 75, align: 'right' });
                totY += 15;
            }

            doc.moveTo(380, totY).lineTo(555, totY).strokeColor('#dddddd').lineWidth(0.5).stroke();
            totY += 5;
            
            // Grand Total
            doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold')
               .text('Total', 380, totY)
               .text(`Rs. ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 480, totY, { width: 75, align: 'right' });

            // ─── AUTHORIZED SIGNATURE ─────────────────────────────────────
            const sigY = 700;
            doc.fillColor('#000000').fontSize(9).font('Helvetica')
               .text('Authorized Signature ____________________', 40, sigY);

            doc.end();
        });
    }

    static async generateEmployeeProfile(employee, company) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // --- HEADER ---
            doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold')
               .text(company?.name || 'Company Profile', 40, 40);
            
            doc.fontSize(9).font('Helvetica').fillColor('#444444')
               .text(company?.state || '', 40, 56)
               .text(company?.email || '', 40, 68);

            doc.fontSize(22).font('Helvetica-Bold').fillColor('#1e3a8a')
               .text('EMPLOYEE PROFILE', 250, 40, { width: 305, align: 'right' });

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333')
               .text(`ID: ${employee.employeeId}`, 250, 66, { width: 305, align: 'right' });

            doc.moveTo(40, 95).lineTo(555, 95).strokeColor('#dddddd').lineWidth(0.5).stroke();

            let y = 110;

            const printSectionHeader = (title) => {
                if (y > 700) {
                    doc.addPage();
                    y = 40;
                }
                doc.rect(40, y, 515, 18).fill('#f1f5f9');
                doc.fillColor('#1e3a8a').fontSize(9).font('Helvetica-Bold').text(title, 48, y + 5);
                y += 25;
            };

            const printField = (label, value, x) => {
                doc.fillColor('#64748b').fontSize(8).font('Helvetica').text(label, x, y);
                doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(value || '—', x, y + 10);
            };

            // 1. Personal Details
            printSectionHeader('1. PERSONAL DETAILS');
            printField('First Name', employee.firstName, 45);
            printField('Middle Name', employee.middleName, 210);
            printField('Last Name', employee.lastName, 380);
            y += 28;

            printField('Gender', employee.gender, 45);
            printField('Date of Birth', employee.dob, 210);
            printField('Blood Group', employee.bloodGroup, 380);
            y += 28;

            printField('Father\'s Name', employee.fatherName, 45);
            printField('Mother\'s Name', employee.motherName, 210);
            printField('Marital Status', employee.maritalStatus, 380);
            y += 35;

            // 2. Contact Details
            printSectionHeader('2. CONTACT DETAILS');
            printField('Work Email', employee.email, 45);
            printField('Personal Email', employee.personalEmail, 210);
            printField('Mobile Number', employee.phone, 380);
            y += 28;

            printField('Emergency Contact Name', employee.emergencyContactName, 45);
            printField('Relationship', employee.emergencyContactRelation, 210);
            printField('Emergency Contact Phone', employee.emergencyContactPhone, 380);
            y += 35;

            // 3. Address Details
            printSectionHeader('3. ADDRESS DETAILS');
            const presentAddr = [
                employee.presentAddressLine1,
                employee.presentAddressLine2,
                [employee.presentAddressCity, employee.presentAddressState].filter(Boolean).join(', '),
                [employee.presentAddressCountry, employee.presentAddressZip].filter(Boolean).join(' - ')
            ].filter(Boolean).join('\n');
            
            const permanentAddr = employee.sameAsPresentAddress ? 'Same as Present Address' : [
                employee.permanentAddressLine1,
                employee.permanentAddressLine2,
                [employee.permanentAddressCity, employee.permanentAddressState].filter(Boolean).join(', '),
                [employee.permanentAddressCountry, employee.permanentAddressZip].filter(Boolean).join(' - ')
            ].filter(Boolean).join('\n');

            doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Present Address', 45, y);
            doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(presentAddr || '—', 45, y + 10, { width: 240, lineGap: 2 });

            doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Permanent Address', 300, y);
            doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(permanentAddr || '—', 300, y + 10, { width: 240, lineGap: 2 });
            y += 65;

            // 4. Employment Details
            printSectionHeader('4. EMPLOYMENT DETAILS');
            printField('Employee ID', employee.employeeId, 45);
            printField('Date of Joining', employee.dateOfJoining, 210);
            printField('Employment Type', employee.employmentType, 380);
            y += 28;

            printField('Department', employee.department, 45);
            printField('Designation', employee.designation, 210);
            printField('Work Location', employee.workLocation, 380);
            y += 28;

            printField('Status', employee.status, 45);
            printField('Resignation Date', employee.resignationDate, 210);
            y += 35;

            // 5. Bank Details
            printSectionHeader('5. BANK DETAILS');
            printField('Bank Name', employee.bankName, 45);
            printField('Account Number', employee.bankAccountNumber, 210);
            printField('Account Type', employee.bankAccountType, 380);
            y += 28;

            printField('IFSC Code', employee.ifscCode, 45);
            printField('Branch Name', employee.bankBranchName, 210);
            y += 35;

            // 6. Tax & Compliance Details
            printSectionHeader('6. TAX & COMPLIANCE');
            printField('PAN Number', employee.panNumber, 45);
            printField('Aadhaar Number', employee.aadhaarNumber, 210);
            printField('UAN / PF Number', employee.pfNumber, 380);
            y += 28;

            printField('ESI Number', employee.esiNumber, 45);
            printField('PRAN Number', employee.pranNumber, 210);
            y += 35;

            // 7. Education & Experience Details
            printSectionHeader('7. EDUCATION & EXPERIENCE');
            printField('Highest Qualification', employee.highestQualification, 45);
            printField('University/College', employee.universityCollege, 210);
            printField('Year of Passing', employee.yearOfPassing ? employee.yearOfPassing.toString() : '—', 380);
            y += 28;

            printField('Previous Company', employee.previousCompany, 45);
            printField('Years of Experience', employee.previousExperience ? employee.previousExperience.toString() : '—', 210);
            y += 35;

            doc.end();
        });
    }
    static async generateSalesOrder(order, items, company = {}) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 40, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const companyName = company.name || order.companyName || 'Your Company';
            const customerName = order.customerName || order.Customer?.displayName || order.Customer?.name || 'Customer';
            const customerAddress = (() => {
                try {
                    const raw = order.Customer?.billingAddress || order.billingAddress;
                    if (!raw) return '';
                    const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    return [p.street1, p.street2, p.city, p.state, p.pinCode, p.country].filter(Boolean).join(', ');
                } catch (e) { return ''; }
            })();
            const customerGST = order.Customer?.gstNumber || '';
            const customerState = order.Customer?.state || '';

            const formatDate = (d) => {
                if (!d) return '—';
                try {
                    const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
                    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
                    return new Date(d).toLocaleDateString('en-IN');
                } catch (e) { return '—'; }
            };

            // ─── TOP OUTER BORDER ───────────────────────────────────────────
            const pageW = 555; // usable width (595 - 2*40)
            const startY = 40;

            // ─── HEADER BOX: Company (left) | SALES ORDER info (right) ─────
            const headerH = 70;
            doc.rect(40, startY, pageW, headerH).stroke('#000000');
            // vertical divider at midpoint
            doc.moveTo(40 + pageW / 2, startY).lineTo(40 + pageW / 2, startY + headerH).stroke('#000000');

            // Left: Company name
            doc.fillColor('#000000').fontSize(13).font('Helvetica-Bold')
               .text(companyName, 46, startY + 8, { width: pageW / 2 - 12 });
            doc.fontSize(8).font('Helvetica').fillColor('#444444')
               .text(company.state || '', 46, startY + 26, { width: pageW / 2 - 12 })
               .text(company.email || '', 46, startY + 37, { width: pageW / 2 - 12 });
            if (company.gstNumber) {
                doc.text(`GSTIN: ${company.gstNumber}`, 46, startY + 48, { width: pageW / 2 - 12 });
            }

            // Right: SALES ORDER title + meta
            const rightX = 40 + pageW / 2 + 6;
            doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold')
               .text('SALES ORDER', rightX, startY + 6, { width: pageW / 2 - 12, align: 'center' });
            doc.fontSize(9).font('Helvetica')
               .text(`Order No: ${order.orderNumber || '—'}`, rightX, startY + 26, { width: pageW / 2 - 12 })
               .text(`Date: ${formatDate(order.date)}`, rightX, startY + 38, { width: pageW / 2 - 12 });
            if (order.referenceNumber) {
                doc.text(`Ref: ${order.referenceNumber}`, rightX, startY + 50, { width: pageW / 2 - 12 });
            }
            if (order.expectedShipmentDate) {
                doc.text(`Shipment Date: ${formatDate(order.expectedShipmentDate)}`, rightX, startY + 60, { width: pageW / 2 - 12 });
            }

            // ─── BUYER / CONSIGNEE BOX ──────────────────────────────────────
            const billY = startY + headerH;
            const billH = 72;
            doc.rect(40, billY, pageW, billH).stroke('#000000');
            doc.moveTo(40 + pageW / 2, billY).lineTo(40 + pageW / 2, billY + billH).stroke('#000000');

            // Left: Buyer (Bill To)
            doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
               .text('Buyer (Bill To):', 46, billY + 6);
            doc.fontSize(10).font('Helvetica-Bold')
               .text(customerName, 46, billY + 18, { width: pageW / 2 - 12 });
            doc.fontSize(8).font('Helvetica').fillColor('#333333')
               .text(customerAddress, 46, billY + 31, { width: pageW / 2 - 12 });
            if (customerGST) doc.text(`GSTIN/UIN: ${customerGST}`, 46, billY + 54, { width: pageW / 2 - 12 });
            if (customerState) doc.text(`State: ${customerState}`, 46, billY + 63, { width: pageW / 2 - 12 });

            // Right: Consignee (Ship To) — same as buyer by default
            doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
               .text('Consignee (Ship To):', rightX, billY + 6, { width: pageW / 2 - 12 });
            doc.fontSize(10).font('Helvetica-Bold')
               .text(customerName, rightX, billY + 18, { width: pageW / 2 - 12 });
            doc.fontSize(8).font('Helvetica').fillColor('#333333')
               .text(customerAddress, rightX, billY + 31, { width: pageW / 2 - 12 });
            if (customerGST) doc.text(`GSTIN/UIN: ${customerGST}`, rightX, billY + 54, { width: pageW / 2 - 12 });
            if (customerState) doc.text(`State: ${customerState}`, rightX, billY + 63, { width: pageW / 2 - 12 });

            // ─── ITEMS TABLE ────────────────────────────────────────────────
            const tableY = billY + billH;

            // Column widths
            const cols = { no: 30, desc: 155, hsn: 60, dueon: 65, qty: 50, rate: 70, per: 40, amount: 85 };
            const colX = {
                no: 40,
                desc: 40 + cols.no,
                hsn: 40 + cols.no + cols.desc,
                dueon: 40 + cols.no + cols.desc + cols.hsn,
                qty: 40 + cols.no + cols.desc + cols.hsn + cols.dueon,
                rate: 40 + cols.no + cols.desc + cols.hsn + cols.dueon + cols.qty,
                per: 40 + cols.no + cols.desc + cols.hsn + cols.dueon + cols.qty + cols.rate,
                amount: 40 + cols.no + cols.desc + cols.hsn + cols.dueon + cols.qty + cols.rate + cols.per,
            };
            const rowH = 22;

            // Header row
            doc.rect(40, tableY, pageW, rowH).fillAndStroke('#eeeeee', '#000000');
            const headers = ['Sl.\nNo.', 'Description of Goods', 'HSN/\nSAC', 'Due on', 'Qty', 'Rate', 'per', 'Amount'];
            const colKeys = ['no', 'desc', 'hsn', 'dueon', 'qty', 'rate', 'per', 'amount'];
            const colAligns = ['center', 'left', 'center', 'center', 'center', 'right', 'center', 'right'];

            doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold');
            colKeys.forEach((key, i) => {
                doc.text(headers[i], colX[key] + 2, tableY + 4, { width: cols[key] - 4, align: colAligns[i] });
                // vertical border
                doc.moveTo(colX[key], tableY).lineTo(colX[key], tableY + rowH).stroke('#000000');
            });
            // right border
            doc.moveTo(40 + pageW, tableY).lineTo(40 + pageW, tableY + rowH).stroke('#000000');
            // bottom border of header
            doc.moveTo(40, tableY + rowH).lineTo(40 + pageW, tableY + rowH).stroke('#000000');

            // Data rows
            let parsedItems = items;
            if (!Array.isArray(items)) {
                try { parsedItems = JSON.parse(items || '[]'); } catch (e) { parsedItems = []; }
            }

            let curY = tableY + rowH;
            const minRows = Math.max(parsedItems.length, 8);

            for (let i = 0; i < minRows; i++) {
                const it = parsedItems[i];
                const rowY = curY;

                // draw row background (alternating)
                if (it) {
                    doc.rect(40, rowY, pageW, rowH).stroke('#cccccc');
                } else {
                    doc.rect(40, rowY, pageW, rowH).stroke('#cccccc');
                }

                if (it) {
                    const qty = parseFloat(it.quantity || 0);
                    const rate = parseFloat(it.rate || 0);
                    const amount = parseFloat(it.amount || qty * rate || 0);
                    const itemName = it.detail || it.name || it.description || '—';
                    const dueOn = order.expectedShipmentDate
                        ? formatDate(order.expectedShipmentDate)
                        : (order.paymentTerms || '');

                    doc.fillColor('#000000').fontSize(8).font('Helvetica');
                    doc.text(String(i + 1), colX.no + 2, rowY + 6, { width: cols.no - 4, align: 'center' });
                    doc.text(itemName, colX.desc + 2, rowY + 6, { width: cols.desc - 4, align: 'left' });
                    doc.text(it.hsnCode || '', colX.hsn + 2, rowY + 6, { width: cols.hsn - 4, align: 'center' });
                    doc.text(dueOn, colX.dueon + 2, rowY + 6, { width: cols.dueon - 4, align: 'center' });
                    doc.text(qty.toString(), colX.qty + 2, rowY + 6, { width: cols.qty - 4, align: 'center' });
                    doc.text(rate.toLocaleString('en-IN', { minimumFractionDigits: 2 }), colX.rate + 2, rowY + 6, { width: cols.rate - 4, align: 'right' });
                    doc.text('Nos', colX.per + 2, rowY + 6, { width: cols.per - 4, align: 'center' });
                    doc.font('Helvetica-Bold').text(amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), colX.amount + 2, rowY + 6, { width: cols.amount - 4, align: 'right' });
                }

                // column dividers
                colKeys.forEach(key => {
                    doc.moveTo(colX[key], rowY).lineTo(colX[key], rowY + rowH).stroke('#000000');
                });
                doc.moveTo(40 + pageW, rowY).lineTo(40 + pageW, rowY + rowH).stroke('#000000');

                curY += rowH;
            }

            // ─── TOTALS ROW ────────────────────────────────────────────────
            const subTotal = parseFloat(order.subTotal || 0);
            const taxAmt = parseFloat(order.tax || order.taxAmount || 0);
            const taxPct = order.taxPercent || 18;
            const grandTotal = parseFloat(order.totalAmount || 0);
            const totalQty = parsedItems.reduce((s, it) => s + parseFloat(it?.quantity || 0), 0);

            // Total label row
            doc.rect(40, curY, pageW, rowH).fillAndStroke('#f5f5f5', '#000000');
            doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold')
               .text('Total', colX.no + 2, curY + 6, { width: cols.no + cols.desc + cols.hsn + cols.dueon - 4, align: 'right' });
            doc.text(totalQty.toString(), colX.qty + 2, curY + 6, { width: cols.qty - 4, align: 'center' });
            doc.text('', colX.rate + 2, curY + 6, { width: cols.rate - 4 });
            doc.text('', colX.per + 2, curY + 6, { width: cols.per - 4 });
            doc.text(subTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }), colX.amount + 2, curY + 6, { width: cols.amount - 4, align: 'right' });
            colKeys.forEach(key => {
                doc.moveTo(colX[key], curY).lineTo(colX[key], curY + rowH).stroke('#000000');
            });
            doc.moveTo(40 + pageW, curY).lineTo(40 + pageW, curY + rowH).stroke('#000000');
            curY += rowH;

            // GST row (if applicable)
            if (taxAmt > 0) {
                doc.rect(40, curY, pageW, rowH).stroke('#000000');
                doc.fillColor('#000000').fontSize(8).font('Helvetica')
                   .text(`GST (${taxPct}%)`, colX.no + 2, curY + 6, { width: pageW - cols.amount - 4, align: 'right' });
                doc.font('Helvetica-Bold')
                   .text(taxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }), colX.amount + 2, curY + 6, { width: cols.amount - 4, align: 'right' });
                colKeys.forEach(key => {
                    doc.moveTo(colX[key], curY).lineTo(colX[key], curY + rowH).stroke('#000000');
                });
                doc.moveTo(40 + pageW, curY).lineTo(40 + pageW, curY + rowH).stroke('#000000');
                curY += rowH;
            }

            // Grand Total row
            const gtRowH = 26;
            doc.rect(40, curY, pageW, gtRowH).fillAndStroke('#e0e0e0', '#000000');
            doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold')
               .text('Grand Total', colX.no + 2, curY + 7, { width: pageW - cols.amount - 4, align: 'right' });
            doc.text(`Rs. ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, colX.amount + 2, curY + 7, { width: cols.amount - 4, align: 'right' });
            doc.moveTo(colX.amount, curY).lineTo(colX.amount, curY + gtRowH).stroke('#000000');
            doc.moveTo(40 + pageW, curY).lineTo(40 + pageW, curY + gtRowH).stroke('#000000');
            curY += gtRowH;

            // ─── NOTES / TERMS ──────────────────────────────────────────────
            if (order.customerNotes || order.termsConditions) {
                const notesH = 50;
                doc.rect(40, curY, pageW, notesH).stroke('#000000');
                if (order.customerNotes && order.termsConditions) {
                    doc.moveTo(40 + pageW / 2, curY).lineTo(40 + pageW / 2, curY + notesH).stroke('#000000');
                    doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold').text('Customer Notes:', 46, curY + 4);
                    doc.font('Helvetica').fontSize(7).text(order.customerNotes, 46, curY + 14, { width: pageW / 2 - 12, lineGap: 1 });
                    doc.font('Helvetica-Bold').fontSize(8).text('Terms & Conditions:', rightX, curY + 4, { width: pageW / 2 - 12 });
                    doc.font('Helvetica').fontSize(7).text(order.termsConditions, rightX, curY + 14, { width: pageW / 2 - 12, lineGap: 1 });
                } else {
                    const note = order.customerNotes || order.termsConditions;
                    const label = order.customerNotes ? 'Customer Notes:' : 'Terms & Conditions:';
                    doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold').text(label, 46, curY + 4);
                    doc.font('Helvetica').fontSize(7).text(note, 46, curY + 14, { width: pageW - 12, lineGap: 1 });
                }
                curY += notesH;
            }

            // ─── SIGNATURE BLOCK ────────────────────────────────────────────
            const sigH = 60;
            doc.rect(40, curY, pageW, sigH).stroke('#000000');
            doc.moveTo(40 + pageW / 2, curY).lineTo(40 + pageW / 2, curY + sigH).stroke('#000000');

            doc.fillColor('#555555').fontSize(8).font('Helvetica')
               .text("Receiver's Signature & Stamp", 46, curY + 6);
            doc.moveTo(46, curY + sigH - 12).lineTo(46 + pageW / 2 - 30, curY + sigH - 12).stroke('#000000');

            doc.fillColor('#555555').fontSize(8).font('Helvetica')
               .text('For Authorized Signatory', rightX, curY + 6, { width: pageW / 2 - 12, align: 'right' });
            const sigLineStart = rightX + pageW / 2 - 12 - 100;
            doc.moveTo(sigLineStart, curY + sigH - 12).lineTo(rightX + pageW / 2 - 12, curY + sigH - 12).stroke('#000000');
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8)
               .text(order.salesperson || 'Authorized Signatory', rightX, curY + sigH - 10, { width: pageW / 2 - 12, align: 'right' });

            doc.end();
        });
    }

    static async generateReceipt(payment, company = {}) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            const companyName = company.name || 'Your Company';
            const companyState = company.state || '';
            const companyEmail = company.email || '';

            // Derived receipt data
            const amount = payment.Transactions.reduce((s, t) => s + parseFloat(t.credit || 0), 0);
            const customer = payment.Transactions.find(t => {
                const groupName = (t.Ledger?.Group?.name || t.Ledger?.group?.name || '').toLowerCase();
                return groupName.includes('debtors') || 
                       groupName.includes('customer') || 
                       (parseFloat(t.credit || 0) > 0 && !groupName.includes('bank') && !groupName.includes('cash'));
            })?.Ledger;
            const bank = payment.Transactions.find(t => {
                const groupName = (t.Ledger?.Group?.name || t.Ledger?.group?.name || '').toLowerCase();
                return groupName.includes('bank') || 
                       groupName.includes('cash') || 
                       (parseFloat(t.debit || 0) > 0 && !groupName.includes('debtors') && !groupName.includes('customer'));
            })?.Ledger;

            const customerName = customer?.name || 'Customer';
            const bankName = bank?.name || 'Bank Transfer';

            // --- HEADER ---
            doc.fillColor('#1e1b4b') // deep indigo
               .fontSize(16)
               .font('Helvetica-Bold')
               .text(companyName.toUpperCase(), 50, 50);
            
            doc.fontSize(9)
               .font('Helvetica')
               .fillColor('#64748b');

            let headerY = 70;
            if (companyState) { doc.text(companyState, 50, headerY); headerY += 13; }
            if (companyEmail) { doc.text(companyEmail, 50, headerY); }

            doc.fontSize(28)
               .font('Helvetica-Bold')
               .fillColor('#4338ca') // indigo 700
               .text('RECEIPT', 250, 50, { align: 'right' });

            doc.fontSize(10)
               .fillColor('#64748b')
               .text(`Receipt Number: ${payment.voucherNumber}`, 250, 85, { align: 'right' });

            // --- DECORATIVE LINE ---
            doc.moveTo(50, 115).lineTo(550, 115).strokeColor('#e2e8f0').lineWidth(1).stroke();

            // --- HERO BANNER ---
            const bannerY = 130;
            doc.rect(50, bannerY, 500, 70).fill('#4f46e5'); // indigo 600

            doc.fillColor('#e0e7ff')
               .fontSize(9)
               .font('Helvetica-Bold')
               .text('TOTAL AMOUNT RECEIVED', 70, bannerY + 18);

            doc.fillColor('#ffffff')
               .fontSize(22)
               .font('Helvetica-Bold')
               .text(`Rs. ${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 70, bannerY + 34);

            doc.fillColor('#e0e7ff')
               .fontSize(9)
               .font('Helvetica-Bold')
               .text('PAYMENT DATE', 380, bannerY + 18, { align: 'right', width: 150 });

            doc.fillColor('#ffffff')
               .fontSize(14)
               .font('Helvetica-Bold')
               .text(new Date(payment.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }), 380, bannerY + 34, { align: 'right', width: 150 });

            // --- TRANSACTION DETAILS GRID ---
            const gridY = 225;
            doc.rect(50, gridY, 240, 70).strokeColor('#e2e8f0').lineWidth(1).stroke();
            doc.fillColor('#4f46e5').fontSize(8).font('Helvetica-Bold').text('RECEIVED FROM', 65, gridY + 15);
            doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(customerName, 65, gridY + 28, { width: 210, ellipsis: true });
            doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Premium Partner Account', 65, gridY + 45);

            doc.rect(310, gridY, 240, 70).strokeColor('#e2e8f0').lineWidth(1).stroke();
            doc.fillColor('#4f46e5').fontSize(8).font('Helvetica-Bold').text('SETTLEMENT ACCOUNT', 325, gridY + 15);
            doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(bankName, 325, gridY + 28, { width: 210, ellipsis: true });
            doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Verified Payment', 325, gridY + 45);

            // --- REMARKS ---
            const remarksY = 320;
            doc.fillColor('#64748b').fontSize(9).font('Helvetica-Bold').text('SETTLEMENT REMARKS', 50, remarksY);
            doc.rect(50, remarksY + 15, 500, 60).fill('#f8fafc');
            doc.fillColor('#334155')
               .fontSize(10)
               .font('Helvetica-Oblique')
               .text(`"${payment.narration || 'Payment received from customer via Bank Transfer.'}"`, 65, remarksY + 30, { width: 470 });

            // --- COMPLIANCE / FOOTER ---
            const footerY = 410;
            doc.moveTo(50, footerY).lineTo(550, footerY).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

            doc.fillColor('#10b981').fontSize(8).font('Helvetica-Bold').text('DIGITAL AUDIT LOGGED', 50, footerY + 20);
            doc.fillColor('#64748b').fontSize(8).font('Helvetica')
               .text(`This is an electronically generated receipt issued under the authority of ${companyName}.`, 50, footerY + 32, { width: 250 });

            // Stamp Circle
            const stampX = 350;
            const stampY = footerY + 25;
            doc.circle(stampX + 25, stampY + 25, 25).strokeColor('#c7d2fe').lineWidth(1.5).stroke();
            doc.fillColor('#4f46e5').fontSize(5).font('Helvetica-Bold')
               .text('SECURED', stampX + 11, stampY + 15, { align: 'center', width: 28 })
               .text('VERIFIED', stampX + 11, stampY + 24, { align: 'center', width: 28 })
               .text('CALTALLY', stampX + 11, stampY + 33, { align: 'center', width: 28 });

            // Signature
            const sigX = 420;
            doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold').text('Authorized Signature', sigX, footerY + 20, { align: 'center', width: 130 });
            doc.moveTo(sigX, footerY + 60).lineTo(sigX + 130, footerY + 60).strokeColor('#94a3b8').lineWidth(0.5).stroke();
            
            // Signature text placeholder
            const signatureText = (() => {
                const clean = companyName.toUpperCase().startsWith('THE ') ? companyName.slice(4) : companyName;
                const word = clean.split(' ')[0] || 'Manager';
                return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
            })();
            doc.fillColor('#4f46e5').fontSize(14).font('Helvetica-Oblique').text(signatureText, sigX, footerY + 42, { align: 'center', width: 130 });

            // --- BARCODE ---
            const barcodeY = 520;
            doc.fillColor('#0f172a');
            let barX = 220;
            const barWidths = [2, 1, 4, 1, 2, 3, 1, 4, 2, 1, 3, 2];
            barWidths.forEach(w => {
                doc.rect(barX, barcodeY, w, 20).fill();
                barX += w + 1;
            });
            doc.fillColor('#64748b').fontSize(8).font('Courier-Bold').text(payment.voucherNumber, 220, barcodeY + 24, { tracking: 2 });

            doc.end();
        });
    }
}

module.exports = PDFService;

