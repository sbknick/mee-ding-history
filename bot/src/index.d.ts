
declare type messageCallback = (user: string, userID: string, channelID: string, mesage: string, event: WebSocketEvent) => void;

declare type WebSocketEvent = {
    d: any;
    op: number;
    s: number;
    t: string;
};
