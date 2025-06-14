import { spawn } from "child_process";
import { IJobRunner, IJobProcessorLogger, Metadata } from "../domain/jobProcessorTypes";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCRIPT_PATH = 'job_cpp.sh'

export default class JobRunner implements IJobRunner {
    #logger: IJobProcessorLogger;

    constructor(logger: IJobProcessorLogger) {
        this.#logger = logger;
    }

    async run(jobName: string, args: string[], metadata: Metadata['metadata']): Promise<number> {
        const correlationId = metadata?.correlationId;
        return new Promise((resolve, reject) => {
            this.#logger.debug(`${this.constructor.name}: \t running ${jobName}`, { correlationId });
            const child = spawn(`${__dirname}/${SCRIPT_PATH}`, [jobName, ...args], {
                stdio: 'inherit',
            });

            child.on('error', () => {
                this.#logger.debug(`${this.constructor.name}: \t job ${jobName} completed with unexpected error`, { correlationId });
                reject();
            });

            child.on('exit', code => {
                this.#logger.debug(`${this.constructor.name}: \t job ${jobName} completed`, { correlationId });
                if (code === 0) {
                    resolve(0)
                } else if (code === 1) {
                    resolve(1)
                } else {
                    resolve(2)
                }
            });
        });
    }
}