describe('InteractiveADXShell', function () {

    var childProcess    = require('child_process'),
        common          = require('../../app/common/common.js'),
        pathHelper      = require('path'),
        util            = require('util'),
        EventEmitter    = require('events').EventEmitter,
        spies           = {},
        InteractiveADXShell;

    function StandardIO() {
        EventEmitter.call(this);
    }
    util.inherits(StandardIO, EventEmitter);

    function ChildProcessFake() {
        var self = this;
        self.stdin = {
            write : function () {}
        };
        self.stdout = new StandardIO();
        self.stderr = new StandardIO();
    }

    beforeEach(function () {
        // Clean the cache, obtain a fresh instance of the module each time
        var moduleKey = require.resolve('../../app/common/InteractiveADXShell.js');
        delete require.cache[moduleKey];
        InteractiveADXShell = require('../../app/common/InteractiveADXShell.js').InteractiveADXShell;

        // Court-circuit the access of the child process
        spies.spawn = spyOn(childProcess, 'spawn').andCallFake(function () {
            return new ChildProcessFake();
        });

        // CWD
        spyOn(process, 'cwd').andReturn('');
    });

    describe('#constructor', function () {
        it("save the `path` arg in #path", function () {
            var adxShell = new InteractiveADXShell('/adx/path');
            expect(adxShell.path).toEqual('/adx/path');
        });
    });

    describe('#exec', function () {
        it("should spawn the ADXShell process with the `interactive` command", function () {
            var adxShell = new InteractiveADXShell('/adx/path');
            adxShell.exec('');
            var processPath = '.\\' + common.ADX_UNIT_PROCESS_NAME;
            var processArgs = [
                'interactive',
                '/adx/path'
            ];
            var processOptions = {
                cwd   : pathHelper.join(pathHelper.resolve(__dirname, '../../'), common.ADX_UNIT_DIR_PATH),
                env   : process.env
            };
            expect(spies.spawn).toHaveBeenCalledWith(processPath, processArgs, processOptions);
        });

        it("should not call spawn twice when the ADXShell process was already initialized", function () {
            var adxShell = new InteractiveADXShell('/adc/path');
            var callCount = 0;
            spies.spawn.andCallFake(function () {
                callCount++;
                return new ChildProcessFake();
            });
            adxShell.exec('');
            adxShell.exec('');
            expect(callCount).toBe(1);
        });

        it("should send the command in the standard input of the process", function () {
            var writeData, mock;
            spies.spawn.andCallFake(function () {
                mock = new ChildProcessFake();
                mock.stdin.write = function (data) {
                    writeData = data;
                };
                return mock;
            });
            var adxShell = new InteractiveADXShell('/adx/path');
            adxShell.exec('this is the command');
            mock.stdout.emit('data', 'first data');
            expect(writeData).toBe('this is the command\n');
        });

        [{
            name : 'standard output',
            prop : 'stdout'
        }, {
            name : 'standard error',
            prop : 'stderr'
        }].forEach(function (obj) {
            it("should read in the " + obj.name  + " of the process", function () {
                var mock;
                spies.spawn.andCallFake(function () {
                    mock = new ChildProcessFake();
                    return mock;
                });
                var adxShell = new InteractiveADXShell('/adx/path');
                adxShell.exec('hello');
                expect(mock[obj.prop].listeners('data').length).toEqual(1);
            });

            it("should call the callback with the data of the " + obj.name  + " of the process when it receive a message starting with [ADXShell:End]", function () {
                var stub, result;
                spies.spawn.andCallFake(function () {
                    stub = new ChildProcessFake();
                    return stub;
                });
                var adxShell = new InteractiveADXShell('/adx/path');
                adxShell.exec('hello', function (err, data) {
                    if (obj.prop === 'stdout') {
                        result = data;
                    } else {
                        result = err.message;
                    }
                });
                if (obj.prop === 'stdout') {
                    stub[obj.prop].emit('data', "first call");
                }
                stub[obj.prop].emit('data', "process");
                stub[obj.prop].emit('data', " result");
                stub[obj.prop].emit('data', "\n Hello World!\n[ADXShell:End]");
                expect(result).toBe('process result\n Hello World!');
            });

            it("should remove the listener after data was emit via the " + obj.name  + " of the process", function () {
                var mock;
                spies.spawn.andCallFake(function () {
                    mock = new ChildProcessFake();
                    return mock;
                });
                var adxShell = new InteractiveADXShell('/adx/path');
                adxShell.exec('hello');
                if (obj.prop === 'stdout') {
                    mock[obj.prop].emit('data', "first call");
                }
                mock[obj.prop].emit('data', "process result");
                mock[obj.prop].emit('data', "[ADXShell:End]");
                expect(mock.stdout.listeners('data').length).toEqual(0);
                expect(mock.stderr.listeners('data').length).toEqual(0);
            });
        });

        it("should ignore the first output", function () {
            var stub, result = '';
            spies.spawn.andCallFake(function () {
                stub = new ChildProcessFake();
                return stub;
            });
            var adxShell = new InteractiveADXShell('/adx/path');
            adxShell.exec('hello', function (err, data) {
               result += data;
            });
            stub.stdout.emit('data', "first call");
            stub.stdout.emit('data', "second call");
            stub.stdout.emit('data', "\r\n[ADXShell:End]");
            expect(result).toBe('second call');
        });

    });
});