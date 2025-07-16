"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PdfCompactService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfCompactService = void 0;
const common_1 = require("@nestjs/common");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
let PdfCompactService = PdfCompactService_1 = class PdfCompactService {
    logger = new common_1.Logger(PdfCompactService_1.name);
    async generateReceipt(receiptData) {
        try {
            this.logger.log('Generating compact receipt PDF for:', receiptData.receiptNumber);
            return new Promise((resolve, reject) => {
                const doc = new PDFDocument({
                    margin: 40,
                    size: 'A4'
                });
                const chunks = [];
                doc.on('data', (chunk) => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);
                this.generateCompactPDF(doc, receiptData);
                doc.end();
            });
        }
        catch (error) {
            this.logger.error('Error generating PDF:', error);
            throw error;
        }
    }
    generateCompactPDF(doc, receiptData) {
        let currentY = 40;
        currentY = this.addHeader(doc, currentY);
        currentY = this.addReceiptTitle(doc, receiptData.receiptNumber, currentY);
        currentY = this.addDetailsSection(doc, receiptData, currentY);
        currentY = this.addTotalSection(doc, receiptData, currentY);
        this.addFooter(doc, currentY);
    }
    addHeader(doc, startY) {
        try {
            const logoPath = path.join(process.cwd(), '..', 'frontend', 'public', 'akrix-logo.png');
            if (fs.existsSync(logoPath)) {
                doc.image(logoPath, 40, startY, { width: 40, height: 40 });
            }
            else {
                doc.rect(40, startY, 40, 40).fillAndStroke('#4F46E5', '#4F46E5');
                doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('AKRIX', 50, startY + 16);
            }
        }
        catch (error) {
            doc.rect(40, startY, 40, 40).fillAndStroke('#4F46E5', '#4F46E5');
            doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('AKRIX', 50, startY + 16);
        }
        doc.fillColor('#1e40af').fontSize(16).font('Helvetica-Bold').text('AKRIX SOLUTIONS', 90, startY + 5);
        doc.fillColor('#6b7280').fontSize(9).font('Helvetica').text('Email: akrix.ai@gmail.com | Phone: 8390690910', 90, startY + 25);
        doc.strokeColor('#1e40af').lineWidth(1).moveTo(40, startY + 50).lineTo(555, startY + 50).stroke();
        return startY + 65;
    }
    addReceiptTitle(doc, receiptNumber, startY) {
        doc.fillColor('#059669').fontSize(18).font('Helvetica-Bold').text('PAYMENT RECEIPT', 40, startY);
        doc.fillColor('#374151').fontSize(12).font('Helvetica').text(`Receipt #: ${receiptNumber}`, 40, startY + 25);
        doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 300, startY + 25);
        return startY + 50;
    }
    addDetailsSection(doc, receiptData, startY) {
        doc.fillColor('#1e40af').fontSize(14).font('Helvetica-Bold').text('Customer Details', 40, startY);
        const customerDetails = [
            ['Name:', receiptData.customerName],
            ['Email:', receiptData.customerEmail],
            ['Phone:', receiptData.customerPhone],
            ['Address:', receiptData.customerAddress]
        ];
        let yPos = startY + 25;
        customerDetails.forEach(([label, value]) => {
            doc.fillColor('#374151').fontSize(10).font('Helvetica-Bold').text(label, 40, yPos);
            doc.fillColor('#1f2937').fontSize(10).font('Helvetica').text(value, 100, yPos);
            yPos += 18;
        });
        doc.fillColor('#059669').fontSize(14).font('Helvetica-Bold').text('Payment Details', 300, startY);
        const paymentDetails = [
            ['Amount:', `Rs. ${receiptData.amount.toLocaleString('en-IN')}`],
            ['Payment Mode:', receiptData.paymentMode.toUpperCase()],
            ['Status:', receiptData.status.toUpperCase()],
            ['Date:', receiptData.date]
        ];
        yPos = startY + 25;
        paymentDetails.forEach(([label, value]) => {
            doc.fillColor('#374151').fontSize(10).font('Helvetica-Bold').text(label, 300, yPos);
            doc.fillColor('#1f2937').fontSize(10).font('Helvetica').text(value, 380, yPos);
            yPos += 18;
        });
        return Math.max(startY + 25 + (customerDetails.length * 18), startY + 25 + (paymentDetails.length * 18)) + 20;
    }
    addTotalSection(doc, receiptData, startY) {
        doc.rect(40, startY, 515, 40).fillAndStroke('#dcfce7', '#16a34a');
        doc.fillColor('#15803d').fontSize(16).font('Helvetica-Bold').text('TOTAL AMOUNT PAID', 60, startY + 12);
        doc.fillColor('#166534').fontSize(20).font('Helvetica-Bold').text(`Rs. ${receiptData.amount.toLocaleString('en-IN')}`, 350, startY + 8);
        return startY + 60;
    }
    addFooter(doc, startY) {
        doc.fillColor('#059669').fontSize(14).font('Helvetica-Bold').text('Thank You for Your Payment!', 40, startY);
        doc.fillColor('#374151').fontSize(11).font('Helvetica').text('Your transaction has been processed successfully.', 40, startY + 20);
        doc.fillColor('#6b7280').fontSize(9).font('Helvetica')
            .text('This is a computer-generated receipt and does not require a signature.', 40, startY + 45)
            .text('For queries, contact: akrix.ai@gmail.com | Visit: https://akrixai.netlify.app/', 40, startY + 60)
            .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 40, startY + 75);
        doc.fontSize(30).fillColor('#f3f4f6').font('Helvetica-Bold')
            .rotate(-45, { origin: [300, 400] })
            .text('PAID', 280, 380)
            .rotate(45, { origin: [300, 400] });
    }
};
exports.PdfCompactService = PdfCompactService;
exports.PdfCompactService = PdfCompactService = PdfCompactService_1 = __decorate([
    (0, common_1.Injectable)()
], PdfCompactService);
//# sourceMappingURL=pdf-compact.service.js.map