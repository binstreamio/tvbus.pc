/**
 * TVBUS interface
 */
'use strict';

var path = require("path");
var child_process = require("child_process");
var events = require("events");

// import EventEmitter from 'events';

class TVBus {

    static get version() {
        // replaced with browserify-versionify transform
        return '5.4.0';
    }

    constructor() {
        var observer = this.observer = new events.EventEmitter();
        this.on = observer.on.bind(observer);

        var tvbusbin = 'tvbus';
        if(process.platform == 'win32') {
            tvbusbin = 'tvbus.exe';
        }
        
        var cmd = path.join(__dirname, 'bin', process.platform, tvbusbin);
        var params = [];

        params.push("init");
        params.push("4000");
        params.push("8902");

        this.tvbusProcess = child_process.spawn(cmd, params);

        this.tvbusProcess.stdout.on('data', function(data) {
            var events = data.toString('utf8').trim().split("\n");
            

            for (let event of events) {
                console.log('TVBus.stdout: ==' + event + '==');
                if(event.startsWith("[Inited]")) {
                    observer.emit("init", event.split(":")[1].trim())
                }
                else if(event.startsWith("[Prepared]") && event.endsWith(".m3u8")) {
                    observer.emit("prepared", event.split(" ")[1].trim())
                }
                else if(event.startsWith("[Buffer]")) {
                    observer.emit("buffer", event.split(":")[1].trim())
                }
                else if(event.startsWith("[Stats]")) {
                    observer.emit("stats", event.split(":")[1].trim())
                }
                else if(event.startsWith("[Stop]")) {
                    observer.emit("stop", event.split(":")[1].trim())
                }
                else if(event.startsWith("[Start]")) {
                    observer.emit("start", "")
                } 
                // else {
                //     console.log('TVBus.stdout: ==---' + event + '==');
                // }
            }
        });
        this.tvbusProcess.stderr.on('data', function(data) {
            console.log('stderr: ' + data);
            //Here is where the error output goes
        });
        this.tvbusProcess.on('close', function(code) {
            console.log('closing code: ' + code);
            //Here you can get the exit code of the script
        });
    }

    startChannel(addr, accessCode) {
        if(! this.tvbusProcess) {
            return;
        }

        if(typeof accessCode === 'string' && accessCode.length > 0) {
            this.tvbusProcess.stdin.write("start -c " + accessCode + " " + addr + "\n");
        }
        else {
            this.tvbusProcess.stdin.write("start " + addr + "\n");
        }
    }

    stopChannel() {
        if(! this.tvbusProcess) {
            return;
        }
        this.tvbusProcess.stdin.write("stop\n");
    }

    quit() {
        if(! this.tvbusProcess) {
            return;
        }
        this.tvbusProcess.stdin.write("quit\n");
    }

}


module.exports = TVBus;