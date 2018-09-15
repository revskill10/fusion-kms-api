// custom type definitions
const typeDefs = `
  type Mutation {
    signup(email: String!, password: String!, name: String!): AuthPayload
    login(email: String!, password: String!): AuthPayload
  }
  type User {
    id: ID!
    name: String!
    email: String!
  }
  type AuthPayload {
    token: String
    user: User
  }
`;

export default typeDefs;
