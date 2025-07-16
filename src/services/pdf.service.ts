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
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  async generateReceipt(receiptData: ReceiptData): Promise<Buffer> {
    try {
      this.logger.log('Generating receipt PDF for:', receiptData.receiptNumber);

      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        this.generatePDF(doc, receiptData);
        doc.end();
      });
    } catch (error) {
      this.logger.error('Error generating PDF:', error);
      throw error;
    }
  }

  private generatePDF(doc: PDFKit.PDFDocument, receiptData: ReceiptData): void {
    // Header with company branding
    this.addHeader(doc);

    // Receipt title and number
    this.addReceiptTitle(doc, receiptData.receiptNumber);

    // Customer details section
    this.addCustomerDetails(doc, receiptData);

    // Payment details section
    this.addPaymentDetails(doc, receiptData);

    // Footer
    this.addFooter(doc);
  }

  private addHeader(doc: PDFKit.PDFDocument): void {
    // Add Akrix Logo
    try {
      const logoPath = path.join(process.cwd(), '..', 'frontend', 'public', 'akrix-logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 50, { width: 80, height: 80 });
      } else {
        // Fallback logo area with gradient
        doc.rect(50, 50, 80, 80)
           .fillAndStroke('#4F46E5', '#4F46E5');
        doc.fillColor('#FFFFFF')
           .fontSize(14)
           .font('Helvetica-Bold')
           .text('AKRIX', 60, 85);
      }
    } catch (error) {
      // Fallback logo area
      doc.rect(50, 50, 80, 80)
         .fillAndStroke('#4F46E5', '#4F46E5');
      doc.fillColor('#FFFFFF')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('AKRIX', 60, 85);
    }

    // Company details with enhanced styling
    doc.fillColor('#1e40af')
       .fontSize(24)
       .font('Helvetica-Bold')
       .text('AKRIX SOLUTIONS', 150, 55);

    doc.fillColor('#3b82f6')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Professional Digital Solutions', 150, 85);

    doc.fillColor('#6b7280')
       .fontSize(11)
       .font('Helvetica')
       .text('Email: akrix.ai@gmail.com  |  Phone: 8390690910', 150, 105)
       .text('Website: https://akrixai.netlify.app/', 150, 120);

    // Decorative gradient line
    doc.strokeColor('#1e40af')
       .lineWidth(3)
       .moveTo(50, 150)
       .lineTo(550, 150)
       .stroke();

    doc.strokeColor('#3b82f6')
       .lineWidth(1)
       .moveTo(50, 153)
       .lineTo(550, 153)
       .stroke();
  }

  private addReceiptTitle(doc: PDFKit.PDFDocument, receiptNumber: string): void {
    // Receipt title with attractive background
    doc.rect(50, 170, 500, 60)
       .fillAndStroke('#ecfdf5', '#10b981');

    // Receipt title - clean text
    doc.fillColor('#065f46')
       .fontSize(26)
       .font('Helvetica-Bold')
       .text('PAYMENT RECEIPT', 60, 185);

    // Receipt details in a styled box
    doc.rect(350, 175, 190, 50)
       .fillAndStroke('#ffffff', '#10b981');

    doc.fillColor('#059669')
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Receipt Number:', 360, 185)
       .fillColor('#1f2937')
       .font('Helvetica')
       .text(receiptNumber, 360, 200);

    doc.fillColor('#059669')
       .font('Helvetica-Bold')
       .text('Generated:', 360, 215)
       .fillColor('#1f2937')
       .font('Helvetica')
       .text(new Date().toLocaleDateString('en-IN'), 430, 215);
  }

  private addCustomerDetails(doc: PDFKit.PDFDocument, receiptData: ReceiptData): void {
    const startY = 280;

    // Section header - clean text
    doc.fillColor('#1e40af')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text('Customer Information', 50, startY);

    // Table header with better alignment
    const tableStartY = startY + 35;
    doc.rect(50, tableStartY, 500, 30)
       .fillAndStroke('#1e40af', '#1e40af');

    doc.fillColor('#ffffff')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Field', 70, tableStartY + 10)
       .text('Details', 280, tableStartY + 10);

    // Customer information rows - clean labels
    let yPos = tableStartY + 30;
    const customerInfo = [
      ['Customer Name', receiptData.customerName],
      ['Email Address', receiptData.customerEmail],
      ['Phone Number', receiptData.customerPhone],
      ['Address', receiptData.customerAddress]
    ];

    customerInfo.forEach(([label, value], index) => {
      const bgColor = index % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(50, yPos, 500, 25)
         .fillAndStroke(bgColor, '#e2e8f0');

      doc.fillColor('#374151')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(label, 70, yPos + 8);

      doc.fillColor('#1f2937')
         .font('Helvetica')
         .text(value, 280, yPos + 8);

      yPos += 25;
    });
  }

  private addPaymentDetails(doc: PDFKit.PDFDocument, receiptData: ReceiptData): void {
    const startY = 480;

    // Section header - clean text
    doc.fillColor('#059669')
       .fontSize(18)
       .font('Helvetica-Bold')
       .text('Payment Information', 50, startY);

    // Table header with better alignment
    const tableStartY = startY + 35;
    doc.rect(50, tableStartY, 500, 30)
       .fillAndStroke('#059669', '#059669');

    doc.fillColor('#ffffff')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Payment Details', 70, tableStartY + 10)
       .text('Information', 280, tableStartY + 10);

    // Payment information rows - clean labels, essential data only
    let yPos = tableStartY + 30;
    const paymentInfo = [
      ['Amount Paid', `Rs. ${receiptData.amount.toLocaleString('en-IN')}`],
      ['Payment Mode', receiptData.paymentMode.toUpperCase()],
      ['Payment Status', receiptData.status.toUpperCase()],
      ['Receipt Number', receiptData.receiptNumber],
      ['Payment Date', receiptData.date]
    ];

    paymentInfo.forEach(([label, value], index) => {
      const bgColor = index % 2 === 0 ? '#f0fdf4' : '#ffffff';
      doc.rect(50, yPos, 500, 25)
         .fillAndStroke(bgColor, '#bbf7d0');

      doc.fillColor('#065f46')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(label, 70, yPos + 8);

      doc.fillColor('#1f2937')
         .font('Helvetica')
         .text(value, 280, yPos + 8);

      yPos += 25;
    });

    // Highlight the total amount in a special box
    yPos += 20;
    doc.rect(50, yPos, 500, 50)
       .fillAndStroke('#dcfce7', '#16a34a');

    doc.fillColor('#15803d')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('TOTAL AMOUNT PAID', 70, yPos + 15);

    doc.fillColor('#166534')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text(`Rs. ${receiptData.amount.toLocaleString('en-IN')}`, 350, yPos + 10);
  }

  private addFooter(doc: PDFKit.PDFDocument): void {
    const footerY = 720;

    // Decorative line
    doc.strokeColor('#1e40af')
       .lineWidth(2)
       .moveTo(50, footerY)
       .lineTo(550, footerY)
       .stroke();

    // Thank you message - clean text
    doc.fillColor('#059669')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('Thank You for Your Payment!', 50, footerY + 20);

    doc.fillColor('#374151')
       .fontSize(14)
       .font('Helvetica')
       .text('Your transaction has been processed successfully.', 50, footerY + 50);

    // Footer information in a styled box
    doc.rect(50, footerY + 80, 500, 80)
       .fillAndStroke('#f8fafc', '#e2e8f0');

    doc.fillColor('#6b7280')
       .fontSize(11)
       .font('Helvetica')
       .text('This is a computer-generated receipt and does not require a signature.', 70, footerY + 95)
       .text('For any queries, please contact us at akrix.ai@gmail.com', 70, footerY + 110)
       .text('Visit us at https://akrixai.netlify.app/ for more services', 70, footerY + 125)
       .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 70, footerY + 140);

    // Company branding footer
    doc.fillColor('#1e40af')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text('Powered by AKRIX SOLUTIONS', 350, footerY + 110);

    doc.fillColor('#6b7280')
       .fontSize(10)
       .font('Helvetica')
       .text('Professional Digital Solutions', 350, footerY + 130);

    // Add a watermark effect
    doc.fontSize(40)
       .fillColor('#f3f4f6')
       .font('Helvetica-Bold')
       .rotate(-45, { origin: [300, 450] })
       .text('PAID', 280, 430)
       .rotate(45, { origin: [300, 450] });
  }
}
