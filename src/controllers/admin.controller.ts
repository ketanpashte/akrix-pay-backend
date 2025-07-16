import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { AdminService } from '../services/admin.service';

@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  async adminLogin(@Body() loginData: { username: string; password: string }) {
    return this.adminService.authenticateAdmin(loginData.username, loginData.password);
  }

  @Get('receipts')
  async getAllReceipts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllReceipts(page, limit, search);
  }

  @Get('payments')
  async getAllPayments(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllPayments(page, limit, status);
  }

  @Get('stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}
