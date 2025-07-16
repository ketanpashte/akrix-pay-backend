import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

const Razorpay = require('razorpay');

@Injectable()
export class RazorpayService {
  private readonly logger = new Logger(RazorpayService.name);
  private razorpay: any;

  constructor(private configService: ConfigService) {
    this.razorpay = new Razorpay({
      key_id: this.configService.get<string>('RAZORPAY_KEY_ID'),
      key_secret: this.configService.get<string>('RAZORPAY_KEY_SECRET'),
    });
    this.logger.log('Razorpay service initialized');
  }

  async createOrder(amount: number, currency: string = 'INR', receipt?: string) {
    try {
      const options = {
        amount: amount * 100, // amount in paise
        currency,
        receipt: receipt || `receipt_order_${Date.now()}`,
      };

      const order = await this.razorpay.orders.create(options);
      this.logger.log(`Razorpay order created: ${order.id}`);
      return order;
    } catch (error) {
      this.logger.error('Error creating Razorpay order:', error);
      throw new Error(`Failed to create payment order: ${error.message}`);
    }
  }

  async verifyPayment(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string): Promise<boolean> {
    try {
      const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');

      if (!keySecret) {
        this.logger.error('Razorpay key secret not found');
        return false;
      }

      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(razorpayOrderId + '|' + razorpayPaymentId)
        .digest('hex');

      const isAuthentic = generatedSignature === razorpaySignature;
      this.logger.log(`Payment verification result: ${isAuthentic}`);
      return isAuthentic;
    } catch (error) {
      this.logger.error('Error verifying payment:', error);
      return false;
    }
  }

  async getPaymentDetails(paymentId: string) {
    try {
      const payment = await this.razorpay.payments.fetch(paymentId);
      this.logger.log(`Payment details fetched for: ${paymentId}`);
      return payment;
    } catch (error) {
      this.logger.error('Error fetching payment details:', error);
      throw new Error(`Failed to fetch payment details: ${error.message}`);
    }
  }
}
