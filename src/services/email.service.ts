import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get('SMTP_HOST', 'smtp.gmail.com'),
        port: parseInt(this.configService.get('SMTP_PORT', '587')),
        secure: false, // true for 465, false for other ports
        auth: {
          user: this.configService.get('SMTP_USER'),
          pass: this.configService.get('SMTP_PASS'),
        },
      });

      this.logger.log('Email transporter initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize email transporter:', error);
    }
  }

  async sendReceiptToClient(clientEmail: string, clientName: string, amount: number, receiptBuffer: Buffer, receiptNumber: string) {
    try {
      const mailOptions = {
        from: this.configService.get('SMTP_USER'),
        to: clientEmail,
        subject: '🎉 Payment Successful - Receipt from Akrix',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Receipt - Akrix Technologies</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 650px; margin: 0 auto; padding: 20px;">

              <!-- Header with Logo -->
              <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #10b981 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -30px; left: -30px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>

                <div style="position: relative; z-index: 2;">
                  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    🎉 Payment Successful!
                  </h1>
                  <p style="color: #e0f2fe; margin: 15px 0 0 0; font-size: 18px; font-weight: 500;">
                    Thank you for choosing Akrix Solutions
                  </p>
                  <div style="background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 25px; display: inline-block; margin-top: 15px;">
                    <span style="color: white; font-size: 14px; font-weight: 600;">Receipt #${receiptNumber}</span>
                  </div>
                </div>
              </div>

              <!-- Main Content -->
              <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h2 style="color: #1e40af; margin: 0; font-size: 24px; font-weight: bold;">Dear ${clientName},</h2>
                  <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #1e40af, #10b981); margin: 15px auto; border-radius: 2px;"></div>
                </div>

                <p style="color: #475569; line-height: 1.8; font-size: 16px; text-align: center; margin-bottom: 30px;">
                  We're delighted to confirm that your payment has been <strong style="color: #10b981;">successfully processed</strong>.
                  Your transaction is complete and your receipt is ready!
                </p>
              
                <!-- Payment Details Card -->
                <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #bae6fd; position: relative; overflow: hidden;">
                  <div style="position: absolute; top: -20px; right: -20px; width: 80px; height: 80px; background: rgba(59, 130, 246, 0.1); border-radius: 50%;"></div>

                  <h3 style="color: #1e40af; margin: 0 0 20px 0; font-size: 20px; font-weight: bold; text-align: center;">
                    💳 Payment Details
                  </h3>

                  <table style="width: 100%; border-collapse: collapse; position: relative; z-index: 2;">
                    <tr>
                      <td style="padding: 12px 15px; background: rgba(255,255,255,0.7); border-radius: 8px; margin-bottom: 8px; display: block; border-left: 4px solid #3b82f6;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                          <span style="color: #475569; font-weight: 600; font-size: 14px;">📄 Receipt Number</span>
                          <span style="color: #1e40af; font-weight: bold; font-family: monospace;">${receiptNumber}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 15px; background: rgba(255,255,255,0.7); border-radius: 8px; margin: 8px 0; display: block; border-left: 4px solid #10b981;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                          <span style="color: #475569; font-weight: 600; font-size: 14px;">💰 Amount Paid</span>
                          <span style="color: #059669; font-weight: bold; font-size: 20px;">₹${amount.toLocaleString('en-IN')}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 15px; background: rgba(255,255,255,0.7); border-radius: 8px; margin: 8px 0; display: block; border-left: 4px solid #f59e0b;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                          <span style="color: #475569; font-weight: 600; font-size: 14px;">📅 Payment Date</span>
                          <span style="color: #1f2937; font-weight: 600;">${new Date().toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 12px 15px; background: rgba(255,255,255,0.7); border-radius: 8px; margin-top: 8px; display: block; border-left: 4px solid #10b981;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                          <span style="color: #475569; font-weight: 600; font-size: 14px;">✅ Status</span>
                          <span style="background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 20px; font-weight: bold; font-size: 12px;">COMPLETED</span>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>
              
                <!-- Receipt Attachment Notice -->
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 30px 0; border: 1px solid #f59e0b; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 10px;">📄</div>
                  <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">Receipt Attached</h4>
                  <p style="margin: 0; color: #78350f; font-size: 14px; line-height: 1.5;">
                    Your official payment receipt is attached as a PDF document.<br>
                    <strong>Please save it for your records and future reference.</strong>
                  </p>
                </div>

                <!-- Contact Information -->
                <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #e2e8f0;">
                  <h4 style="color: #1e40af; margin: 0 0 15px 0; font-size: 18px; font-weight: bold; text-align: center;">
                    📞 Need Help?
                  </h4>
                  <p style="color: #475569; line-height: 1.6; text-align: center; margin-bottom: 20px;">
                    If you have any questions about this payment or need assistance, our support team is here to help!
                  </p>

                  <div style="display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e2e8f0; min-width: 150px;">
                      <div style="color: #3b82f6; font-size: 24px; margin-bottom: 8px;">📧</div>
                      <div style="color: #1e40af; font-weight: 600; font-size: 14px;">Email Support</div>
                      <div style="color: #64748b; font-size: 12px;">akrix.ai@gmail.com</div>
                    </div>
                    <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e2e8f0; min-width: 150px;">
                      <div style="color: #10b981; font-size: 24px; margin-bottom: 8px;">🌐</div>
                      <div style="color: #1e40af; font-weight: 600; font-size: 14px;">Visit Website</div>
                      <div style="color: #64748b; font-size: 12px;">akrixai.netlify.app</div>
                    </div>
                  </div>
                </div>

                <!-- Thank You Message -->
                <div style="text-align: center; margin: 40px 0 20px 0; padding: 30px; background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; border: 1px solid #10b981;">
                  <div style="font-size: 48px; margin-bottom: 15px;">🙏</div>
                  <h3 style="color: #065f46; margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">Thank You!</h3>
                  <p style="color: #047857; margin: 0; font-size: 16px; font-weight: 500;">
                    We appreciate your business and trust in Akrix Solutions
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #1e293b; padding: 30px; border-radius: 15px; text-align: center; margin-top: 20px;">
                <div style="color: #94a3b8; font-size: 14px; margin-bottom: 15px;">
                  <strong style="color: #3b82f6;">AKRIX SOLUTIONS</strong> | Professional Digital Solutions
                </div>
                <div style="color: #64748b; font-size: 12px; line-height: 1.5;">
                  This is an automated email from our secure payment system.<br>
                  Please do not reply to this message. For support, contact us at akrix.ai@gmail.com
                </div>
                <div style="color: #475569; font-size: 11px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #334155;">
                  © 2025 Akrix Solutions. All rights reserved.
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        attachments: [
          {
            filename: `Receipt_${receiptNumber}.pdf`,
            content: receiptBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Receipt email sent successfully to ${clientEmail}`);
      return { success: true, message: 'Email sent to client successfully' };
    } catch (error) {
      this.logger.error('Failed to send email to client:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendPaymentNotificationToAkrix(clientName: string, clientEmail: string, amount: number, receiptBuffer: Buffer, receiptNumber: string) {
    try {
      const akrixEmail = this.configService.get('AKRIX_EMAIL', 'akrix@example.com');
      
      const mailOptions = {
        from: this.configService.get('SMTP_USER'),
        to: akrixEmail,
        subject: `💰 New Payment Received - ₹${amount.toLocaleString('en-IN')} from ${clientName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Payment Notification - Akrix Technologies</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 650px; margin: 0 auto; padding: 20px;">

              <!-- Header -->
              <div style="background: linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%); padding: 40px 30px; border-radius: 15px 15px 0 0; text-align: center; position: relative; overflow: hidden;">
                <div style="position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>
                <div style="position: absolute; bottom: -20px; left: -20px; width: 60px; height: 60px; background: rgba(255,255,255,0.1); border-radius: 50%;"></div>

                <div style="position: relative; z-index: 2;">
                  <div style="font-size: 64px; margin-bottom: 10px;">💰</div>
                  <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                    Payment Received!
                  </h1>
                  <p style="color: #a7f3d0; margin: 15px 0 0 0; font-size: 18px; font-weight: 500;">
                    New payment notification for Akrix Solutions
                  </p>
                  <div style="background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 25px; display: inline-block; margin-top: 15px;">
                    <span style="color: white; font-size: 16px; font-weight: 600;">₹${amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <!-- Main Content -->
              <div style="background: white; padding: 40px 30px; border-radius: 0 0 15px 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">

                <!-- Client Information -->
                <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #93c5fd;">
                  <h3 style="color: #1e40af; margin: 0 0 20px 0; font-size: 20px; font-weight: bold; text-align: center;">
                    👤 Client Information
                  </h3>

                  <div style="display: grid; gap: 15px;">
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #3b82f6; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #475569; font-weight: 600;">👤 Client Name</span>
                        <span style="color: #1e40af; font-weight: bold; font-size: 16px;">${clientName}</span>
                      </div>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #475569; font-weight: 600;">📧 Email Address</span>
                        <span style="color: #059669; font-weight: 600;">${clientEmail}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Payment Details -->
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #10b981;">
                  <h3 style="color: #065f46; margin: 0 0 20px 0; font-size: 20px; font-weight: bold; text-align: center;">
                    💳 Payment Details
                  </h3>

                  <div style="display: grid; gap: 12px;">
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #475569; font-weight: 600;">💰 Amount Received</span>
                        <span style="color: #059669; font-weight: bold; font-size: 24px;">₹${amount.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #475569; font-weight: 600;">📄 Receipt Number</span>
                        <span style="color: #d97706; font-weight: bold; font-family: monospace;">${receiptNumber}</span>
                      </div>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #8b5cf6; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #475569; font-weight: 600;">📅 Payment Date</span>
                        <span style="color: #7c3aed; font-weight: 600;">${new Date().toLocaleDateString('en-IN', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                    </div>
                    <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                      <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="color: #475569; font-weight: 600;">⏰ Payment Time</span>
                        <span style="color: #dc2626; font-weight: 600;">${new Date().toLocaleTimeString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
                <!-- Status and Actions -->
                <div style="background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%); padding: 25px; border-radius: 12px; margin: 30px 0; border: 1px solid #10b981; text-align: center;">
                  <div style="font-size: 48px; margin-bottom: 15px;">✅</div>
                  <h4 style="color: #065f46; margin: 0 0 10px 0; font-size: 20px; font-weight: bold;">Payment Successfully Processed</h4>
                  <p style="color: #047857; margin: 0 0 15px 0; font-size: 14px; line-height: 1.5;">
                    The payment has been completed and the receipt has been automatically generated and sent to the client.
                  </p>
                  <div style="background: rgba(255,255,255,0.8); padding: 12px 20px; border-radius: 8px; display: inline-block;">
                    <span style="color: #065f46; font-weight: bold; font-size: 14px;">📄 Receipt Copy Attached</span>
                  </div>
                </div>

                <!-- Action Items -->
                <div style="background: #fef3c7; padding: 20px; border-radius: 12px; margin: 30px 0; border: 1px solid #f59e0b;">
                  <h4 style="color: #92400e; margin: 0 0 15px 0; font-size: 18px; font-weight: bold; text-align: center;">
                    📋 Next Steps
                  </h4>
                  <ul style="color: #78350f; margin: 0; padding-left: 20px; line-height: 1.6;">
                    <li>Client has been sent a confirmation email with receipt</li>
                    <li>Payment has been recorded in the system</li>
                    <li>Receipt copy is attached to this notification</li>
                    <li>Transaction is complete and verified</li>
                  </ul>
                </div>

                <!-- Summary Box -->
                <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 12px; text-align: center; color: white; margin: 30px 0;">
                  <h3 style="color: #10b981; margin: 0 0 15px 0; font-size: 22px; font-weight: bold;">
                    💼 Transaction Summary
                  </h3>
                  <div style="display: flex; justify-content: space-around; flex-wrap: wrap; gap: 20px; margin-top: 20px;">
                    <div style="text-align: center;">
                      <div style="color: #10b981; font-size: 24px; font-weight: bold;">₹${amount.toLocaleString('en-IN')}</div>
                      <div style="color: #94a3b8; font-size: 12px;">Amount</div>
                    </div>
                    <div style="text-align: center;">
                      <div style="color: #3b82f6; font-size: 16px; font-weight: bold;">${clientName}</div>
                      <div style="color: #94a3b8; font-size: 12px;">Client</div>
                    </div>
                    <div style="text-align: center;">
                      <div style="color: #f59e0b; font-size: 14px; font-weight: bold;">${receiptNumber}</div>
                      <div style="color: #94a3b8; font-size: 12px;">Receipt</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div style="background: #059669; padding: 25px; border-radius: 15px; text-align: center; margin-top: 20px;">
                <div style="color: #a7f3d0; font-size: 14px; margin-bottom: 10px;">
                  <strong style="color: white;">AKRIX PAYMENT SYSTEM</strong> | Automated Notification
                </div>
                <div style="color: #6ee7b7; font-size: 12px; line-height: 1.5;">
                  This is an automated notification from your secure payment processing system.<br>
                  Generated at ${new Date().toLocaleString('en-IN')}
                </div>
                <div style="color: #34d399; font-size: 11px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #047857;">
                  © 2025 Akrix Solutions. All rights reserved.
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
        attachments: [
          {
            filename: `Receipt_${receiptNumber}.pdf`,
            content: receiptBuffer,
            contentType: 'application/pdf',
          },
        ],
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Payment notification sent successfully to Akrix (${akrixEmail})`);
      return { success: true, message: 'Notification sent to Akrix successfully' };
    } catch (error) {
      this.logger.error('Failed to send notification to Akrix:', error);
      throw new Error(`Failed to send notification: ${error.message}`);
    }
  }
}
