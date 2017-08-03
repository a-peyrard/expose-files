#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const fs = require("fs");
const start = new Date();
const app = express();
app.use(express.static('/tmp/public'));
const PORT = 3000;
app.listen(PORT, function () {
    console.log(`💻 server started on http://localhost:${PORT} in ${new Date().getTime() - start.getTime()}ms`);
});
const dir = "/tmp/private";
try {
    fs.watch(dir, { recursive: true }, (eventType, fileName) => {
        console.log(`event type is: ${eventType}`);
        if (fileName) {
            console.log(`fileName provided: ${fileName}`);
        }
        else {
            console.log('fileName not provided');
        }
    });
}
catch (ex) {
    console.error(`unable to watch ${dir}!`);
    if (ex.message && ex.message.indexOf("ENOENT")) {
        console.error("-- directory does not exists!");
    }
    process.exit(-1);
}
console.log('hello world!!!');
//# sourceMappingURL=index.js.map