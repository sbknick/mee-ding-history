declare type message = {
    user: string,
    userID: string,
    channelID: string,
    message: string,
    event: WebSocketEvent
}

declare type messageCallback = (user: string, userID: string, channelID: string, message: string, event: WebSocketEvent) => void;

declare type WebSocketEvent = {
    d: any;
    op: number;
    s: number;
    t: string;
};
