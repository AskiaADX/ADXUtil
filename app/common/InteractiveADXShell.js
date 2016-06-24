var childProcess = require('child_process');
var path         = require('path');
var common       = require('./common.js');


/**
 * Manage the ADXShell process in interactive mode.
 *
 * It allow a single instance creation of the ADXShell
 * and a bi-directional communication using the stdio of the spawn process
 *
 * @class InteractiveADXShell
 * @private
 */
function InteractiveADXShell(dir, options) {
    this.path = dir;
    this.mode = 'interactive';
    if (options) {
        if (options.mode) {
            if (options.mode !== 'interactive' && options.mode !== 'interview') {
                throw new Error("Expected the interactive ADX shell mode to be `interactive` or `interview`");
            }
            this.mode = options.mode;
        }
    }
}

/**
 * Create an interactive spawn process with the ADXShell
 *
 * @constructor
 * @param {String} dir Path of the ADX directory
 * @param {Object} [options] Options
 * @param {"interactive"|"interview"} [options.mode='interactive'] Interactive mode
 */
InteractiveADXShell.prototype.constructor = InteractiveADXShell;


/**
 * Send the specified command in the ADXShell process
 *
 * @param {String} command Command to execute
 * @param {Function} callback
 */
InteractiveADXShell.prototype.exec = function exec(command, callback) {
    var self = this;
    var message = [],
        errorMessage = [],
        errTimeout,
        commandAsString = command;

    if (Array.isArray(command)) {
        commandAsString = commandAsString.join(' ');
    }


    if (!self._process) {
        var root =  path.resolve(__dirname, "../../");
        var args = [];
        switch (self.mode) {
            case 'interactive':
                args.push('interactive', self.path);
                break;
            case 'interview':
                args.push('startInterview');
                if (Array.isArray(command)) {
                    args = args.concat(command);
                } else {
                    args.push(command);
                }
                args.push(self.path);
                break;
        }

        self._process = childProcess.spawn('.\\' + common.ADX_UNIT_PROCESS_NAME, args, {
            cwd   : path.join(root, common.ADX_UNIT_DIR_PATH),
            env   : common.getChildProcessEnv()
        });

        self._process._firstData = true;
    }

    function onOutput(data) {
        if (self._process._firstData) {
            self._process._firstData = false;
            if (self.mode === 'interactive') {
                self._process.stdin.write(commandAsString + '\n');
                return;
            }
        }
        var str = data.toString();
        if (!/^\[ADXShell:End\]/m.test(str)) {
            message.push(str);
        } else {
            // Remove the end of the message
            str = str.replace(/(\r?\n\[ADXShell:End\].*)/m, '');
            message.push(str);

            // Remove the listener at the end of the process
            self._process.stdout.removeListener('data', onOutput);
            self._process.stderr.removeListener('data', onError);

            if (typeof callback === 'function') {
                callback(null, message.join('').replace(/(\[ADXShell:End\].*)/m, ''));
            }
        }
    }

    function onError(data) {
        var str = data.toString();
        if (!/^\[ADXShell:End\]/m.test(str)) {
            errorMessage.push(str);
            // If an hard error the message end is never throw,
            // wait half a sec and send the message anyway
            clearTimeout(errTimeout);
            errTimeout = setTimeout(function () {
                onError('[ADXShell:End]');
            }, 500);
        } else {
            // Remove the end of the message
            str = str.replace(/(\r?\n\[ADXShell:End\].*)/m, '');
            errorMessage.push(str);

            // Remove the listener at the end of the process
            self._process.stdout.removeListener('data', onOutput);
            self._process.stderr.removeListener('data', onError);

            if (typeof callback === 'function') {
                callback(new Error(errorMessage.join('').replace(/(\[ADXShell:End\].*)/m, '')), null);
            }
        }
    }

    self._process.stdout.on('data', onOutput);
    self._process.stderr.on('data', onError);

    if (!self._process._firstData) {
        self._process.stdin.write(commandAsString  + '\n');
    }
};

/**
 * Destroy the internal reference of current object
 */
InteractiveADXShell.prototype.destroy = function destroy() {
    if (!this._process) {
        return;
    }
    this._process.kill();
    delete this._process;
};

exports.InteractiveADXShell = InteractiveADXShell;