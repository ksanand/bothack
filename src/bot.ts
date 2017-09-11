import * as builder from 'botbuilder';
import { createServer } from 'restify';
import { config } from 'dotenv';

config();

const connector = new builder.ChatConnector({
    appId: process.env['MICROSOFT_APP_ID'],
    appPassword: process.env['MICROSOFT_APP_PASSWORD']
});

const server = createServer();
server.listen(process.env['port'] || process.env['PORT'] || 3978, '::', () =>
   console.log('%s listening to %s', server.name, server.url)
);
server.post('/api/messages', connector.listen());

const bot = new builder.UniversalBot(connector, (session) => {
    session.send("Sorry, I didn't understand that.")
});


bot.recognizer(new builder.LuisRecognizer(process.env.LUIS_MODEL_URL));

bot.dialog('/helloworld', (session) => {
    session.send("Hello, World");
})
.triggerAction({
    matches: /^hello$/i
});

bot.dialog('/extract', (session, args) => {
    const place = args.intent.matched[1].trim();
    session.send(`Wherever you go, ${place} is in your heart`)
})
.triggerAction({
    matches: /^where is (.*)$/i
});

// bot.dialog('/list', (session, args) => {
//     const status = args.intent.matched[1].trim();
//     const results = testresults.filter(test => test.status === status);
//     session.send(results.map(testresults => testresults.name).join(", "));
//     //session.send("blah");  
// })
// .triggerAction({
//     matches: /^which tests (failed|passed) today$/i
// });

bot.dialog('/luisList', (session, args) => {
	const statusEntity = builder.EntityRecognizer.findEntity(args.intent.entities, 'test status');
	console.log(args.intent.entities)
	if (statusEntity) {
    	const status = statusEntity.entity;
    	console.log(statusEntity)
        const results = testresults.filter(test => test.status === statusEntity.resolution.values[0]);
        session.send(results.map(testresults => testresults.name).join(", "));
    } else {
        session.send("you'll need to say 'failed' or 'passed'")
    }
})
.triggerAction({
    matches: 'Test Results'
});

interface Test {
    name: string;
    status: "failed" | "passed";
}

interface TestResults {
    name: string;
    status: "failed" | "passed";
    step_failed: string;
    instance: integer;
}

const testresults: TestResults[] = [
{
    name: "database check.feature",
    status: "failed",
    step_failed: "Connectivity failure",
    instance: 1
}, {
    name: "sanity check.feature",
    status: "passed",
    step_failed: "None",
    instance: 1
}, {
    name: "load testing mailguard.feature",
    status: "failed",
    step_failed: "Virus daemon died",
    instance: 1
}
];


const testcases: TestCases[] = [{
    name: "database check.feature",
    description: "Checks for database access for mailguard"
}, {
    name: "sanity check.feature",
    description: "Checks for sanity of mailguard virus detection"
}, {
    name: "load testing mailguard.feature",
    description: "mailguard can process 20000 emails/min"
}];
