import { Controller, Get, Post, Body, Param, Res, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { PdfCompactService } from '../services/pdf-compact.service';
import { EmailService } from '../services/email.service';

@Controller('api/receipt')
export class ReceiptController {
  private readonly logger = new Logger(ReceiptController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly pdfService: PdfCompactService,
    private readonly emailService: EmailService,
  ) {}

  @Post('generate')
  async generateDirectReceipt(@Body() receiptData: any, @Res() res: Response) {
    try {
      this.logger.log('Generating direct receipt');

      // Create a direct receipt record
      const directReceipt = await this.paymentService.createDirectReceipt(receiptData);

      // Generate PDF
      const pdfBuffer = await this.pdfService.generateReceipt({
        receiptNumber: directReceipt.receiptNumber,
        date: new Date().toLocaleDateString('en-IN'),
        customerName: receiptData.customerName,
        customerEmail: receiptData.customerEmail,
        customerPhone: receiptData.customerPhone,
        customerAddress: receiptData.customerAddress,
        amount: parseFloat(receiptData.amount),
        paymentMode: receiptData.paymentMode,
        status: 'completed',
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${directReceipt.receiptNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error('Error generating direct receipt:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

  @Get('download/:receiptId')
  async downloadReceipt(@Param('receiptId') receiptId: string, @Res() res: Response) {
    try {
      // Find the receipt and associated payment
      const receipt = await this.paymentService.findReceiptById(receiptId);
      
      if (!receipt) {
        throw new HttpException('Receipt not found', HttpStatus.NOT_FOUND);
      }

      // Generate PDF
      const receiptData = {
        receiptNumber: receipt.receiptNumber,
        date: receipt.payment.createdAt.toLocaleDateString('en-IN'),
        customerName: receipt.payment.user.name,
        customerEmail: receipt.payment.user.email,
        customerPhone: receipt.payment.user.phone,
        customerAddress: receipt.payment.user.address,
        amount: receipt.payment.amount,
        paymentMode: receipt.payment.paymentMode,
        paymentId: receipt.payment.razorpayPaymentId,
        orderId: receipt.payment.razorpayOrderId,
        status: receipt.payment.status,
      };

      const pdfBuffer = await this.pdfService.generateReceipt(receiptData);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${receipt.receiptNumber}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to download receipt',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('payment/:paymentId/pdf')
  async getReceiptByPaymentId(@Param('paymentId') paymentId: string, @Res() res: Response) {
    try {
      // Find payment with user details
      const payment = await this.paymentService.findPaymentById(paymentId);

      if (!payment) {
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }

      // Generate PDF
      const receiptData = {
        receiptNumber: payment.receiptNumber,
        date: payment.createdAt.toLocaleDateString('en-IN'),
        customerName: payment.user.name,
        customerEmail: payment.user.email,
        customerPhone: payment.user.phone,
        customerAddress: payment.user.address,
        amount: payment.amount,
        paymentMode: payment.paymentMode,
        paymentId: payment.razorpayPaymentId,
        orderId: payment.razorpayOrderId,
        status: payment.status,
      };

      const pdfBuffer = await this.pdfService.generateReceipt(receiptData);

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${payment.receiptNumber}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.send(pdfBuffer);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to generate receipt PDF',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':paymentId/pdf')
  async getReceiptPdf(@Param('paymentId') paymentId: string, @Res() res: Response) {
    // Redirect to the new endpoint for backward compatibility
    return this.getReceiptByPaymentId(paymentId, res);
  }

  @Post('send-email/:receiptId')
  async sendReceiptEmail(@Param('receiptId') receiptId: string) {
    try {
      this.logger.log(`Sending receipt email for receipt ID: ${receiptId}`);

      // Find the receipt with payment and user details
      const receipt = await this.paymentService.findReceiptById(receiptId);

      if (!receipt) {
        return {
          success: false,
          message: 'Receipt not found',
        };
      }

      // Generate PDF
      const pdfBuffer = await this.pdfService.generateReceipt({
        receiptNumber: receipt.receiptNumber,
        date: new Date(receipt.generatedAt).toLocaleDateString('en-IN'),
        customerName: receipt.payment.user.name,
        customerEmail: receipt.payment.user.email,
        customerPhone: receipt.payment.user.phone,
        customerAddress: receipt.payment.user.address,
        amount: receipt.payment.amount,
        paymentMode: receipt.payment.paymentMode,
        status: receipt.payment.status,
      });

      // Send email to client
      await this.emailService.sendReceiptToClient(
        receipt.payment.user.email,
        receipt.payment.user.name,
        receipt.payment.amount,
        pdfBuffer,
        receipt.receiptNumber
      );

      // Send notification to Akrix
      await this.emailService.sendPaymentNotificationToAkrix(
        receipt.payment.user.name,
        receipt.payment.user.email,
        receipt.payment.amount,
        pdfBuffer,
        receipt.receiptNumber
      );

      return {
        success: true,
        message: 'Receipt emails sent successfully to both client and Akrix',
      };
    } catch (error) {
      this.logger.error('Error sending receipt email:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
