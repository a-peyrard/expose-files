export function isNoFileFound(ex: Error): boolean {
    return !!(ex.message && ex.message.indexOf("ENOENT") !== -1);
}
