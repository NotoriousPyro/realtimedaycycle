import { events } from 'bdsx/event';
import { fsutil } from 'bdsx/fsutil';
import { existsSync, mkdirSync, stat } from 'fs';
import { join } from 'path';
import AsyncLock from 'async-lock'

export class Options {
    'enabled' = true;
}

export interface Options {
    'enabled': boolean
}

export class ConfigMgr<T extends Options> {
    private readonly rootConfigPath: string = join(process.cwd(), '..', 'config');
    options: T;
    private modName: string;
    private configPath: string;
    private fileName: string;
    private logger: CallableFunction;
    private modifiedTime: number;
    private lock = new AsyncLock();

    constructor
    (
        type: {new(...args : any[]): T ;},
        modName: string,
        logger: CallableFunction,
        fileName: string = 'config.json',
    ) {
        this.modName = modName;
        this.logger = logger;
        this.configPath = join(this.rootConfigPath, this.modName);
        fileName = !fileName.endsWith('.json') ? fileName + '.json' : fileName;
        this.fileName = join(this.configPath, fileName);
        this.existsOrMkdir(this.rootConfigPath);
        this.existsOrMkdir(this.configPath);
        this.logger('Loading config from ' + this.fileName);
        this.load<T>(type);
        this.watch();
    }

    /** Create the directory if it doesn't exist. */
    private existsOrMkdir(path: string): void {
        if (!existsSync(path)) {
            mkdirSync(path);
        }
    }

    /** Loads the intial configuration or creates it if it doesn't exist. */
    private async load<T extends Options>(type: {new(...args : any[]): T ;}): Promise<void> {
        try {
            this.options = JSON.parse(await fsutil.readFile(this.fileName));
            const optionsModel = new type;
            let modified = false;
            for (const prop in optionsModel) {
                if (!this.options.hasOwnProperty(prop)) {
                    (this.options as any)[prop] = (optionsModel as any)[prop];
                    modified = true;
                }
            }
            if (modified) {
                await this.save();
            }
        } catch {
            if (!this.options) {
                (this.options as any) = new type;
                await this.save();
            }
        }
        stat(this.fileName, (err, stats) => {
            if (err !== null) {
                throw err;
            }
            this.modifiedTime = stats.mtimeMs;
        })
    }

    private checkModified(): Promise<boolean>{
        return new Promise((resolve, reject)=>{
            stat(this.fileName, (err, ostat)=>{
                if (err !== null) {
                    reject(err);
                } else {
                    const modified = ostat.mtimeMs > this.modifiedTime;
                    if (modified) {
                        this.modifiedTime = ostat.mtimeMs;
                    }
                    resolve(modified);
                }
            });
        });
    }

    private watch(): void {
        events.serverOpen.once(() => {
            events.serverClose.once(() => {
                clearInterval(watchInterval);
            })
            const watchInterval = setInterval(() => this.reload(), 10000);
        });
    }

    /** Reloads configuration from disk if it has changed. */
    private async reload(): Promise<void> {
        this.lock.acquire(this.fileName, async () => {
            this.checkModified().then(async (modified) => {
                if (modified) {
                    const fileData = fsutil.readFile(this.fileName, 'utf8');
                    const newOptions = JSON.parse(await fileData);
                    for (const prop in this.options) {
                        if (newOptions.hasOwnProperty(prop)) {
                            const key = Object.keys(this.options).indexOf(prop);
                            const oldVal = Object.values(this.options)[key];
                            const newVal = Object.values(newOptions)[key];
                            if (oldVal !== newVal) {
                                (this.options as any)[prop] = newVal;
                            }
                        }
                    }
                }
            });
        }).catch((err) => {
            this.logger(err);
        });
    }

    /** Saves configuration to disk. */
    public async save(): Promise<void> {
        try {
            this.lock.acquire(this.fileName, async () => {
                await fsutil.writeFile(this.fileName, JSON.stringify(this.options, null, '    '))
            }).catch((err) => {
                this.logger(err);
            });
        } catch {}
    }
}
