import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentController } from './controllers/payment.controller';
import { ReceiptController } from './controllers/receipt.controller';
import { AdminController } from './controllers/admin.controller';
import { PaymentService } from './services/payment.service';
import { AdminService } from './services/admin.service';
import { RazorpayService } from './services/razorpay.service';
import { PdfCompactService } from './services/pdf-compact.service';
import { EmailService } from './services/email.service';
import { User, Payment, Receipt, Admin } from './entities';
import { getDatabaseConfig } from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Payment, Receipt, Admin]),
  ],
  controllers: [AppController, PaymentController, ReceiptController, AdminController],
  providers: [AppService, PaymentService, AdminService, RazorpayService, PdfCompactService, EmailService],
})
export class AppModule {}
