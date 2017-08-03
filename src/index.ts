#!/usr/bin/env node

import * as Express from "express";
import * as Fs from "fs";
import * as Path from "path";
import * as Crypto from "crypto";

const DIR_TO_WATCH = "/tmp/private";
const DIR_TO_EXPOSE = "/tmp/public";
const HOSTNAME = "localhost";
const PORT = 3000;

const OUT = process.stdout;
const ERROR = process.stderr;

function exposeNewFile(path: string) {
    const hash = hashFile(path);
    const destination = `${DIR_TO_EXPOSE}/${hash}`;
    Fs.symlink(path, destination, () => {
        notifyNewExposedFile(destination);
    })
}

function hashFile(path: string): string {
    return Crypto.createHash("md5")
        .update(path)
        .digest("hex");
}

function notifyNewExposedFile(path: string) {
    const relativePath = Path.relative(DIR_TO_EXPOSE, path);
    OUT.write(`-- 🍫  new file available: http://${HOSTNAME}:${PORT}/${relativePath}\n`);
}

function handleClean(req: Express.Request, res: Express.Response) {
    const file = req.params.hash;
    if (file) {
        try {
            OUT.write(`-- 🌪  cleaning file ${file}\n`);
            const filePath = `${DIR_TO_EXPOSE}/${file}`;
            Fs.unlinkSync(filePath);
            res.send(`🌪&nbsp;&nbsp;file ${file} successfully deleted!`);
        } catch (ex) {
            if (isNoFileFound(ex)) {
                error404(res);
            } else {
                error500(ex, res);
            }
        }
        return;
    }
    // can't reach this!
    res.status(418);
    res.send("☕&nbsp;&nbsp;Do you want some covfefe?");
}

function isNoFileFound(ex: Error): boolean {
    return !!(ex.message && ex.message.indexOf("ENOENT") !== -1);
}

function error404(res: Express.Response) {
    res.status(404);
    res.send("4️⃣0️⃣4️⃣&nbsp;&nbsp;&nbsp;😱");
}

function error500(ex: Error, res: Express.Response) {
    res.status(500);
    res.send(`unknown error: ${ex}`);
}

/*
    ---- Start watcher to watch new file
 */
try {
    OUT.write(`👓  watching ${DIR_TO_WATCH}\n`);
    Fs.watch(DIR_TO_WATCH, { recursive: true }, (eventType, fileName) => {
        if (eventType === 'rename') {
            exposeNewFile(`${DIR_TO_WATCH}/${fileName}`);
        }
    });
} catch (ex) {
    ERROR.write(`unable to watch ${DIR_TO_WATCH}!\n`);
    if (isNoFileFound(ex)) {
        ERROR.write("-- directory does not exists!");
    }
    process.exit(-1);
}

/*
    ---- Start express to expose files
 */
const start = new Date();
Express()
    .get("/:hash/clean", handleClean)
    .use(Express.static(DIR_TO_EXPOSE))
    .listen(PORT, () => {
        OUT.write(
            `💻  server started on http://localhost:${PORT} in ${new Date().getTime() - start.getTime()}ms\n`
        );
    });
