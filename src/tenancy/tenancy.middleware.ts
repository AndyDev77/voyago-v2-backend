import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { DEFAULT_TENANT_ID } from '../common/constants';

@Injectable()
export class TenancyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    let resolvedTenantId: string | undefined;

    // 1. Check x-tenant-id header (sent by frontend after auth)
    const headerTenantId = req.headers['x-tenant-id']?.toString();
    if (headerTenantId && headerTenantId.trim().length > 0) {
      resolvedTenantId = headerTenantId.trim();
    }

    // 2. Check query parameter ?tenantId=...
    if (!resolvedTenantId && req.query?.tenantId) {
      resolvedTenantId = req.query.tenantId.toString().trim();
    }

    // 3. Fallback to default tenant (will be overridden by SessionAuthGuard for authenticated routes)
    if (!resolvedTenantId) {
      resolvedTenantId = DEFAULT_TENANT_ID;
    }

    req['tenantId'] = resolvedTenantId;
    if (!req['user']) {
      req['user'] = { tenant_id: resolvedTenantId };
    } else if (!req['user'].tenant_id) {
      req['user'].tenant_id = resolvedTenantId;
    }

    next();
  }
}
