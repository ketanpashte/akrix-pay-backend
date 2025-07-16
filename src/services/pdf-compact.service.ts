import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export interface ReceiptData {
  receiptNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  amount: number;
  paymentMode: string;
  paymentId?: string;
  orderId?: string;
  status: string;
}

@Injectable()
export class PdfCompactService {
  private readonly logger = new Logger(PdfCompactService.name);

  async generateReceipt(receiptData: ReceiptData): Promise<Buffer> {
    try {
      this.logger.log('Generating compact receipt PDF for:', receiptData.receiptNumber);

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ 
          margin: 40,
          size: 'A4'
        });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.generateCompactPDF(doc, receiptData);
        doc.end();
      });
    } catch (error) {
      this.logger.error('Error generating PDF:', error);
      throw error;
    }
  }

  private generateCompactPDF(doc: PDFKit.PDFDocument, receiptData: ReceiptData): void {
    let currentY = 40;

    // Header
    currentY = this.addHeader(doc, currentY);
    
    // Receipt title
    currentY = this.addReceiptTitle(doc, receiptData.receiptNumber, currentY);
    
    // Customer and payment details in compact format
    currentY = this.addDetailsSection(doc, receiptData, currentY);
    
    // Total amount highlight
    currentY = this.addTotalSection(doc, receiptData, currentY);
    
    // Footer
    this.addFooter(doc, currentY);
  }

  private addHeader(doc: PDFKit.PDFDocument, startY: number): number {
    // Logo
    try {
      const logoPath = path.join(process.cwd(), '..', 'frontend', 'public', 'akrix-logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 40, startY, { width: 40, height: 40 });
      } else {
        doc.rect(40, startY, 40, 40).fillAndStroke('#4F46E5', '#4F46E5');
        doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('AKRIX', 50, startY + 16);
      }
    } catch (error) {
      doc.rect(40, startY, 40, 40).fillAndStroke('#4F46E5', '#4F46E5');
      doc.fillColor('#FFFFFF').fontSize(8).font('Helvetica-Bold').text('AKRIX', 50, startY + 16);
    }

    // Company info
    doc.fillColor('#1e40af').fontSize(16).font('Helvetica-Bold').text('AKRIX SOLUTIONS', 90, startY + 5);
    doc.fillColor('#6b7280').fontSize(9).font('Helvetica').text('Email: akrix.ai@gmail.com | Phone: 8390690910', 90, startY + 25);

    // Line
    doc.strokeColor('#1e40af').lineWidth(1).moveTo(40, startY + 50).lineTo(555, startY + 50).stroke();

    return startY + 65;
  }

  private addReceiptTitle(doc: PDFKit.PDFDocument, receiptNumber: string, startY: number): number {
    doc.fillColor('#059669').fontSize(18).font('Helvetica-Bold').text('PAYMENT RECEIPT', 40, startY);
    doc.fillColor('#374151').fontSize(12).font('Helvetica').text(`Receipt #: ${receiptNumber}`, 40, startY + 25);
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 300, startY + 25);

    return startY + 50;
  }

  private addDetailsSection(doc: PDFKit.PDFDocument, receiptData: ReceiptData, startY: number): number {
    // Customer details (left column)
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

    // Payment details (right column)
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

  private addTotalSection(doc: PDFKit.PDFDocument, receiptData: ReceiptData, startY: number): number {
    // Total amount box
    doc.rect(40, startY, 515, 40).fillAndStroke('#dcfce7', '#16a34a');
    
    doc.fillColor('#15803d').fontSize(16).font('Helvetica-Bold').text('TOTAL AMOUNT PAID', 60, startY + 12);
    doc.fillColor('#166534').fontSize(20).font('Helvetica-Bold').text(`Rs. ${receiptData.amount.toLocaleString('en-IN')}`, 350, startY + 8);

    return startY + 60;
  }

  private addFooter(doc: PDFKit.PDFDocument, startY: number): void {
    // Thank you message
    doc.fillColor('#059669').fontSize(14).font('Helvetica-Bold').text('Thank You for Your Payment!', 40, startY);
    doc.fillColor('#374151').fontSize(11).font('Helvetica').text('Your transaction has been processed successfully.', 40, startY + 20);

    // Footer info
    doc.fillColor('#6b7280').fontSize(9).font('Helvetica')
       .text('This is a computer-generated receipt and does not require a signature.', 40, startY + 45)
       .text('For queries, contact: akrix.ai@gmail.com | Visit: https://akrixai.netlify.app/', 40, startY + 60)
       .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 40, startY + 75);

    // Watermark
    doc.fontSize(30).fillColor('#f3f4f6').font('Helvetica-Bold')
       .rotate(-45, { origin: [300, 400] })
       .text('PAID', 280, 380)
       .rotate(45, { origin: [300, 400] });
  }
}
