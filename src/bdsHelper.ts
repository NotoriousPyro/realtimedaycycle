import { fsutil } from 'bdsx/fsutil';

export async function getLevelName(): Promise<string> {
    try {
        const data = fsutil.readFile(`${process.cwd()}/server.properties`);
        const reg = /^level-name=(.+)/gim;
        const matches = ((await data).match(reg) || []).map((e) => e.replace(reg, "$1"));
        return matches ? matches[0].trim() : "Unknown";
    } catch (err) {
        console.log(`Failed to read ${process.cwd()}/server.properties ${err}`);
        return "Unknown";
    }
}
