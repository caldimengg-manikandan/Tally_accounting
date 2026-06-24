const PDFDocument = require('pdfkit');

const CURRENCY_SYMBOLS = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'AUD': 'A$',
    'CAD': 'C$',
    'CHF': 'Fr',
    'CNY': '¥',
    'AED': 'د.إ',
    'SAR': '﷼',
    'SGD': 'S$',
    'KWD': 'د.ك',
    'OMR': 'ر.ع.',
    'BHD': '.د.ب',
    'QAR': 'ر.ق'
};

function getCurrencySymbol(currency) {
    if (!currency) return '₹';
    const code = currency.split(/[ -]/)[0].trim().toUpperCase();
    return CURRENCY_SYMBOLS[code] || code;
}

function formatAmount(amount, currencyCode) {
    const code = currencyCode ? currencyCode.split(/[ -]/)[0].trim().toUpperCase() : 'INR';
    const locale = (code === 'INR') ? 'en-IN' : 'en-US';
    return parseFloat(amount || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

class PDFService {
    static async generateRetainerInvoice(retainer, items, company = {}) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            const currency = retainer.CustomerLedger?.currency || company.baseCurrency || 'INR';
            const currencySymbol = getCurrencySymbol(currency);
            const format = (val) => formatAmount(val, currency);

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
               .text(`${currencySymbol} ${format(retainer.totalAmount)}`, 400, 145, { align: 'right' });

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
                   .text(format(item.amount), 450, currentCursor + 10, { width: 90, align: 'right' });
                
                currentCursor += 30;
                doc.moveTo(50, currentCursor).lineTo(550, currentCursor).strokeColor('#eeeeee').stroke();
            });

            // --- TOTALS ---
            const totalStart = currentCursor + 20;
            doc.fillColor('#555555')
               .fontSize(10)
               .text('Sub Total', 350, totalStart)
               .fillColor('#000000')
               .text(format(retainer.totalAmount), 450, totalStart, { width: 90, align: 'right' });

            doc.font('Helvetica-Bold')
               .fontSize(12)
               .text('Total', 350, totalStart + 25)
               .text(`${currencySymbol} ${format(retainer.totalAmount)}`, 450, totalStart + 25, { width: 90, align: 'right' });

            doc.rect(350, totalStart + 50, 200, 30).fill('#f9f9f9');
            doc.fillColor('#000000')
               .text('Balance Due', 360, totalStart + 60)
               .text(`${currencySymbol} ${format(retainer.totalAmount)}`, 450, totalStart + 60, { width: 90, align: 'right' });

            // --- WORDS ---
            doc.fillColor('#888888')
               .fontSize(9)
               .font('Helvetica-Oblique')
               .text('Total In Words:', 350, totalStart + 100);
            
            doc.fillColor('#333333')
               .fontSize(10)
               .font('Helvetica-BoldOblique')
               .text(`${currency === 'INR' ? 'Indian Rupee Only' : currency + ' Only'}`, 420, totalStart + 100);

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

            const currency = quote.Customer?.currency || company.baseCurrency || 'INR';
            const currencySymbol = getCurrencySymbol(currency);
            const format = (val) => formatAmount(val, currency);

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
                   .text(format(item.rate), 400, currentCursor + 10, { width: 70, align: 'right' })
                   .text(format(item.amount), 470, currentCursor + 10, { width: 80, align: 'right' });
                
                currentCursor += 30;
                doc.moveTo(50, currentCursor).lineTo(550, currentCursor).strokeColor('#eeeeee').stroke();
            });

            // --- TOTALS ---
            const totalStart = currentCursor + 20;
            doc.fillColor('#555555')
               .fontSize(10)
               .text('Sub Total', 350, totalStart)
               .fillColor('#000000')
               .text(format(quote.subTotal), 470, totalStart, { width: 80, align: 'right' });

            if (quote.taxAmount > 0) {
                doc.fillColor('#555555')
                   .text(`Tax (${quote.selectedTax || 'GST'})`, 350, totalStart + 20)
                   .fillColor('#000000')
                   .text(format(quote.taxAmount), 470, totalStart + 20, { width: 80, align: 'right' });
            }

            doc.font('Helvetica-Bold')
               .fontSize(12)
               .text('Total', 350, totalStart + 50)
               .text(`${currencySymbol} ${format(quote.totalAmount)}`, 470, totalStart + 50, { width: 80, align: 'right' });

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

            const currency = invoice.CustomerLedger?.currency || company?.baseCurrency || 'INR';
            const currencySymbol = getCurrencySymbol(currency);
            const format = (val) => formatAmount(val, currency);

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
                doc.text(index + 1, 60, currentCursor + 10).text(`${itemName}\n${item.description || ''}`, 100, currentCursor + 10, { width: 240 }).text(item.quantity, 350, currentCursor + 10, { width: 50, align: 'center' }).text(format(item.rate), 400, currentCursor + 10, { width: 70, align: 'right' }).text(format(item.amount || (item.quantity * item.rate)), 470, currentCursor + 10, { width: 80, align: 'right' });
                currentCursor += 40;
                doc.moveTo(50, currentCursor).lineTo(550, currentCursor).strokeColor('#eeeeee').stroke();
            });

            // --- TOTALS ---
            const totalStart = Math.max(currentCursor + 20, 500);
            doc.fillColor('#555555').fontSize(10).text('Sub Total', 350, totalStart).fillColor('#000000').text(format(invoice.subTotal || 0), 470, totalStart, { width: 80, align: 'right' });
            doc.text(`GST (18%)`, 350, totalStart + 20).text(format(invoice.gstAmount || 0), 470, totalStart + 20, { width: 80, align: 'right' });
            doc.font('Helvetica-Bold').fontSize(12).text('Total', 350, totalStart + 50).text(`${currencySymbol} ${format(invoice.totalAmount || 0)}`, 470, totalStart + 50, { width: 80, align: 'right' });

            doc.end();
        });
    }

    static async generateDeliveryChallan(challan, items, company) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            let buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            const currency = challan.Customer?.currency || company?.baseCurrency || 'INR';
            const currencySymbol = getCurrencySymbol(currency);
            const format = (val) => formatAmount(val, currency);

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
                doc.text(index + 1, 60, currentCursor + 10).text(`${itemName}\n${item.description || ''}`, 100, currentCursor + 10, { width: 240 }).text(item.quantity, 350, currentCursor + 10, { width: 50, align: 'center' }).text(format(item.rate), 400, currentCursor + 10, { width: 70, align: 'right' }).text(format(item.amount), 470, currentCursor + 10, { width: 80, align: 'right' });
                currentCursor += 40;
                doc.moveTo(50, currentCursor).lineTo(550, currentCursor).strokeColor('#eeeeee').stroke();
            });

            // --- TOTALS ---
            const totalStart = Math.max(currentCursor + 20, 500);
            doc.fillColor('#555555').fontSize(10).text('Sub Total', 350, totalStart).fillColor('#000000').text(format(challan.subTotal || 0), 470, totalStart, { width: 80, align: 'right' });
            doc.font('Helvetica-Bold').fontSize(12).text('Total', 350, totalStart + 25).text(`${currencySymbol} ${format(challan.totalAmount || 0)}`, 470, totalStart + 25, { width: 80, align: 'right' });

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

            const currency = vendor?.currency || company?.baseCurrency || 'INR';
            const currencySymbol = getCurrencySymbol(currency);
            const format = (val) => formatAmount(val, currency);

            const companyName = company?.name || 'Our Company';
            const vendorName = vendor?.name || order.vendorName || 'Vendor';

            // ── Date formatter (no timezone shift) ──────────────────
            const formatDate = (dateVal) => {
                if (!dateVal) return '—';
                try {
                    const match = String(dateVal).match(/^(\d{4})-(\d{2})-(\d{2})/);
                    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
                    const d = new Date(dateVal);
                    if (isNaN(d.getTime())) return '—';
                    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
                } catch (e) { return '—'; }
            };

            const pageW = 515; // usable width (595 - 2×40)
            const startY = 40;
            const rightX = 40 + pageW / 2 + 6;

            // ─── HEADER BOX: Company (left) | PURCHASE ORDER (right) ────────
            const headerH = 72;
            doc.rect(40, startY, pageW, headerH).stroke('#000000');
            doc.moveTo(40 + pageW / 2, startY).lineTo(40 + pageW / 2, startY + headerH).stroke('#000000');

            // Left: Company details
            doc.fillColor('#000000').fontSize(13).font('Helvetica-Bold')
               .text(companyName, 46, startY + 8, { width: pageW / 2 - 12 });
            doc.fontSize(8).font('Helvetica').fillColor('#444444');
            let compY = startY + 26;
            if (company?.street1)  { doc.text(company.street1, 46, compY, { width: pageW / 2 - 12 }); compY += 11; }
            if (company?.city)     { doc.text([company.city, company.state].filter(Boolean).join(', '), 46, compY, { width: pageW / 2 - 12 }); compY += 11; }
            if (company?.email)    { doc.text(company.email, 46, compY, { width: pageW / 2 - 12 }); compY += 11; }
            if (company?.gstNumber){ doc.text(`GSTIN: ${company.gstNumber}`, 46, compY, { width: pageW / 2 - 12 }); }

            // Right: PURCHASE ORDER title + meta
            doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold')
               .text('PURCHASE ORDER', rightX, startY + 8, { width: pageW / 2 - 12, align: 'center' });
            doc.fontSize(9).font('Helvetica').fillColor('#333333')
               .text(`Order No: ${order.orderNumber || order.poNumber || '—'}`, rightX, startY + 28, { width: pageW / 2 - 12 })
               .text(`Date: ${formatDate(order.date)}`, rightX, startY + 40, { width: pageW / 2 - 12 });
            if (order.deliveryDate) {
                doc.text(`Delivery Date: ${formatDate(order.deliveryDate)}`, rightX, startY + 52, { width: pageW / 2 - 12 });
            }
            if (order.paymentTerms) {
                doc.text(`Payment Terms: ${order.paymentTerms}`, rightX, startY + 64, { width: pageW / 2 - 12 });
            }

            // ─── VENDOR / DELIVER-TO BOX ───────────────────────────────────
            const addrY = startY + headerH;
            const addrH = 72;
            doc.rect(40, addrY, pageW, addrH).stroke('#000000');
            doc.moveTo(40 + pageW / 2, addrY).lineTo(40 + pageW / 2, addrY + addrH).stroke('#000000');

            // Left: Vendor Address
            doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
               .text('Vendor Address:', 46, addrY + 6);
            doc.fontSize(10).font('Helvetica-Bold')
               .text(vendorName, 46, addrY + 18, { width: pageW / 2 - 12 });

            const vendorLines = [];
            const rawVendorAddr = vendor?.billingAddressJson || vendor?.billingAddress || vendor?.address;
            if (rawVendorAddr) {
                try {
                    const p = typeof rawVendorAddr === 'string' && rawVendorAddr.startsWith('{') ? JSON.parse(rawVendorAddr) : rawVendorAddr;
                    if (p && typeof p === 'object') {
                        const street = [p.street1 || p.address1, p.street2 || p.address2].filter(Boolean).join(', ');
                        if (street) vendorLines.push(street);
                        const city = [p.city, p.state, p.pinCode || p.zip].filter(Boolean).join(', ');
                        if (city) vendorLines.push(city);
                        if (p.country) vendorLines.push(p.country);
                    } else if (typeof rawVendorAddr === 'string') {
                        vendorLines.push(rawVendorAddr);
                    }
                } catch (e) { if (typeof rawVendorAddr === 'string') vendorLines.push(rawVendorAddr); }
            }
            if (vendor?.country && !vendorLines.some(l => l.includes(vendor.country))) vendorLines.push(vendor.country || 'India');

            doc.fontSize(8).font('Helvetica').fillColor('#333333');
            let vY = addrY + 31;
            vendorLines.slice(0, 3).forEach(line => { doc.text(line, 46, vY, { width: pageW / 2 - 12 }); vY += 11; });

            // Right: Deliver To
            doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
               .text('Deliver To:', rightX, addrY + 6, { width: pageW / 2 - 12 });

            const deliveryLines = [];
            let parsedDelivery = null;
            try { if (order.deliveryAddressDataJson) parsedDelivery = JSON.parse(order.deliveryAddressDataJson); } catch (e) {}
            const isEmptyDelivery = !parsedDelivery || (!parsedDelivery.street1 && !parsedDelivery.city && !parsedDelivery.attention);
            if ((order.deliveryAddress === 'Organization' || !order.deliveryAddress) && isEmptyDelivery && company) {
                parsedDelivery = {
                    attention: company.name || '', street1: company.street1 || '',
                    city: company.city || '', state: company.state || '',
                    zip: company.pincode || '', country: company.location || 'India'
                };
            }
            if (parsedDelivery) {
                if (parsedDelivery.attention) deliveryLines.push(parsedDelivery.attention);
                const st = [parsedDelivery.street1, parsedDelivery.street2].filter(Boolean).join(', ');
                if (st) deliveryLines.push(st);
                const cv = [parsedDelivery.city, parsedDelivery.state, parsedDelivery.zip || parsedDelivery.zipCode].filter(Boolean).join(', ');
                if (cv) deliveryLines.push(cv);
                if (parsedDelivery.country) deliveryLines.push(parsedDelivery.country);
            } else if (order.deliveryAddressText) {
                deliveryLines.push(order.deliveryAddressText);
            }

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000')
               .text(deliveryLines[0] || companyName, rightX, addrY + 18, { width: pageW / 2 - 12 });
            doc.fontSize(8).font('Helvetica').fillColor('#333333');
            let dY = addrY + 31;
            deliveryLines.slice(1, 4).forEach(line => { doc.text(line, rightX, dY, { width: pageW / 2 - 12 }); dY += 11; });

            // ─── ITEMS TABLE ────────────────────────────────────────────────
            const tableY = addrY + addrH;

            // Column layout (same visual structure as Sales Order)
            const cols = { no: 28, desc: 165, account: 90, qty: 48, rate: 72, amount: 82 };
            const colX = {
                no:      40,
                desc:    40 + cols.no,
                account: 40 + cols.no + cols.desc,
                qty:     40 + cols.no + cols.desc + cols.account,
                rate:    40 + cols.no + cols.desc + cols.account + cols.qty,
                amount:  40 + cols.no + cols.desc + cols.account + cols.qty + cols.rate,
            };
            const rowH = 22;

            // Header row
            doc.rect(40, tableY, pageW, rowH).fillAndStroke('#eeeeee', '#000000');
            const colKeys    = ['no', 'desc', 'account', 'qty', 'rate', 'amount'];
            const headers    = ['#', 'Item & Description', 'Account', 'Qty', 'Rate', 'Amount'];
            const colAligns  = ['center', 'left', 'left', 'center', 'right', 'right'];

            doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold');
            colKeys.forEach((key, i) => {
                doc.text(headers[i], colX[key] + 2, tableY + 6, { width: cols[key] - 4, align: colAligns[i] });
                doc.moveTo(colX[key], tableY).lineTo(colX[key], tableY + rowH).stroke('#000000');
            });
            doc.moveTo(40 + pageW, tableY).lineTo(40 + pageW, tableY + rowH).stroke('#000000');
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
                doc.rect(40, curY, pageW, rowH).stroke('#cccccc');

                if (it) {
                    const qty    = parseFloat(it.quantity || it.qty || 0);
                    const rate   = parseFloat(it.rate || it.unitPrice || 0);
                    const amount = parseFloat(it.amount || qty * rate || 0);
                    const itemName = it.itemDetails || it.itemName || it.name || it.description || '—';
                    const acct     = it.account || '';

                    doc.fillColor('#000000').fontSize(8).font('Helvetica');
                    doc.text(String(i + 1),                            colX.no      + 2, curY + 6, { width: cols.no - 4,      align: 'center' });
                    doc.text(itemName,                                  colX.desc    + 2, curY + 6, { width: cols.desc - 4,    align: 'left' });
                    doc.text(acct,                                      colX.account + 2, curY + 6, { width: cols.account - 4, align: 'left' });
                    doc.text(qty.toString(),                            colX.qty     + 2, curY + 6, { width: cols.qty - 4,     align: 'center' });
                    doc.text(format(rate), colX.rate + 2, curY + 6, { width: cols.rate - 4, align: 'right' });
                    doc.font('Helvetica-Bold')
                       .text(format(amount), colX.amount + 2, curY + 6, { width: cols.amount - 4, align: 'right' });
                }

                colKeys.forEach(key => {
                    doc.moveTo(colX[key], curY).lineTo(colX[key], curY + rowH).stroke('#000000');
                });
                doc.moveTo(40 + pageW, curY).lineTo(40 + pageW, curY + rowH).stroke('#000000');
                curY += rowH;
            }

            // ─── TOTALS ──────────────────────────────────────────────────────
            const subtotal     = parseFloat(order.subtotal || order.subTotal || 0);
            const discountAmt  = parseFloat(order.discountAmount || 0);
            const taxAmt       = parseFloat(order.taxAmount || 0);
            const tdsAmt       = parseFloat(order.tdsAmount || 0);
            const adjustment   = parseFloat(order.adjustment || 0);
            const grandTotal   = parseFloat(order.totalAmount || 0);
            const totalQty     = parsedItems.reduce((s, it) => s + parseFloat(it?.quantity || it?.qty || 0), 0);

            // Total qty/subtotal row
            doc.rect(40, curY, pageW, rowH).fillAndStroke('#f5f5f5', '#000000');
            doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold')
               .text('Total', colX.no + 2, curY + 6, { width: cols.no + cols.desc + cols.account - 4, align: 'right' })
               .text(totalQty.toString(), colX.qty + 2, curY + 6, { width: cols.qty - 4, align: 'center' })
               .text(format(subtotal), colX.amount + 2, curY + 6, { width: cols.amount - 4, align: 'right' });
            colKeys.forEach(key => {
                doc.moveTo(colX[key], curY).lineTo(colX[key], curY + rowH).stroke('#000000');
            });
            doc.moveTo(40 + pageW, curY).lineTo(40 + pageW, curY + rowH).stroke('#000000');
            curY += rowH;

            // Optional detail rows (discount, tax, TDS, adjustment)
            const addDetailRow = (label, valueStr) => {
                doc.rect(40, curY, pageW, rowH).stroke('#000000');
                doc.fillColor('#444444').fontSize(8).font('Helvetica')
                   .text(label, colX.no + 2, curY + 6, { width: pageW - cols.amount - 4, align: 'right' });
                doc.fillColor('#000000').font('Helvetica-Bold')
                   .text(valueStr, colX.amount + 2, curY + 6, { width: cols.amount - 4, align: 'right' });
                doc.moveTo(colX.amount, curY).lineTo(colX.amount, curY + rowH).stroke('#000000');
                doc.moveTo(40 + pageW, curY).lineTo(40 + pageW, curY + rowH).stroke('#000000');
                curY += rowH;
            };

            if (discountAmt > 0) addDetailRow('Discount', `-${format(discountAmt)}`);
            if (taxAmt > 0)      addDetailRow(`Tax (${order.taxRate || ''}%)`, format(taxAmt));
            if (tdsAmt > 0)      addDetailRow(`TDS (${order.tdsName || ''})`, `-${format(tdsAmt)}`);
            if (adjustment !== 0) addDetailRow('Adjustment', format(adjustment));

            // Grand Total row
            const gtRowH = 26;
            doc.rect(40, curY, pageW, gtRowH).fillAndStroke('#e0e0e0', '#000000');
            doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold')
               .text('Grand Total', colX.no + 2, curY + 7, { width: pageW - cols.amount - 4, align: 'right' })
               .text(`${currencySymbol} ${format(grandTotal)}`, colX.amount + 2, curY + 7, { width: cols.amount - 4, align: 'right' });
            doc.moveTo(colX.amount, curY).lineTo(colX.amount, curY + gtRowH).stroke('#000000');
            doc.moveTo(40 + pageW, curY).lineTo(40 + pageW, curY + gtRowH).stroke('#000000');
            curY += gtRowH;

            // â”€â”€â”€ NOTES / TERMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            if (order.notes || order.terms) {
                const notesH = 50;
                doc.rect(40, curY, pageW, notesH).stroke('#000000');
                if (order.notes && order.terms) {
                    doc.moveTo(40 + pageW / 2, curY).lineTo(40 + pageW / 2, curY + notesH).stroke('#000000');
                    doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold').text('Notes:', 46, curY + 4);
                    doc.font('Helvetica').fontSize(7).text(order.notes, 46, curY + 14, { width: pageW / 2 - 12, lineGap: 1 });
                    doc.font('Helvetica-Bold').fontSize(8).text('Terms & Conditions:', rightX, curY + 4, { width: pageW / 2 - 12 });
                    doc.font('Helvetica').fontSize(7).text(order.terms, rightX, curY + 14, { width: pageW / 2 - 12, lineGap: 1 });
                } else {
                    const note = order.notes || order.terms;
                    const label = order.notes ? 'Notes:' : 'Terms & Conditions:';
                    doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold').text(label, 46, curY + 4);
                    doc.font('Helvetica').fontSize(7).text(note, 46, curY + 14, { width: pageW - 12, lineGap: 1 });
                }
                curY += notesH;
            }

            // â”€â”€â”€ SIGNATURE BLOCK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            const sigH = 60;
            doc.rect(40, curY, pageW, sigH).stroke('#000000');
            doc.moveTo(40 + pageW / 2, curY).lineTo(40 + pageW / 2, curY + sigH).stroke('#000000');

            doc.fillColor('#555555').fontSize(8).font('Helvetica')
               .text("Vendor's Signature & Stamp", 46, curY + 6);
            doc.moveTo(46, curY + sigH - 12).lineTo(46 + pageW / 2 - 30, curY + sigH - 12).stroke('#000000');

            doc.fillColor('#555555').fontSize(8).font('Helvetica')
               .text('For Authorized Signatory', rightX, curY + 6, { width: pageW / 2 - 12, align: 'right' });
            const sigLineStart = rightX + pageW / 2 - 12 - 100;
            doc.moveTo(sigLineStart, curY + sigH - 12).lineTo(rightX + pageW / 2 - 12, curY + sigH - 12).stroke('#000000');
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(8)
               .text(companyName, rightX, curY + sigH - 10, { width: pageW / 2 - 12, align: 'right' });

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
                doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(value || 'â€”', x, y + 10);
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
            doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(presentAddr || 'â€”', 45, y + 10, { width: 240, lineGap: 2 });

            doc.fillColor('#64748b').fontSize(8).font('Helvetica').text('Permanent Address', 300, y);
            doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text(permanentAddr || 'â€”', 300, y + 10, { width: 240, lineGap: 2 });
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
            printField('Year of Passing', employee.yearOfPassing ? employee.yearOfPassing.toString() : 'â€”', 380);
            y += 28;

            printField('Previous Company', employee.previousCompany, 45);
            printField('Years of Experience', employee.previousExperience ? employee.previousExperience.toString() : 'â€”', 210);
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

            const currency = order.Customer?.currency || company?.baseCurrency || 'INR';
            const currencySymbol = getCurrencySymbol(currency);
            const format = (val) => formatAmount(val, currency);

            const companyName = company.name || order.companyName || 'Your Company';
            const customerName = order.customerName || order.Customer?.displayName || order.Customer?.name || 'Customer';

            const formatDate = (d) => {
                if (!d) return 'â€”';
                try {
                    const m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
                    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
                    return new Date(d).toLocaleDateString('en-IN');
                } catch (e) { return 'â€”'; }
            };

            // â”€â”€â”€ HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            doc.fillColor('#000000').fontSize(14).font('Helvetica-Bold')
               .text(companyName, 40, 40);

            let companyInfoY = 58;
            doc.fontSize(9).font('Helvetica').fillColor('#444444');
            if (company.state)  { doc.text(company.state,  40, companyInfoY); companyInfoY += 12; }
            if (company.location) { doc.text(company.location, 40, companyInfoY); companyInfoY += 12; }
            if (company.email)  { doc.text(company.email,  40, companyInfoY); companyInfoY += 12; }

            // Right side: TITLE
            doc.fontSize(22).font('Helvetica-Bold').fillColor('#000000')
               .text('SALES ORDER', 250, 40, { width: 305, align: 'right' });

            doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333')
               .text(`# ${order.orderNumber || 'PENDING'}`, 250, 68, { width: 305, align: 'right' });

            // â”€â”€â”€ BILL TO / SHIP TO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            const addressY = 130;

            // Bill To
            doc.fillColor('#555555').fontSize(9).font('Helvetica-Bold')
               .text('Bill To', 40, addressY);
            doc.fillColor('#000000').fontSize(10).font('Helvetica-Bold')
               .text(customerName, 40, addressY + 13);

            // Build customer address
            const customerLines = [];
            try {
                const raw = order.Customer?.billingAddress || order.billingAddress;
                if (raw) {
                    const p = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    const street = [p.street1, p.street2].filter(Boolean).join(', ');
                    if (street) customerLines.push(street);
                    const cityState = [p.city, p.state, p.pinCode].filter(Boolean).join(', ');
                    if (cityState) customerLines.push(cityState);
                    if (p.country) customerLines.push(p.country);
                }
            } catch (e) {}

            doc.font('Helvetica').fontSize(9).fillColor('#444444');
            doc.x = 40; doc.y = addressY + 28;
            customerLines.forEach(line => { doc.text(line, { width: 170 }); });

            // Date / Order Info (right side)
            let dateY = addressY + 13;
            doc.fillColor('#555555').fontSize(9).font('Helvetica');
            doc.text('Date :', 380, dateY);
            doc.fillColor('#000000').text(formatDate(order.date), 455, dateY, { width: 100, align: 'right' });
            dateY += 15;

            if (order.expectedShipmentDate) {
                doc.fillColor('#555555').text('Shipment Date :', 380, dateY);
                doc.fillColor('#000000').text(formatDate(order.expectedShipmentDate), 455, dateY, { width: 100, align: 'right' });
                dateY += 15;
            }
            if (order.paymentTerms) {
                doc.fillColor('#555555').text('Payment Terms :', 380, dateY);
                doc.fillColor('#000000').text(order.paymentTerms, 455, dateY, { width: 100, align: 'right' });
                dateY += 15;
            }
            if (order.referenceNumber) {
                doc.fillColor('#555555').text('Reference :', 380, dateY);
                doc.fillColor('#000000').text(order.referenceNumber, 455, dateY, { width: 100, align: 'right' });
                dateY += 15;
            }

            // â”€â”€â”€ HORIZONTAL DIVIDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            const dividerY = Math.max(doc.y + 10, dateY + 10, 230);
            doc.moveTo(40, dividerY).lineTo(555, dividerY).strokeColor('#dddddd').lineWidth(0.5).stroke();

            // â”€â”€â”€ TABLE HEADER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            const tableTop = dividerY + 15;
            doc.rect(40, tableTop, 515, 20).fill('#3c3c3c');
            doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold')
               .text('#', 50, tableTop + 6)
               .text('Item & Description', 80, tableTop + 6)
               .text('Qty', 330, tableTop + 6, { width: 50, align: 'right' })
               .text('Rate', 390, tableTop + 6, { width: 70, align: 'right' })
               .text('Amount', 468, tableTop + 6, { width: 80, align: 'right' });

            // â”€â”€â”€ TABLE ROWS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            let parsedItems = items;
            if (!Array.isArray(items)) {
                try { parsedItems = JSON.parse(items || '[]'); } catch (e) { parsedItems = []; }
            }

            let currentY = tableTop + 20;
            doc.fillColor('#000000').font('Helvetica');

            parsedItems.forEach((item, idx) => {
                const itemName = item.detail || item.itemName || item.name || item.description || 'Item';
                const qty      = parseFloat(item.quantity || item.qty || 0);
                const rate     = parseFloat(item.rate || 0);
                const amount   = parseFloat(item.amount || qty * rate || 0);

                const textHeight = Math.max(20, Math.ceil(itemName.length / 45) * 12 + 8);

                doc.fillColor('#000000').fontSize(9)
                   .text(idx + 1, 50, currentY + 6)
                   .text(itemName, 80, currentY + 6, { width: 240 })
                   .text(qty.toString(), 330, currentY + 6, { width: 50, align: 'right' })
                   .text(format(rate), 390, currentY + 6, { width: 70, align: 'right' })
                   .text(format(amount), 468, currentY + 6, { width: 80, align: 'right' });

                currentY += textHeight;
                doc.moveTo(40, currentY).lineTo(555, currentY).strokeColor('#eeeeee').lineWidth(0.5).stroke();
            });

            if (parsedItems.length === 0) {
                doc.fillColor('#888888').fontSize(9).font('Helvetica-Oblique')
                   .text('No items found.', 80, currentY + 8);
                currentY += 24;
            }

            // â”€â”€â”€ TOTALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            const totalStart  = currentY + 15;
            const subTotal    = parseFloat(order.subTotal || 0);
            const discountAmt = parseFloat(order.discountAmount || order.discount || 0);
            const taxAmt      = parseFloat(order.taxAmount || order.tax || 0);
            const taxPct      = order.taxPercent || order.taxRate || 0;
            const grandTotal  = parseFloat(order.totalAmount || 0);

            let totY = totalStart;

            // Sub Total
            doc.fillColor('#555555').fontSize(9).font('Helvetica')
               .text('Sub Total', 380, totY)
               .fillColor('#000000')
               .text(format(subTotal), 468, totY, { width: 80, align: 'right' });
            totY += 15;

            if (discountAmt > 0) {
                doc.fillColor('#555555').text('Discount', 380, totY)
                   .fillColor('#000000').text(`-${format(discountAmt)}`, 468, totY, { width: 80, align: 'right' });
                totY += 15;
            }

            if (taxAmt > 0) {
                const taxLabel = taxPct > 0 ? `Tax (${taxPct}%)` : 'Tax';
                doc.fillColor('#555555').text(taxLabel, 380, totY)
                   .fillColor('#000000').text(format(taxAmt), 468, totY, { width: 80, align: 'right' });
                totY += 15;
            }

            // Divider line before grand total
            doc.moveTo(380, totY).lineTo(555, totY).strokeColor('#dddddd').lineWidth(0.5).stroke();
            totY += 5;

            // Grand Total
            doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold')
               .text('Total', 380, totY)
               .text(`${currencySymbol} ${format(grandTotal)}`, 468, totY, { width: 80, align: 'right' });

            // â”€â”€â”€ NOTES / TERMS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            if (order.customerNotes || order.termsConditions) {
                const notesY = totY + 40;
                if (order.customerNotes) {
                    doc.fillColor('#888888').fontSize(9).font('Helvetica-Oblique')
                       .text('Notes:', 40, notesY);
                    doc.fillColor('#555555').font('Helvetica').fontSize(9)
                       .text(order.customerNotes, 40, notesY + 13, { width: 250 });
                }
                if (order.termsConditions) {
                    doc.fillColor('#888888').fontSize(9).font('Helvetica-Oblique')
                       .text('Terms & Conditions:', 310, notesY);
                    doc.fillColor('#555555').font('Helvetica').fontSize(9)
                       .text(order.termsConditions, 310, notesY + 13, { width: 240 });
                }
            }

            // â”€â”€â”€ AUTHORIZED SIGNATURE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
            const sigY = 710;
            doc.fillColor('#000000').fontSize(9).font('Helvetica')
               .text('Authorized Signature ____________________', 40, sigY);

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

            const currency = customer?.currency || company?.baseCurrency || 'INR';
            const currencySymbol = getCurrencySymbol(currency);
            const format = (val) => formatAmount(val, currency);

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
               .text(`${currencySymbol} ${format(amount)}`, 70, bannerY + 34);

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

