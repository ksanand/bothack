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
//     const results = tests.filter(test => test.status === status);
//     session.send(results.map(tests => tests.name).join(", "));
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
        const results = tests.filter(test => test.status === statusEntity.resolution.values[0]);
        session.send(results.map(tests => tests.name).join(", "));
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

const tests: Test[] = [{
    name: "Bad test",
    status: "failed"
}, {
    name: "Good test",
    status: "passed"
}, {
    name: "Dodgy test",
    status: "failed"
}, {
    name: "Valid test",
    status: "passed"
}];

