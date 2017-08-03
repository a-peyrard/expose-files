#!/usr/bin/env node

import * as express from "express";
import * as fs from "fs";

const DIR_TO_WATCH = "/tmp/private";
const DIR_TO_EXPOSE = "/tmp/public";

const start = new Date()

const app = express();
app.use(express.static(DIR_TO_EXPOSE));

const PORT = 3000;
app.listen(PORT, function () {
    console.log(
        `💻 server started on http://localhost:${PORT} in ${new Date().getTime() - start.getTime()}ms`
    );
});

try {
    fs.watch(DIR_TO_EXPOSE, { recursive: true }, (eventType, fileName) => {
        if (eventType === 'rename')
        console.log(`event type is: ${eventType}`);
        if (fileName) {
            console.log(`fileName provided: ${fileName}`);
        } else {
            console.log('fileName not provided');
        }
    });
} catch (ex) {
    console.error(`unable to watch ${DIR_TO_EXPOSE}!`);
    if (ex.message && ex.message.indexOf("ENOENT")) {
        console.error("-- directory does not exists!");
    }
    process.exit(-1);
}
