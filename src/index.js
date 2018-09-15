import fetch from 'node-fetch';
import { ApolloServer } from 'apollo-server';
import { mergeSchemas, makeExecutableSchema } from 'graphql-tools';
import { getRemoteSchema } from './utils';
import typeDefs from './customTypeDefs';
import resolvers from './customResolvers';

const HASURA_GRAPHQL_ENGINE_URL = process.env.HASURA_GRAPHQL_ENGINE_URL || `https://bazookaand.herokuapp.com`;
const HASURA_GRAPHQL_API_URL = HASURA_GRAPHQL_ENGINE_URL + '/v1alpha1/graphql';
const ACCESS_KEY = process.env.X_HASURA_ACCESS_KEY;
const USER_API = `https://fusionapi-test.herokuapp.com/v1alpha1/graphql`;
const WEATHER_GRAPHQL_API_URL = 'https://nxw8w0z9q7.lp.gql.zone/graphql'; // metaweather graphql api


const runServer = async () => {

  // make Hasura schema
  const executableHasuraSchema = await getRemoteSchema(
    HASURA_GRAPHQL_API_URL,
    ACCESS_KEY && { 'x-hasura-access-key': ACCESS_KEY }
  );

  const executableUserSchema = await getRemoteSchema(
    USER_API
  );

  const executableWeatherSchema = await getRemoteSchema(WEATHER_GRAPHQL_API_URL);

  // make executable schema out of custom resolvers and typedefs
  const executableCustomSchema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  const hasuraWeatherResolvers = {
    person: {
      city_weather : {
        resolve(parent, args, context, info) {
          return info.mergeInfo.delegateToSchema({
            schema: executableWeatherSchema,
            operation: 'query',
            fieldName: 'cityWeather',
            args: {
              city_name: parent.city,
            },
            context,
            info,
          });
        },
      },
    },
  };

  const linkHasuraTypeDefs = `
    extend type person {
      city_weather: CityWeather,
    }
  `;

  // merge custom resolvers with Hasura schema
  const finalSchema = mergeSchemas({
    schemas: [
      executableWeatherSchema,
      executableCustomSchema,
      executableHasuraSchema,
      executableUserSchema,
      linkHasuraTypeDefs
    ],
    resolvers: hasuraWeatherResolvers
  });

  // instantiate a server instance
  const server = new ApolloServer({
    schema: finalSchema,
    introspection: true,
    playground: true
  });

  // run the server
  server.listen({
    port: process.env.PORT || 4000
  }).then(({url}) => {
    console.log('Server running. Open ' + url + ' to run queries.');
  });
}

try {
  runServer();
} catch (e) {
  console.log(e, e.message, e.stack);
}
