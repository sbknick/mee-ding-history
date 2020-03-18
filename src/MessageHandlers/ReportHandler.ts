import { BotContext } from "../Bot";
import { MonitoringService } from "../Services/MonitoringService";


export class ReportHandler {
    constructor(
        private ctx: BotContext
    ) {}

    async report() {
        const report = MonitoringService.generateReport();
        await this.ctx.send.batchReply(report);
    }

    async clear(args: string[]) {
        MonitoringService.clear(args);
        await this.ctx.send.reply("Cleared.");
    }
}