#!/usr/bin/env node

var Command = require('../node_modules/commander').Command;
var program = new Command();


program
    .version('2.0.0')
    .option('-o, --output <name>', 'name of the output to display or path to the output directory for the generation')
    .option('-f, --fixture <name>', 'name of the fixture to use for the `show` command')
    .option('-m, --masterPage <path>', 'path of the master page to use for the `show` command (for ADC)')
    .option('-p, --properties <props>', 'ADC properties (in url query string format) to set for the `show` command')
    // .option('-f, --force', 'overwrite the output directory when it exist')
    .option('-T, --no-test', 'skip the execution of ADX unit tests')
    .option('-X, --no-xml', 'skip the validation of the config.xml file')
    .option('-A, --no-autoTest', 'skip the execution of the auto-generated unit tests')
    .option('-t, --template <name>', 'name of the template to use to generate the ADX')
    // Option for the config
    .option('--authorName <name>', 'default name of the author to set in the config')
    .option('--authorEmail <email>', 'default email of the author to set in the config')
    .option('--authorCompany <name>', 'default company of the author to set in the config')
    .option('--authorWebsite <website>', 'default website of the author to set in the config');

program
    .command('generate <type> <name>')
    .description('generate a new ADX structure (ADP or ADC)')
    .action(function generateADX(type, name) {
        var adxGenerator = require('./generator/ADXGenerator.js');
        adxGenerator.generate(program, type, name);
    });

program
    .command('validate [<path>]')
    .description('validate the uncompressed ADC structure')
    .action(function validateADC(path) {
        return;
        var adcValidator = require('./validator/ADCValidator.js');
        adcValidator.validate(program, path);
    });

program
    .command('build [<path>]')
    .description('build the ADC file')
    .action(function buildADC(path) {
        return;
        var adcBuilder = require('./builder/ADCBuilder.js');
        adcBuilder.build(program, path);
    });

program
    .command('show [<path>]')
    .description('show the output of the ADC')
    .action(function showADC(path) {
        return;
        var adcShow = require('./show/ADCShow.js');
        adcShow.show(program, path);
    });


program
    .command('config')
    .description('get or set the configuration (use the --authorXXX flags to set the config)')
    .action(function () {
        return;
        var adcPreferences = require('./preferences/ADCPreferences.js');
        // No option to set, so only read
        if (!program.authorName && !program.authorEmail && !program.authorCompany && !program.authorWebsite) {
            adcPreferences.read();
        } else {
            var preferences = {
                author : {}
            };

            if ('authorName' in program) {
                preferences.author.name = program.authorName;
            }
            if ('authorEmail' in program) {
                preferences.author.email = program.authorEmail;
            }
            if ('authorCompany' in program) {
                preferences.author.company = program.authorCompany;
            }
            if ('authorWebsite' in program) {
                preferences.author.website = program.authorWebsite;
            }
            adcPreferences.write(preferences);
        }
    });

program.parse(process.argv);
