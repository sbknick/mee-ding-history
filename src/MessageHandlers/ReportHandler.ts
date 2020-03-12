import { BotContext } from "../Bot";
import { MonitoringService } from "../Services/MonitoringService";


export class ReportHandler {
    constructor(
        private ctx: BotContext
    ) {}

    async report() {
        this.ctx.send.reply("report!");
    }
}