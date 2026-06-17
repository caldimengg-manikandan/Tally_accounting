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
            doc.font('Helvetica-Bold').fontSize(12).text('Total', 350, totalStart + 50).text(`₹${parseFloat(invoice.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 470, totalStart + 50, { width: 80, align: 'right' });

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
            doc.font('Helvetica-Bold').fontSize(12).text('Total', 350, totalStart + 25).text(`₹${parseFloat(challan.totalAmount || 0).toLocaleString('en-IN')}`, 470, totalStart + 25, { width: 80, align: 'right' });

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
               .text(`₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 480, totY, { width: 75, align: 'right' });

            // ─── AUTHORIZED SIGNATURE ─────────────────────────────────────
            const sigY = 700;
            doc.fillColor('#000000').fontSize(9).font('Helvetica')
               .text('Authorized Signature ____________________', 40, sigY);

            doc.end();
        });
    }
}

module.exports = PDFService;
