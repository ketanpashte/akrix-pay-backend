"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PaymentController_1, ReceiptController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptController = exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("../services/payment.service");
const razorpay_service_1 = require("../services/razorpay.service");
const pdf_compact_service_1 = require("../services/pdf-compact.service");
const dto_1 = require("../dto");
let PaymentController = PaymentController_1 = class PaymentController {
    paymentService;
    razorpayService;
    pdfService;
    logger = new common_1.Logger(PaymentController_1.name);
    constructor(paymentService, razorpayService, pdfService) {
        this.paymentService = paymentService;
        this.razorpayService = razorpayService;
        this.pdfService = pdfService;
    }
    async createRazorpayOrder(createPaymentDto) {
        try {
            this.logger.log('Creating Razorpay order for payment');
            const paymentRecord = await this.paymentService.initiatePayment(createPaymentDto);
            const razorpayOrder = await this.razorpayService.createOrder(createPaymentDto.amount, 'INR', paymentRecord.receiptNumber);
            return {
                success: true,
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                paymentId: paymentRecord.id,
                receiptNumber: paymentRecord.receiptNumber,
                key: process.env.RAZORPAY_KEY_ID,
            };
        }
        catch (error) {
            this.logger.error('Error creating Razorpay order:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async verifyRazorpayPayment(verifyData) {
        try {
            this.logger.log('Verifying Razorpay payment');
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = verifyData;
            const isValid = await this.razorpayService.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);
            if (isValid) {
                const updatedPayment = await this.paymentService.updatePaymentStatus(paymentId, 'completed', razorpay_payment_id, razorpay_order_id);
                const receipt = await this.paymentService.generateReceiptForPayment(updatedPayment.id);
                return {
                    success: true,
                    message: 'Payment verified successfully',
                    payment: updatedPayment,
                    receipt: receipt,
                };
            }
            else {
                await this.paymentService.updatePaymentStatus(paymentId, 'failed');
                return {
                    success: false,
                    message: 'Payment verification failed',
                };
            }
        }
        catch (error) {
            this.logger.error('Error verifying payment:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
    async initiatePayment(createPaymentDto) {
        return this.paymentService.initiatePayment(createPaymentDto);
    }
    async processQRPayment(qrPaymentData) {
        return this.paymentService.processQRPayment(qrPaymentData);
    }
    async verifyUTRPayment(utrData) {
        return this.paymentService.verifyUTRPayment(utrData);
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('create-order'),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createRazorpayOrder", null);
__decorate([
    (0, common_1.Post)('verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "verifyRazorpayPayment", null);
__decorate([
    (0, common_1.Post)('initiate'),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePaymentDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "initiatePayment", null);
__decorate([
    (0, common_1.Post)('qr-payment'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "processQRPayment", null);
__decorate([
    (0, common_1.Post)('verify-utr'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "verifyUTRPayment", null);
exports.PaymentController = PaymentController = PaymentController_1 = __decorate([
    (0, common_1.Controller)('api/payment'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        razorpay_service_1.RazorpayService,
        pdf_compact_service_1.PdfCompactService])
], PaymentController);
let ReceiptController = ReceiptController_1 = class ReceiptController {
    paymentService;
    pdfService;
    logger = new common_1.Logger(ReceiptController_1.name);
    constructor(paymentService, pdfService) {
        this.paymentService = paymentService;
        this.pdfService = pdfService;
    }
    async getReceipt(id) {
        return this.paymentService.getReceipt(id);
    }
    async downloadReceiptPdf(id, res) {
        try {
            this.logger.log(`Generating PDF for receipt: ${id}`);
            const receipt = await this.paymentService.getReceipt(id);
            if (!receipt) {
                return res.status(common_1.HttpStatus.NOT_FOUND).json({
                    success: false,
                    message: 'Receipt not found',
                });
            }
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
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="receipt-${receipt.receipt.receiptNumber}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.send(pdfBuffer);
        }
        catch (error) {
            this.logger.error('Error generating PDF:', error);
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message,
            });
        }
    }
    async generateDirectReceipt(receiptData, res) {
        try {
            this.logger.log('Generating direct receipt');
            const directReceipt = await this.paymentService.createDirectReceipt(receiptData);
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
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="receipt-${directReceipt.receiptNumber}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.send(pdfBuffer);
        }
        catch (error) {
            this.logger.error('Error generating direct receipt:', error);
            res.status(common_1.HttpStatus.INTERNAL_SERVER_ERROR).json({
                success: false,
                error: error.message,
            });
        }
    }
};
exports.ReceiptController = ReceiptController;
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReceiptController.prototype, "getReceipt", null);
__decorate([
    (0, common_1.Get)(':id/pdf'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReceiptController.prototype, "downloadReceiptPdf", null);
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReceiptController.prototype, "generateDirectReceipt", null);
exports.ReceiptController = ReceiptController = ReceiptController_1 = __decorate([
    (0, common_1.Controller)('api/receipt'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        pdf_compact_service_1.PdfCompactService])
], ReceiptController);
//# sourceMappingURL=payment.controller.js.map