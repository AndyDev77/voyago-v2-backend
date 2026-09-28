import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Connection, createConnection, Schema, Model } from 'mongoose';
import * as crypto from 'crypto';
import { DEFAULT_TENANT_ID } from '../common/constants';

@Injectable()
export class TenancyService implements OnModuleDestroy {
  private readonly connectionMap: Map<string, Connection> = new Map();
  private readonly logger = new Logger(TenancyService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Convert a tenantId (which may be a long UUID like "user_4db3097e-6b7c-4fe9-a6bb-56475d700cc1")
   * into a short, MongoDB-safe database name.
   *
   * Result: "t_<first16HexOfMD5>" → always 18 chars (well under MongoDB's 38-byte limit).
   * The mapping is deterministic — same tenantId always produces the same DB name.
   */
  private toDbName(tenantId: string): string {
    const hash = crypto.createHash('md5').update(tenantId).digest('hex');
    return `t_${hash.substring(0, 16)}`;
  }

  /**
   * Get or create a Mongoose connection for a specific tenant (user).
   * Each tenant maps to its own database: t_<hash>
   */
  async getTenantConnection(tenantId: string = DEFAULT_TENANT_ID): Promise<Connection> {
    const cleanTenantId = (tenantId || DEFAULT_TENANT_ID).replace(/[^a-zA-Z0-9_-]/g, '');

    // 1. Return cached connection if already open and ready
    if (this.connectionMap.has(cleanTenantId)) {
      const existingConnection = this.connectionMap.get(cleanTenantId);
      if (existingConnection && existingConnection.readyState === 1) {
        return existingConnection;
      }
      // Remove stale connection
      if (existingConnection) {
        this.connectionMap.delete(cleanTenantId);
      }
    }

    // 2. Construct tenant URI
    const uri = this.getTenantUri(cleanTenantId);
    const dbName = this.toDbName(cleanTenantId);
    this.logger.log(`Creating database connection for tenant: ${cleanTenantId} → db: ${dbName}`);

    // 3. Create connection
    const connection = createConnection(uri, {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    });

    // 4. Cache it
    this.connectionMap.set(cleanTenantId, connection);

    return connection;
  }

  /**
   * Get a Mongoose Model bound to the tenant's own database.
   * This is the main API for services to read/write per-user data.
   *
   * Usage:
   *   const TripModel = await this.tenancyService.getTenantModel(userId, 'Trip', TripSchema);
   *   const trips = await TripModel.find({ user_id: userId });
   */
  async getTenantModel<T>(
    tenantId: string,
    modelName: string,
    schema: Schema,
  ): Promise<Model<T>> {
    const connection = await this.getTenantConnection(tenantId);

    // Reuse existing model on this connection if already registered
    if (connection.models[modelName]) {
      return connection.models[modelName] as Model<T>;
    }

    return connection.model<T>(modelName, schema);
  }

  private getTenantUri(tenantId: string): string {
    const tenantBaseUri =
      this.configService.get<string>('MONGO_URI_TENANT') ||
      this.configService.get<string>('MONGO_URI_GLOBAL') ||
      this.configService.get<string>('MONGO_URL', 'mongodb://localhost:27017/voyago_tenants');

    if (tenantId === DEFAULT_TENANT_ID && this.configService.get<string>('MONGO_URI_TENANT')) {
      return this.configService.get<string>('MONGO_URI_TENANT')!;
    }

    // Use short hash-based DB name to stay under MongoDB's 38-byte limit
    const dbName = this.toDbName(tenantId);

    // Replace dbName in MongoDB URI: .../dbname?options -> .../<dbName>?options
    const dbNameIndex = tenantBaseUri.lastIndexOf('/');
    const queryIndex = tenantBaseUri.indexOf('?');

    if (dbNameIndex === -1) {
      return `${tenantBaseUri}/${dbName}`;
    }

    const prefix = tenantBaseUri.substring(0, dbNameIndex + 1);
    const suffix = queryIndex !== -1 ? tenantBaseUri.substring(queryIndex) : '';

    return `${prefix}${dbName}${suffix}`;
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
