import { GamificationService } from './gamification.service';
declare class AwardXpDto {
    user_id: string;
    action: string;
}
export declare class GamificationController {
    private readonly gamificationService;
    constructor(gamificationService: GamificationService);
    getProfile(user_id: string): Promise<object>;
    awardXP(body: AwardXpDto): Promise<object>;
    getXpRewards(): object;
    getBadges(): object[];
}
export {};
