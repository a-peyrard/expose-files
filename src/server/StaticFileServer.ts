import * as Fs from "fs";
import * as Express from "express";
import { isNoFileFound } from "../util/Error";

const OUT = process.stdout;

export default class StaticFileServer {
    public static serve(dirToExpose: string): StaticFileServer {
        return new StaticFileServer(dirToExpose);
    }

    private constructor(private readonly dirToExpose: string) {}

    public start(port: number) {
        const start = new Date();
        Express()
            .get("/:hash/clean", this.handleClean.bind(this))
            .use(Express.static(this.dirToExpose))
            .listen(port, () => {
                OUT.write(
                    `💻  server started on http://localhost:${port} in ${new Date().getTime() - start.getTime()}ms\n`
                );
            });
    }

    handleClean(req: Express.Request, res: Express.Response) {
        const file = req.params.hash;
        if (file) {
            try {
                OUT.write(`-- 🌪  cleaning file ${file}\n`);
                const filePath = `${this.dirToExpose}/${file}`;
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
}

function error404(res: Express.Response) {
    res.status(404);
    res.send("4️⃣0️⃣4️⃣&nbsp;&nbsp;&nbsp;😱");
}

function error500(ex: Error, res: Express.Response) {
    res.status(500);
    res.send(`unknown error: ${ex}`);
}
