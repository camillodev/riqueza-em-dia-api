import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  UseInterceptors,
  Request
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { ReportsService } from '../../services/reports/reports.service';
import {
  summaryReportSchema,
  incomeVsExpenseSchema,
  byCategorySchema,
  monthlyDataSchema,
  SummaryReportDto,
  IncomeVsExpenseDto,
  ByCategoryDto,
  MonthlyDataDto
} from '../../schemas/report.schema';
import {
  SummaryReportResponseDto,
  ChartItemDto,
  MonthlyDataItemDto
} from '../../dtos/report-response.dto';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  private readonly logger = new Logger(ReportsController.name);

  constructor(private readonly reportsService: ReportsService) { }

  @Get('summary')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get financial summary for dashboard' })
  @ApiQuery({ name: 'month', required: false, type: String, description: 'Month in format YYYY-MM' })
  @ApiResponse({
    status: 200,
    description: 'Returns financial summary data. Note: all monetary values are in cents (integer)',
    type: SummaryReportResponseDto,
  })
  async getSummary(
    @Request() req,
    @Query(new ZodValidationPipe(summaryReportSchema)) query: SummaryReportDto,
  ): Promise<SummaryReportResponseDto> {
    this.logger.log(`GET financial summary for user ${req.user.id}`);
    return this.reportsService.getSummary(req.user.id, query.month);
  }

  @Get('charts/income-vs-expense')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get income vs expense chart data' })
  @ApiQuery({ name: 'month', required: false, type: String, description: 'Month in format YYYY-MM' })
  @ApiResponse({
    status: 200,
    description: 'Returns data for income vs expense chart. Note: values are in cents (integer)',
    type: [ChartItemDto],
  })
  async getIncomeVsExpense(
    @Request() req,
    @Query(new ZodValidationPipe(incomeVsExpenseSchema)) query: IncomeVsExpenseDto,
  ): Promise<ChartItemDto[]> {
    this.logger.log(`GET income vs expense data for user ${req.user.id}`);
    return this.reportsService.getIncomeVsExpense(req.user.id, query.month);
  }

  @Get('charts/by-category')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get transactions by category chart data' })
  @ApiQuery({ name: 'month', required: false, type: String, description: 'Month in format YYYY-MM' })
  @ApiQuery({ name: 'type', required: true, enum: ['income', 'expense'], description: 'Transaction type' })
  @ApiResponse({
    status: 200,
    description: 'Returns data for category chart. Note: values are in cents (integer)',
    type: [ChartItemDto],
  })
  async getByCategory(
    @Request() req,
    @Query(new ZodValidationPipe(byCategorySchema)) query: ByCategoryDto,
  ): Promise<ChartItemDto[]> {
    this.logger.log(`GET transactions by category for user ${req.user.id}`);
    return this.reportsService.getByCategory(req.user.id, query.type, query.month);
  }

  @Get('charts/monthly-data')
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: 'Get monthly data for time-series chart' })
  @ApiQuery({ name: 'month', required: false, type: String, description: 'End month in format YYYY-MM' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Group by days' })
  @ApiResponse({
    status: 200,
    description: 'Returns monthly time-series data. Note: values are in cents (integer)',
    type: [MonthlyDataItemDto],
  })
  async getMonthlyData(
    @Request() req,
    @Query(new ZodValidationPipe(monthlyDataSchema)) query: MonthlyDataDto,
  ): Promise<MonthlyDataItemDto[]> {
    this.logger.log(`GET monthly data for user ${req.user.id}`);
    return this.reportsService.getMonthlyData(req.user.id, query.month, query.days);
  }
}
