import { ProService } from './pro.service';
declare class CreateCheckoutDto {
    tier: string;
}
export declare class ProController {
    private readonly proService;
    constructor(proService: ProService);
    getTiers(): object[];
    createCheckout(user: any, body: CreateCheckoutDto): Promise<{
        checkout_url: string;
        session_id: string;
    }>;
    pollStatus(session_id: string): Promise<{
        status: string;
        payment_status: string;
        applied: boolean;
    }>;
    getProStatus(user: any): Promise<object>;
}
export {};
