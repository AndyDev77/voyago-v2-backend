import { CommunityService } from './community.service';
export declare class CommunityController {
    private readonly communityService;
    constructor(communityService: CommunityService);
    getPublicFeed(): Promise<object[]>;
    getUserPublicProfile(id: string): Promise<object>;
}
