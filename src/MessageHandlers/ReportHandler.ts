import { BotContext } from "../Bot";
import { MonitoringService } from "../Services/MonitoringService";


export class ReportHandler {
    constructor(
        private ctx: BotContext
    ) {}

    async report() {
        const report = MonitoringService.generateReport();
        this.ctx.send.reply(report);
    }

    async clear(args: string[]) {
        MonitoringService.clear(args);
        this.ctx.send.reply("Cleared.");
    }
}