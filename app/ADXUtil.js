#!/usr/bin/env node

var Command = require('../node_modules/commander').Command;
var program = new Command();
var common  = require('../app/common/common.js')


program
    .version('2.0.0')
    .option('-o, --output <name>', 'name of the output to display or path to the output directory for the generation')
    .option('-f, --fixture <name>', 'name of the fixture to use for the `show` command')
    .option('-m, --masterPage <path>', 'path of the master page to use for the `show` command (for ADC)')
    .option('-p, --properties <props>', 'ADX properties (in url query string format) to set for the `show` command')
    // .option('-f, --force', 'overwrite the output directory when it exist')
    .option('-T, --no-test', 'skip the execution of ADX unit tests')
    .option('-X, --no-xml', 'skip the validation of the config.xml file')
    .option('-A, --no-autoTest', 'skip the execution of the auto-generated unit tests')
    .option('-t, --template <name>', 'name of the template to use to generate the ADX')
    // Option for the config
    .option('--authorName <name>', 'default name of the author to set in the config')
    .option('--authorEmail <email>', 'default email of the author to set in the config')
    .option('--authorCompany <name>', 'default company of the author to set in the config')
    .option('--authorWebsite <website>', 'default website of the author to set in the config')
    // Options for the publisher
    .option('--promoted', 'the article will be promoted (appear with a star in ZenDesk Platform)')
    .option('--enableComments', 'the comments will be enabled on the article corresponding to the ADC on ZenDesk')
    .option('--username <name>', 'the username login to connect to the platform')
    .option('--pwd <password>', 'the password login to connect to the platform')
    .option('--sectionTitle <title>', 'The name of the section where the adc will be posted (ZenDesk)')
    .option('--remoteUri <uri>', 'The remote URI of the platform')
    .option('--useremail <email>', 'The email login to connect to the platform (GitHub Only)')
    .option('--message <msg>', 'The commit message (GitHub only)')
    .option('--token <token>', 'The token that allows you to publish')
    .option('--organization <org>', 'The name of the organization to publish adc')
    .option('--surveyDemoUrl <url>' , 'The url to start the demo survey online');


program
    .command('generate <type> <name>')
    .description('generate a new ADX structure (ADP or ADC)')
    .action(function generateADX(type, name) {
        var adxGenerator = require('./generator/ADXGenerator.js');
        adxGenerator.generate(program, type, name);
    });

program
    .command('publish [<platform>]')
    .description('publish an ADX on a platform')
    .action(function publishADX(platform) {
        var Configurator = require('./configurator/ADXConfigurator.js').Configurator;
        var configurator = new Configurator(process.cwd());
        configurator.load(function (err) {

            var options = {};
            if ('promoted' in program) {
                options.promoted = true;
            }
            options.comments_disabled = !('enableComments' in program);
            if ('sectionTitle' in program) {
                options.section_title = program.sectionTitle;
            }
            if ('username' in program) {
                options.username = program.username;
            }
            if ('message' in program) {
                options.message = program.message;
            }
            if ('remoteUri' in program) {
                options.remoteUri = program.remoteUri;
            }
            if ('pwd' in program) {
                options.password = program.pwd;
            }
            if ('useremail' in program) {
                options.useremail = program.useremail;
            }
            if ('organization' in program) {
                options.organization = program.organization;
            }
            if ('surveyDemoUrl' in program) {
                options.surveyDemoUrl = program.surveyDemoUrl;
            }
            var adxPublisher = require('./publisher/ADXPublisher.js');
            var publisher = new adxPublisher.Publisher(configurator);
            publisher.publish(platform, options, function (err) {
                if (err) {
                    common.writeError("Failed to publish the ADC : " + err);
                    return;
                }
                common.writeSuccess("ADC succesfuly uploaded");
            });
        });
    });

program
    .command('validate [<path>]')
    .description('validate the uncompressed ADX structure')
    .action(function validateADX(path) {
        var adxValidator = require('./validator/ADXValidator.js');
        adxValidator.validate(program, path);
    });

program
    .command('build [<path>]')
    .description('build the ADX file')
    .action(function buildADX(path) {
        var adxBuilder = require('./builder/ADXBuilder.js');
        adxBuilder.build(program, path);
    });

program
    .command('show [<path>]')
    .description('show the output of the ADX')
    .action(function showADX(path) {
        var adxShow = require('./show/ADXShow.js');
        adxShow.show(program, path);
    });


program
    .command('config')
    .description('get or set the configuration (use the --authorXXX flags to set the config)')
    .action(function () {
        var adxPreferences = require('./preferences/ADXPreferences.js');
        // No option to set, so only read
        if (!program.authorName && !program.authorEmail && !program.authorCompany && !program.authorWebsite) {
            adxPreferences.read();
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
            adxPreferences.write(preferences);
        }
    });

program.parse(process.argv);
