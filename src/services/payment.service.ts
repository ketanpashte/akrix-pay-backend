import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Payment, Receipt, PaymentStatus, PaymentMode } from '../entities';
import { CreatePaymentDto, VerifyPaymentDto } from '../dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Receipt)
    private receiptRepository: Repository<Receipt>,
  ) {}

  async initiatePayment(createPaymentDto: CreatePaymentDto) {
    // Check if user exists, if not create new user
    let user = await this.userRepository.findOne({
      where: { email: createPaymentDto.email }
    });

    if (!user) {
      user = this.userRepository.create({
        name: createPaymentDto.name,
        email: createPaymentDto.email,
        phone: createPaymentDto.phone,
        address: createPaymentDto.address,
      });
      user = await this.userRepository.save(user);
    }

    // Create payment record
    const payment = this.paymentRepository.create({
      userId: user.id,
      amount: createPaymentDto.amount,
      paymentMode: createPaymentDto.paymentMode,
      status: PaymentStatus.PENDING,
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Generate receipt number
    const receiptNumber = this.generateReceiptNumber();
    savedPayment.receiptNumber = receiptNumber;
    await this.paymentRepository.save(savedPayment);

    return savedPayment;
  }

  async verifyPayment(verifyPaymentDto: VerifyPaymentDto) {
    const payment = await this.paymentRepository.findOne({
      where: { id: verifyPaymentDto.paymentId },
      relations: ['user']
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Mock payment verification (in real scenario, verify with Razorpay)
    const isVerified = true; // Mock verification

    if (isVerified) {
      // Update payment status
      payment.status = PaymentStatus.COMPLETED;
      payment.razorpayPaymentId = verifyPaymentDto.razorpayPaymentId;
      payment.razorpayOrderId = verifyPaymentDto.razorpayOrderId;
      payment.razorpaySignature = verifyPaymentDto.razorpaySignature;

      await this.paymentRepository.save(payment);

      // Generate receipt
      const receiptNumber = this.generateReceiptNumber();
      const receipt = this.receiptRepository.create({
        paymentId: payment.id,
        receiptNumber,
      });

      const savedReceipt = await this.receiptRepository.save(receipt);

      return {
        success: true,
        receiptId: savedReceipt.id,
        receiptNumber: savedReceipt.receiptNumber,
        payment: {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          paymentMode: payment.paymentMode,
          createdAt: payment.createdAt,
        },
        user: payment.user,
      };
    }

    return { success: false, message: 'Payment verification failed' };
  }

  async getReceipt(receiptId: string) {
    const receipt = await this.receiptRepository.findOne({
      where: { id: receiptId },
      relations: ['payment', 'payment.user']
    });

    if (!receipt) {
      throw new NotFoundException('Receipt not found');
    }

    return {
      receipt: {
        id: receipt.id,
        receiptNumber: receipt.receiptNumber,
        generatedAt: receipt.generatedAt,
      },
      payment: {
        id: receipt.payment.id,
        amount: receipt.payment.amount,
        paymentMode: receipt.payment.paymentMode,
        status: receipt.payment.status,
        createdAt: receipt.payment.createdAt,
        razorpayPaymentId: receipt.payment.razorpayPaymentId,
        razorpayOrderId: receipt.payment.razorpayOrderId,
      },
      user: receipt.payment.user,
    };
  }

  private generateReceiptNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');

    return `AKRX-${year}${month}${day}-${random}`;
  }

  async updatePaymentStatus(
    paymentId: string,
    status: string,
    razorpayPaymentId?: string,
    razorpayOrderId?: string
  ) {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['user']
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    payment.status = status as PaymentStatus;
    if (razorpayPaymentId) payment.razorpayPaymentId = razorpayPaymentId;
    if (razorpayOrderId) payment.razorpayOrderId = razorpayOrderId;

    const updatedPayment = await this.paymentRepository.save(payment);

    // Create receipt if payment is completed
    if (status === 'completed') {
      await this.createReceiptFromPayment(updatedPayment);
    }

    return updatedPayment;
  }

  async createDirectReceipt(receiptData: any) {
    // Create or find user
    let user = await this.userRepository.findOne({
      where: { email: receiptData.customerEmail }
    });

    if (!user) {
      user = this.userRepository.create({
        name: receiptData.customerName,
        email: receiptData.customerEmail,
        phone: receiptData.customerPhone,
        address: receiptData.customerAddress,
      });
      user = await this.userRepository.save(user);
    }

    // Create payment record
    const payment = this.paymentRepository.create({
      userId: user.id,
      amount: receiptData.amount,
      paymentMode: receiptData.paymentMode,
      status: PaymentStatus.COMPLETED,
      receiptNumber: this.generateReceiptNumber(),
    });

    const savedPayment = await this.paymentRepository.save(payment);

    // Create receipt
    const receipt = await this.createReceiptFromPayment(savedPayment);

    return {
      ...savedPayment,
      receipt,
    };
  }

  private async createReceiptFromPayment(payment: any) {
    const receipt = this.receiptRepository.create({
      paymentId: payment.id,
      receiptNumber: payment.receiptNumber,
    });

    return await this.receiptRepository.save(receipt);
  }

  async generateReceiptForPayment(paymentId: string) {
    // Find the payment with user details
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['user'],
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Check if receipt already exists
    let receipt = await this.receiptRepository.findOne({
      where: { paymentId: payment.id },
    });

    if (!receipt) {
      // Create new receipt
      receipt = this.receiptRepository.create({
        paymentId: payment.id,
        receiptNumber: payment.receiptNumber,
      });
      receipt = await this.receiptRepository.save(receipt);
    }

    return {
      receiptId: receipt.id,
      receiptNumber: receipt.receiptNumber,
      payment: payment,
    };
  }

  async findReceiptById(receiptId: string) {
    return await this.receiptRepository.findOne({
      where: { id: receiptId },
      relations: ['payment', 'payment.user'],
    });
  }

  async findPaymentById(paymentId: string) {
    return await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['user'],
    });
  }

  async processQRPayment(qrPaymentData: any) {
    try {
      // Add payment mode for QR payments
      const qrPaymentDataWithMode = {
        ...qrPaymentData,
        paymentMode: PaymentMode.UPI, // Set payment mode to UPI for QR payments
      };

      // Create user and payment record
      const paymentRecord = await this.initiatePayment(qrPaymentDataWithMode);

      return {
        success: true,
        paymentId: paymentRecord.id,
        message: 'QR payment initiated. Please complete payment and submit UTR.',
        qrData: {
          amount: qrPaymentData.amount,
          description: qrPaymentData.description || 'Payment to Akrix',
        }
      };
    } catch (error) {
      throw new Error(`QR payment processing failed: ${error.message}`);
    }
  }

  async verifyUTRPayment(utrData: any) {
    try {
      const { paymentId, utrNumber, screenshot } = utrData;

      // Find the payment
      const payment = await this.paymentRepository.findOne({
        where: { id: paymentId },
        relations: ['user'],
      });

      if (!payment) {
        throw new NotFoundException('Payment not found');
      }

      // Simple UTR validation (in real implementation, you'd verify with bank API)
      const isValidUTR = this.validateUTR(utrNumber);

      if (!isValidUTR) {
        return {
          success: false,
          message: 'Invalid UTR number format',
        };
      }

      // Update payment with UTR and mark as completed
      payment.razorpayPaymentId = utrNumber; // Store UTR in this field for QR payments
      payment.status = PaymentStatus.COMPLETED;
      payment.updatedAt = new Date();

      const updatedPayment = await this.paymentRepository.save(payment);

      // Generate receipt
      const receipt = await this.generateReceiptForPayment(payment.id);

      return {
        success: true,
        message: 'Payment verified successfully',
        payment: updatedPayment,
        receipt: receipt,
        utrNumber: utrNumber,
      };
    } catch (error) {
      throw new Error(`UTR verification failed: ${error.message}`);
    }
  }

  private validateUTR(utrNumber: string): boolean {
    // Basic UTR validation - should be 12 digits
    const utrRegex = /^\d{12}$/;
    return utrRegex.test(utrNumber);
  }

}
