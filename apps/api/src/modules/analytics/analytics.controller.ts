import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Tenant } from '../../common/decorators.js';
import type { TenantContext } from '../../common/types.js';
import { DaysQueryDto, TopProductsQueryDto } from './analytics.dto.js';
import { AnalyticsService } from './analytics.service.js';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview(@Tenant() tenant: TenantContext, @Query() query: DaysQueryDto) {
    return this.analytics.overview(tenant, query.days);
  }

  @Get('sales-chart')
  salesChart(@Tenant() tenant: TenantContext, @Query() query: DaysQueryDto) {
    return this.analytics.salesChart(tenant, query.days);
  }

  @Get('top-products')
  topProducts(
    @Tenant() tenant: TenantContext,
    @Query() query: TopProductsQueryDto,
  ) {
    return this.analytics.topProducts(tenant, query.days, query.limit);
  }

  @Get('revenue-by-category')
  revenueByCategory(
    @Tenant() tenant: TenantContext,
    @Query() query: DaysQueryDto,
  ) {
    return this.analytics.revenueByCategory(tenant, query.days);
  }
}
