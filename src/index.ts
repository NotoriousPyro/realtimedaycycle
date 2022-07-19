import { events } from 'bdsx/event';
import { bedrockServer } from 'bdsx/launcher';
import { GameRuleId } from 'bdsx/bds/gamerules';
import { calculateTime } from './calculator';
import { ConfigMgr, Options } from './config';
import { getLevelName } from './bdsHelper';

const pName = "NotoriousPyro's Real Time Day Cycle Plugin";
const logger = (message: string) => console.log('[plugin:'+pName+'] ' + message);

interface RealTimeDayCycleOptions extends Options {
    'timecycle-multiplier': number
    'reference-date': string
}
class RealTimeDayCycleOptions extends Options {
    'timecycle-multiplier' = 1.0;
    'reference-date' = new Date().toISOString();
}

interface LevelRealTimeDayCycleOptions extends RealTimeDayCycleOptions {
    'name': string
}
class LevelRealTimeDayCycleOptions extends RealTimeDayCycleOptions {
    constructor(name: string) {
        super();
        this.name = name;
    }
}

interface RealTimeDayCycleRootOptions extends RealTimeDayCycleOptions {
    'recalculation-interval': number;
    'config-per-level': boolean;
    'level-config': Array<LevelRealTimeDayCycleOptions>;
}
class RealTimeDayCycleRootOptions extends RealTimeDayCycleOptions {
    'recalculation-interval' = 1000;
    'config-per-level' = false;
    'level-config' = new Array<LevelRealTimeDayCycleOptions>;
}

const config = new ConfigMgr(RealTimeDayCycleRootOptions, 'RealTimeDayCycle', logger);

// We only want to register an interval once, when the level starts ticking over.
events.levelTick.once(async () => {
    logger('Starting up.');
    logger('Setting gamerule dodaylightcycle to false.');
    bedrockServer.gameRules.setRule(GameRuleId.DoDaylightCycle, false);
    let levelConfigIndex: number;
    // Can't be changed while running.
    const configPerLevel = config.options['config-per-level'];
    if (configPerLevel === true) {
        const levelName = getLevelName();
        levelConfigIndex = config.options['level-config'].findIndex(async (options) => {return options.name == await levelName});
        if (levelConfigIndex === -1) {
            levelConfigIndex = config.options['level-config'].push(new LevelRealTimeDayCycleOptions(await levelName))-1;
            await config.save();
        }
    }
    const RECALCULATION_INTERVAL = setInterval(
        async () => {
            if (config.options.enabled === false) {
                return;
            }
            let referenceDate: string = config.options['reference-date'];
            let timecycleMultiplier: number = config.options['timecycle-multiplier'];
            if (configPerLevel === true) {
                const levelOptions = config.options['level-config'][levelConfigIndex];
                if (levelOptions.enabled == false) {
                    return;
                }
                referenceDate = levelOptions['reference-date'];
                timecycleMultiplier = levelOptions['timecycle-multiplier'];
            }
            const date = calculateTime(referenceDate, timecycleMultiplier);
            bedrockServer.level.setTime(await date);
        },
        config.options['recalculation-interval']
    );
    events.serverStop.once(async () => {
        logger('Shutting down.');
        clearInterval(RECALCULATION_INTERVAL); // without this code, bdsx does not end even after BDS closed
    });
});
