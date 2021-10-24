import { ApolloServer } from 'apollo-server-express';
import { makeExecutableSchema } from '@graphql-tools/schema'
import express from 'express'
import { execute, subscribe } from 'graphql';
import { createServer } from 'http';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { PubSub } from 'graphql-subscriptions';
import typeDefs from './schema';
import resolvers from './resolvers';
import db, { DB } from './db';

export interface Context {
    db: DB
    pubsub: unknown
}

const pubsub = new PubSub();
const ctx = { db, pubsub } ;

const schema = makeExecutableSchema({
    typeDefs,
    resolvers
});

// Create apollo server
const apolloServer = new ApolloServer({
    schema,
    typeDefs,
    resolvers,
    context: ctx,
    plugins: [{
            async serverWillStart() {
                return {
                    async drainServer() {
                        subscriptionServer.close();
                    },
                };
            },
        }]
})

// Create subscription server
const app = express();
const httpServer = createServer(app);
const subscriptionServer = SubscriptionServer.create(
    {
        schema,
        execute,
        subscribe,
        onConnect: (connectionParams: unknown, webSocket: unknown, context: unknown) => (ctx),
    },
    { server: httpServer, path: apolloServer.graphqlPath },
);


// Start apollo server
await apolloServer.start()

// Run subscription server
// const PORT = 4000;
// httpServer.listen(PORT, () =>
//     console.log(`Server is now running on http://localhost:${PORT}/graphql`)
// );

// Middleware
await apolloServer.applyMiddleware({ app })
const apolloMiddleware = apolloServer.getMiddleware({
    path: '/api/graphql',
})

function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result)
            }
            return resolve(result)
        })
    })
}

export default async function handler(req, res) {
    await runMiddleware(req, res, apolloMiddleware)
}

export const config = {
    api: {
        bodyParser: false,
    },
}

