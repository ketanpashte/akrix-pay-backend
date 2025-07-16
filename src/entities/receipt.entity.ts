import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Payment } from './payment.entity';

@Entity('receipts')
export class Receipt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  paymentId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  receiptNumber: string;

  @CreateDateColumn()
  generatedAt: Date;

  @OneToOne(() => Payment, payment => payment.receipt)
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;
}
