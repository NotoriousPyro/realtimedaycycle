
import { events } from 'bdsx/event';
import { bedrockServer } from 'bdsx/launcher';
import { GameRuleId } from 'bdsx/bds/gamerules';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/*
    These should probably never be changed. Unexpected things may happen.

    BASE_DAY_LENGTH is the Minecraft daytime ticks: 24000.
    REAL_MS_IN_DAY is the real miliseconds in a day: 86400000.
*/
const BASE_DAY_LENGTH = 24000;
const REAL_MS_IN_DAY = 86400000;

const pName = "NotoriousPyro's Real Time Day Cycle Plugin";
const logger = (message: string) => console.log('[plugin:'+pName+'] ' + message);

class Options {
    'enabled' = true;
    'recalculation-interval' = 1000;
    'timecycle-multiplier' = 1.0;
    'reference-date' = new Date().toISOString();
}
export class Config {
    options: Options
    private lock: boolean
    private readonly rootConfigPath: string = join(process.cwd(), '..', 'config')
    private readonly configPath: string = join(this.rootConfigPath, 'RealTimeDayCycle')
    private readonly filename: string = join(this.configPath, 'config.json')

    constructor() {
        this.existsOrMkdir(this.rootConfigPath);
        this.existsOrMkdir(this.configPath);
        logger('Loading config from ' + this.filename);
        this.load();
    }

    private existsOrMkdir(path: string) {
        if (!existsSync(path)) mkdirSync(path);
    }

    private load(): void {
        try {
            this.options = JSON.parse(readFileSync(this.filename, 'utf8'));
            const optionsModel = new Options;
            let modified = false;
            for (const prop in optionsModel) {
                if (!this.options.hasOwnProperty(prop)) {
                    (this.options as any)[prop] = (optionsModel as any)[prop];
                    modified = true;
                }
            }
            if (modified) this.save();
        } catch {
            if (!this.options) {
                this.options = new Options;
                this.save();
            }
        }
    }

    private save(): void {
        const SAVE_RETRY = setInterval(() => this.save(), 5000);
        if (this.lock) {
            logger(this.filename + ' is currently locked. Will retry in 5 seconds.');
            return;
        }
        clearInterval(SAVE_RETRY);
        this.lock = true;
        try {
            writeFileSync(this.filename, JSON.stringify(this.options, null, ' '));
        }
        catch {}
        finally {
            this.lock = false;
        }
    }
}

const calculateTime = () => {
    const delta = Math.abs(new Date()[Symbol.toPrimitive]('number') - new Date(config.options['reference-date'])[Symbol.toPrimitive]('number'));
    return Math.abs(((delta / REAL_MS_IN_DAY) * BASE_DAY_LENGTH) * config.options['timecycle-multiplier']) | 0;
}

const config = new Config();

// We only want to register an interval once, when the level starts ticking over.
events.levelTick.once(() => {
    if (!config.options.enabled) {
        logger('Not starting because the mod currently is disabled by configuration file.')
        return;
    }
    logger('Starting up.');
    const SET_TIME_INTERVAL = setInterval(() => bedrockServer.level.setTime(calculateTime()), config.options['recalculation-interval']);
    events.serverStop.on(() => {
        logger('Shutting down.');
        clearInterval(SET_TIME_INTERVAL); // without this code, bdsx does not end even after BDS closed
    });
});

events.serverOpen.on(() => {
    logger('Disabling built-in daylight cycle.');
    bedrockServer.gameRules.setRule(GameRuleId.DoDaylightCycle, false);
});
