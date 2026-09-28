import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, createConnection } from 'mongoose';
import { DEFAULT_TENANT_ID } from '../common/constants';

@Injectable()
export class TenancyService implements OnModuleDestroy {
  private readonly connectionMap: Map<string, Connection> = new Map();
  private readonly logger = new Logger(TenancyService.name);

  constructor(private readonly configService: ConfigService) {}

  async getTenantConnection(tenantId: string = DEFAULT_TENANT_ID): Promise<Connection> {
    const cleanTenantId = (tenantId || DEFAULT_TENANT_ID).replace(/[^a-zA-Z0-9_-]/g, '');

    // 1. Return cached connection if already open and ready
    if (this.connectionMap.has(cleanTenantId)) {
      const existingConnection = this.connectionMap.get(cleanTenantId);
      if (existingConnection && existingConnection.readyState === 1) {
        return existingConnection;
      }
    }

    // 2. Construct tenant URI
    const uri = this.getTenantUri(cleanTenantId);
    this.logger.log(`Creating database connection for tenant: ${cleanTenantId}`);

    // 3. Create connection
    const connection = createConnection(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });

    // 4. Cache it
    this.connectionMap.set(cleanTenantId, connection);

    return connection;
  }

  private getTenantUri(tenantId: string): string {
    const tenantBaseUri =
      this.configService.get<string>('MONGO_URI_TENANT') ||
      this.configService.get<string>('MONGO_URI_GLOBAL') ||
      this.configService.get<string>('MONGO_URL', 'mongodb://localhost:27017/voyago_tenants');

    if (tenantId === DEFAULT_TENANT_ID && this.configService.get<string>('MONGO_URI_TENANT')) {
      return this.configService.get<string>('MONGO_URI_TENANT')!;
    }

    // Replace dbName in MongoDB URI: .../dbname?options -> .../voyago_tenant_{tenantId}?options
    const dbNameIndex = tenantBaseUri.lastIndexOf('/');
    const queryIndex = tenantBaseUri.indexOf('?');

    if (dbNameIndex === -1) {
      return `${tenantBaseUri}/voyago_tenant_${tenantId}`;
    }

    const prefix = tenantBaseUri.substring(0, dbNameIndex + 1);
    const suffix = queryIndex !== -1 ? tenantBaseUri.substring(queryIndex) : '';

    return `${prefix}voyago_tenant_${tenantId}${suffix}`;
  }

  async onModuleDestroy() {
    this.logger.log('Closing all tenant database connections...');
    await Promise.all(
      Array.from(this.connectionMap.values()).map(async (c) => {
        try {
          await c.close();
        } catch (err) {
          this.logger.error(`Error closing tenant connection: ${err}`);
        }
      }),
    );
  }
}
