import { ConfigService } from '@nestjs/config';
import { ProService } from '../pro/pro.service';
export declare class WebhooksService {
    private readonly configService;
    private readonly proService;
    private stripe;
    private webhookSecret;
    constructor(configService: ConfigService, proService: ProService);
    handleStripeWebhook(rawBody: Buffer, signature: string): Promise<{
        received: boolean;
    }>;
}
