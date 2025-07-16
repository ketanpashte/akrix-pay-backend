import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Receipt } from './receipt.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  SUCCESS = 'success', // Temporary for migration
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum PaymentMode {
  CASH = 'cash',
  CARD = 'card',
  UPI = 'upi',
  NET_BANKING = 'net_banking',
  WALLET = 'wallet',
  CHEQUE = 'cheque',
  BANK_TRANSFER = 'bank_transfer'
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMode })
  paymentMode: PaymentMode;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razorpayPaymentId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razorpayOrderId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  razorpaySignature: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  receiptNumber: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.payments)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToOne(() => Receipt, receipt => receipt.payment)
  receipt: Receipt;
}
