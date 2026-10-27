import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DaysQueryDto, TopProductsQueryDto } from './analytics.dto.js';
import { AnalyticsService } from './analytics.service.js';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview(@Query() query: DaysQueryDto) {
    return this.analytics.overview(query.days);
  }

  @Get('sales-chart')
  salesChart(@Query() query: DaysQueryDto) {
    return this.analytics.salesChart(query.days);
  }

  @Get('top-products')
  topProducts(@Query() query: TopProductsQueryDto) {
    return this.analytics.topProducts(query.days, query.limit);
  }

  @Get('revenue-by-category')
  revenueByCategory(@Query() query: DaysQueryDto) {
    return this.analytics.revenueByCategory(query.days);
  }
}
