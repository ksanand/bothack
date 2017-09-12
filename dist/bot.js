"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var builder = require("botbuilder");
var restify_1 = require("restify");
var dotenv_1 = require("dotenv");
dotenv_1.config();
var connector = new builder.ChatConnector({
    appId: process.env['MICROSOFT_APP_ID'],
    appPassword: process.env['MICROSOFT_APP_PASSWORD']
});
var server = restify_1.createServer();
server.listen(process.env['port'] || process.env['PORT'] || 3978, '::', function () {
    return console.log('%s listening to %s', server.name, server.url);
});
server.post('/api/messages', connector.listen());
var bot = new builder.UniversalBot(connector, function (session) {
    session.send("Sorry, I didn't understand that.");
});
bot.recognizer(new builder.LuisRecognizer(process.env.LUIS_MODEL_URL));
bot.dialog('/helloworld', function (session) {
    session.send("Hello, World");
})
    .triggerAction({
    matches: /^hello$/i
});
bot.dialog('/extract', function (session, args) {
    var place = args.intent.matched[1].trim();
    session.send("Wherever you go, " + place + " is in your heart");
})
    .triggerAction({
    matches: /^where is (.*)$/i
});
bot.dialog('/failing_tests_howlong', function (session, args) {
    var status = args.intent.matched[1].trim();
    //const results = testresults.filter(test => test.status === status);
    session.send("Like forever. Please consider fixing this as I am quite annoyed with this failure!");
})
    .triggerAction({
    matches: /(.+) fail duration/i
});
bot.dialog('/rerun_tests', function (session, args) {
    var status = args.intent.matched[1].trim();
    //const results = testresults.filter(test => test.status === status);
    session.send("Test scheduled for rerun. Check in later to check for the results of these tests.");
})
    .triggerAction({
    matches: /rerun tests (.+)/i
});
bot.dialog('/luisList', function (session, args) {
    var statusEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'test status');
    console.log(args.intent.entities);
    if (statusEntity) {
        var status_1 = statusEntity.entity;
        console.log(statusEntity);
        var rslt_1 = statusEntity.resolution.values[0];
        var results = testresults.filter(function (test) { return test.status === rslt_1; });
        var resultList = results.map(function (r) { return '* ' + r.name + ' (Status: ' + r.step_failed + ')'; })
            .join('<br>');
        var reply = new builder.Message();
        reply.attachments([
            new builder.HeroCard(session)
                .title('These are the tests that ' + rslt_1)
                .text(resultList)
                .buttons([
                builder.CardAction.imBack(session, "More Info", "More Info")
            ])
        ]);
        session.send(reply);
    }
    else {
        session.send("you'll need to say 'failed' or 'passed'");
    }
})
    .triggerAction({
    matches: 'Test Results'
});
bot.dialog('/testinfo', function (session, args) {
    var name = args.intent.matched[1].trim();
    var results = testcases.filter(function (test) { return test.name === name; });
    session.send(results.map(function (testcases) { return testcases.description; }).join(", "));
})
    .triggerAction({
    matches: /test info (.+)/i
});
var testresults = [{
        name: "database_check.feature",
        status: "failed",
        step_failed: "Connectivity failure",
        instance: 1
    }, {
        name: "sanity_check.feature",
        status: "passed",
        step_failed: "None",
        instance: 1
    }, {
        name: "load_testing_mailguard.feature",
        status: "failed",
        step_failed: "Virus daemon died",
        instance: 1
    }, {
        name: "integration_with_console.feature",
        status: "passed",
        step_failed: "",
        instance: 1
    }, {
        name: "operations.feature",
        status: "failed",
        step_failed: "Virusd daemon failed",
        instance: 1
    }, {
        name: "common_configs.feature",
        status: "failed",
        step_failed: "Virusd daemon failed",
        instance: 1
    }];
var testcases = [{
        name: "database_check.feature",
        description: "Checks for database access for mailguard"
    }, {
        name: "sanity_check.feature",
        description: "Checks for sanity of mailguard virus detection"
    }, {
        name: "load_testing_mailguard.feature",
        description: "mailguard can process 20000 emails/min"
    }, {
        name: "integration_with_console.feature",
        description: "Mailguard console integration"
    }, {
        name: "operations.feature",
        description: "Operational tests"
    }, {
        name: "common_configs.feature",
        description: "mailguard common configs"
    }];
var tagName;
bot.dialog('/addTag', [
    function (session, args, next) {
        var tagEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'tagName');
        if (tagEntity) {
            tagName = tagEntity.entity;
            return next();
        }
        builder.Prompts.text(session, "What do you want to call this tag?");
    },
    function (session, args, next) {
        if (!tagName) {
            tagName = args.response;
        }
        session.send("I created a tag called " + tagName + ".");
    }
]).triggerAction({
    matches: 'Add Tag'
});