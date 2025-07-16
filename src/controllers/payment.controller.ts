import { Controller, Post, Get, Body, Param, ValidationPipe, Res, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { RazorpayService } from '../services/razorpay.service';
import { PdfCompactService } from '../services/pdf-compact.service';
import { CreatePaymentDto, VerifyPaymentDto } from '../dto';

@Controller('api/payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly razorpayService: RazorpayService,
    private readonly pdfService: PdfCompactService,
  ) {}

  @Post('create-order')
  async createRazorpayOrder(@Body(ValidationPipe) createPaymentDto: CreatePaymentDto) {
    try {
      this.logger.log('Creating Razorpay order for payment');

      // Create user and payment record first
      const paymentRecord = await this.paymentService.initiatePayment(createPaymentDto);

      // Create Razorpay order
      const razorpayOrder = await this.razorpayService.createOrder(
        createPaymentDto.amount,
        'INR',
        paymentRecord.receiptNumber
      );

      return {
        success: true,
        orderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        paymentId: paymentRecord.id,
        receiptNumber: paymentRecord.receiptNumber,
        key: process.env.RAZORPAY_KEY_ID,
      };
    } catch (error) {
      this.logger.error('Error creating Razorpay order:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('verify')
  async verifyRazorpayPayment(@Body() verifyData: any) {
    try {
      this.logger.log('Verifying Razorpay payment');

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = verifyData;

      // Verify payment signature
      const isValid = await this.razorpayService.verifyPayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (isValid) {
        // Update payment status
        const updatedPayment = await this.paymentService.updatePaymentStatus(
          paymentId,
          'completed',
          razorpay_payment_id,
          razorpay_order_id
        );

        // Generate receipt automatically after successful payment
        const receipt = await this.paymentService.generateReceiptForPayment(updatedPayment.id);

        return {
          success: true,
          message: 'Payment verified successfully',
          payment: updatedPayment,
          receipt: receipt,
        };
      } else {
        await this.paymentService.updatePaymentStatus(paymentId, 'failed');
        return {
          success: false,
          message: 'Payment verification failed',
        };
      }
    } catch (error) {
      this.logger.error('Error verifying payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Post('initiate')
  async initiatePayment(@Body(ValidationPipe) createPaymentDto: CreatePaymentDto) {
    return this.paymentService.initiatePayment(createPaymentDto);
  }

  @Post('qr-payment')
  async processQRPayment(@Body() qrPaymentData: any) {
    return this.paymentService.processQRPayment(qrPaymentData);
  }

  @Post('verify-utr')
  async verifyUTRPayment(@Body() utrData: any) {
    return this.paymentService.verifyUTRPayment(utrData);
  }
}

@Controller('api/receipt')
export class ReceiptController {
  private readonly logger = new Logger(ReceiptController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly pdfService: PdfCompactService,
  ) {}

  @Get(':id')
  async getReceipt(@Param('id') id: string) {
    return this.paymentService.getReceipt(id);
  }

  @Get(':id/pdf')
  async downloadReceiptPdf(@Param('id') id: string, @Res() res: Response) {
    try {
      this.logger.log(`Generating PDF for receipt: ${id}`);

      // Get receipt data
      const receipt = await this.paymentService.getReceipt(id);
      if (!receipt) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Receipt not found',
        });
      }

      // Generate PDF
      const pdfBuffer = await this.pdfService.generateReceipt({
        receiptNumber: receipt.receipt.receiptNumber,
        date: new Date(receipt.payment.createdAt).toLocaleDateString('en-IN'),
        customerName: receipt.user.name,
        customerEmail: receipt.user.email,
        customerPhone: receipt.user.phone,
        customerAddress: receipt.user.address,
        amount: parseFloat(receipt.payment.amount.toString()),
        paymentMode: receipt.payment.paymentMode,
        paymentId: receipt.payment.razorpayPaymentId || 'N/A',
        orderId: receipt.payment.razorpayOrderId || 'N/A',
        status: receipt.payment.status,
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${receipt.receipt.receiptNumber}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      this.logger.error('Error generating PDF:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: error.message,
      });
    }
  }

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


}
