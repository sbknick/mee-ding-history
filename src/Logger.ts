// import * as winston from "winston"

// class Logger {
//     configure() {
//         winston.remove(winston.transports.Console);
//         winston.createLogger({
//             level: 'debug',
//         }).add(new winston.transports.Console());
//     }

//     error = winston.error;
//     info = winston.info;
// }

class Logger {
    configure() {}

    error = console.error;
    info = console.log;
}

export const logger = new Logger();