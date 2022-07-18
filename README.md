
# Real Time Day Cycle Plugin
Minecraft Bedrock Server with an almost lifelike day/night cycle (requires bdsx)

## Configuration
When the plugin is run, it will try to read (or create if it doesn't yet exist), the `config.json` file, loading all the plugin's configuration.

This file is created relative to the current executing process: `../config/RealTimeDayCycle`.

This executing process is expected to be `bedrock_server` or `bedrock_server.exe` running with bdsx, thus you can expect to find `config/RealTimeDayCycle` relative to the root of bdsx.

The config options are described as follows:

* `recalculation-interval`

    How often (in ms) to calculate the ingame time.

    Setting this too LOW will reduce performance (more recalculations).
    
    Setting this too HIGH will result in "jerkiness" of day/night cycles.

    *Default: `1000` (1 second).*

* `timecycle-multiplier`

    Multiplier to which real days relate to Minecraft days.

    Setting this too low or high will possibly have unexpected effects.

    *Default: `1.0` (1 real day = 1 Minecraft day).*

    *Recommended minimum: `0.10`.*

    *Recommended maximum: `72.0` (minecraft default).*

    Examples:
    * `0.25` means 1 real day = 6 Minecraft hours
    * `0.5` means 1 real day = 12 Minecraft hours
    * `1.0` means 1 real day = 1 Minecraft day
    * `2.0` means 1 real day = 2 Minecraft days
    * `3.0` means 1 real day = 3 Minecraft days

* `reference-date`

    Epoch date which the ingame time will be referenced from.
    
    Since minecraft `24000` is equal to `06:00:00`, it is most realistic to set this to the same time, e.g: `2022-07-16T05:00:00.000Z`

    The day is less relevant, but the daytime will be based on this date.
    
    Setting this too far in the past could have unexpected effects.

    Setting this to a future date could have unexpected effects.

    There are no ill effects of bringing this date closer to the current time even in previous worlds.

    Date parsing is done by built-in JS [`Date`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date) constructor. While you can use any format supported by the Date constructor, but only the documented formats here are officially supported.

    *Default: based on the current date when `config.json` was generated*

    Examples (assuming all other settings are their default):

    | `reference-date`           | Current real time          | Minecraft `daytime`          |
    | -------------------------- | -------------------------- | ---------------------------- |
    | `2022-07-16T05:00:00.000Z` | `2022-07-16T05:00:00.000Z` | `0`                          |
    | `2022-07-16T05:00:00.000Z` | `2022-07-17T05:00:00.000Z` | `24000` (1 Minecraft day)    |
    | `2022-07-16T05:00:00.000Z` | `2022-07-17T00:00:00.000Z` | `18000` (Minecraft midnight) |
    | `2022-07-16T06:00:00.000Z` | `2022-07-16T05:08:00.000Z` | `1000` (1 Minecraft hour)    |
