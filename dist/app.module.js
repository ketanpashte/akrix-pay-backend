"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const payment_controller_1 = require("./controllers/payment.controller");
const receipt_controller_1 = require("./controllers/receipt.controller");
const admin_controller_1 = require("./controllers/admin.controller");
const payment_service_1 = require("./services/payment.service");
const admin_service_1 = require("./services/admin.service");
const razorpay_service_1 = require("./services/razorpay.service");
const pdf_compact_service_1 = require("./services/pdf-compact.service");
const email_service_1 = require("./services/email.service");
const entities_1 = require("./entities");
const database_config_1 = require("./config/database.config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: database_config_1.getDatabaseConfig,
                inject: [config_1.ConfigService],
            }),
            typeorm_1.TypeOrmModule.forFeature([entities_1.User, entities_1.Payment, entities_1.Receipt, entities_1.Admin]),
        ],
        controllers: [app_controller_1.AppController, payment_controller_1.PaymentController, receipt_controller_1.ReceiptController, admin_controller_1.AdminController],
        providers: [app_service_1.AppService, payment_service_1.PaymentService, admin_service_1.AdminService, razorpay_service_1.RazorpayService, pdf_compact_service_1.PdfCompactService, email_service_1.EmailService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map