export declare class InterestsController {
    getInterests(): {
        id: string;
        title: string;
        emoji: string;
        description: string;
        image_url: any;
    }[];
    healthCheck(): {
        status: string;
        service: string;
        version: string;
    };
}
