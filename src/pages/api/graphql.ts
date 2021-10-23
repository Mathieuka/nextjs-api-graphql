// import { ApolloServer } from 'apollo-server-express';
import { ApolloServer } from "apollo-server-micro";
// import { execute, subscribe } from 'graphql';
// import { createServer } from 'http';
// import { SubscriptionServer } from 'subscriptions-transport-ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
// import { PubSub } from 'graphql-subscriptions';
import typeDefs from './schema';
import resolvers from './resolvers';
import db, { DB } from './db';

export interface Context {
    db: DB
    pubsub: unknown
}
const ctx = { db } ;

const schema = makeExecutableSchema({
    typeDefs,
    resolvers
});



export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader(
        'Access-Control-Allow-Origin',
        'https://studio.apollographql.com'
    )
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept'
    )
    if (req.method === 'OPTIONS') {
        res.end()
        return false
    }

    // SUBSCRIPTION
    // const app = express();
    // const httpServer = createServer(app);
    // let serverTemp = {} as any;
    // const subscriptionServer = SubscriptionServer.create(
    //     {
    //         schema,
    //         execute,
    //         subscribe,
    //         onConnect: (connectionParams: unknown, webSocket: unknown, context: unknown) => (ctx),
    //     },
    //     { server: httpServer, path: serverTemp.graphqlPath },
    // );


    const server = new ApolloServer({
        typeDefs,
        schema,
        context: { db },
        // plugins: [{
        //     async serverWillStart() {
        //         return {
        //             async drainServer() {
        //                 subscriptionServer.close();
        //             },
        //         };
        //     },
        // }],
    });

    const startServer = server.start()
    await startServer;

    await server.createHandler({
        path: '/api/graphql',
    })(req, res)
}


export const config = {
    api: {
        bodyParser: false,
    },
}
