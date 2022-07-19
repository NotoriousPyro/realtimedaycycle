/*
    These should probably never be changed. Unexpected things may happen.

    BASE_DAY_LENGTH is the Minecraft daytime ticks: 24000.
    REAL_MS_IN_DAY is the real miliseconds in a day: 86400000.
*/
const BASE_DAY_LENGTH = 24000;
const REAL_MS_IN_DAY = 86400000;

export async function calculateTime(referenceDate: string, timecycleMultiplier: number): Promise<number> {
    const delta = Math.abs(new Date()[Symbol.toPrimitive]('number') - new Date(referenceDate)[Symbol.toPrimitive]('number'));
    return Math.abs(((delta / REAL_MS_IN_DAY) * BASE_DAY_LENGTH) * timecycleMultiplier) | 0;
}
