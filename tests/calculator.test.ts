import { calculateTime } from '../src/calculator';

beforeAll(() => {
    jest.useFakeTimers();
});

afterAll(() => {
    jest.useRealTimers();
});

describe("calculateTime function", () => {
    const multipliers: number[] = [0.1, 0.25, 0.5, 1, 2, 3];
    describe.each(multipliers)(
        "timecycle-multiplier %p",
        (multiplier) => {
            const testCases: any[][] = [
                ["2022-07-16T05:00:00.000Z", "2022-07-16T06:00:00.000Z", 1000], 
                ["2022-07-16 05:00:00 GMT+1", "2022-07-16T06:00:00.000Z", 2000],
                ["2022-07-16T05:00:00.000Z", "2022-07-16 06:00:00 GMT+1", 0],
            ];
            test.each(testCases)(
                "given %p as current time, %p as reference-date, returns multiple of %p",
                (currentTime, referenceDate, base) => {
                    jest.setSystemTime(new Date(currentTime));
                    expect(calculateTime(referenceDate, multiplier)).toEqual(base * multiplier);
                }
            );
        }
    );
});
