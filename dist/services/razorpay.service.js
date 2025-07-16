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
var RazorpayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RazorpayService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
const Razorpay = require('razorpay');
let RazorpayService = RazorpayService_1 = class RazorpayService {
    configService;
    logger = new common_1.Logger(RazorpayService_1.name);
    razorpay;
    constructor(configService) {
        this.configService = configService;
        this.razorpay = new Razorpay({
            key_id: this.configService.get('RAZORPAY_KEY_ID'),
            key_secret: this.configService.get('RAZORPAY_KEY_SECRET'),
        });
        this.logger.log('Razorpay service initialized');
    }
    async createOrder(amount, currency = 'INR', receipt) {
        try {
            const options = {
                amount: amount * 100,
                currency,
                receipt: receipt || `receipt_order_${Date.now()}`,
            };
            const order = await this.razorpay.orders.create(options);
            this.logger.log(`Razorpay order created: ${order.id}`);
            return order;
        }
        catch (error) {
            this.logger.error('Error creating Razorpay order:', error);
            throw new Error(`Failed to create payment order: ${error.message}`);
        }
    }
    async verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
        try {
            const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');
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
        }
        catch (error) {
            this.logger.error('Error verifying payment:', error);
            return false;
        }
    }
    async getPaymentDetails(paymentId) {
        try {
            const payment = await this.razorpay.payments.fetch(paymentId);
            this.logger.log(`Payment details fetched for: ${paymentId}`);
            return payment;
        }
        catch (error) {
            this.logger.error('Error fetching payment details:', error);
            throw new Error(`Failed to fetch payment details: ${error.message}`);
        }
    }
};
exports.RazorpayService = RazorpayService;
exports.RazorpayService = RazorpayService = RazorpayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RazorpayService);
//# sourceMappingURL=razorpay.service.js.map