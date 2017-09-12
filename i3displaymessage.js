#!/usr/bin/env node

/* global require, process, setTimeout, setInterval */

const path = require('path');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

var dir = argv.dir || path.join(process.env.HOME, ".i3displaymessage");
try {
    fs.mkdirSync(dir);
} catch (err) {
}

fs.readdir(dir, (err, files) => {
    // console.log(err, files);
    if (err) {
        console.err(err.toString());
    } else {
        for (var file of files) {
            fs.unlinkSync(path.join(dir, file));
            // console.log(file);
        }
        var messages = {};
        var idx = 0;
        function redisplay()
        {
            var out = [];
            for (var key in messages) {
                out.push(messages[key]);
            }

            out.push({ full_text: (new Date()).toString(), color: "#00FF00" });
            console.log(',' + JSON.stringify(out));
        }
        setInterval(redisplay, 1000);

        console.log('{"version":1}');
        console.log('[[]');
        redisplay();

        fs.watch(dir, (eventType, filename) => {
            // console.error("Got event", eventType, filename);
            if (eventType == 'change' && filename[0] != '.') {
                var f = path.join(dir, filename);
                fs.readFile(f, "utf8", (err, data) => {
                    if (err)
                        throw err;
                    var message = { markup: 'none' }, timeout;
                    try {
                        var json = JSON.parse(data);
                        // console.log("typeof", typeof json);
                        if (typeof json !== 'object') {
                            message.full_text = "" + json;
                        } else {
                            message.full_text = json.message;
                            if (json.color)
                                message.color = json.color;
                            timeout = json.timeout || 5;
                        }
                    } catch (err) {
                        message.full_text = data;
                        timeout = 5;
                    }
                    // console.error(data, json);
                    if (message.full_text)
                        message.full_text = message.full_text.replace(/\n/g, " ");
                    // console.log("shit", f, "a", message, "b", data, "c", timeout);
                    if (!argv["no-unlink"])
                        fs.unlink(f);
                    if (message.full_text) {
                        var id = ++idx;
                        messages[id] = message;
                        redisplay();
                        setTimeout(() => {
                            delete messages[id];
                            redisplay();
                        }, timeout * 1000);
                    }
                });
            }
            // console.log(eventType, filename);
            // could be either 'rename' or 'change'. new file event and delete
            // also generally emit 'rename'
            // console.log(filename);
        });
    }
});

// console.log(dir);



