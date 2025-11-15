import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HappyMeter API',
      version: '1.0.0',
      description: 'Customer feedback system with sentiment analysis',
      contact: {
        name: 'Tamas Besenyei'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Development server'
      },
      {
        url: 'http://localhost:8080',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Feedback',
        description: 'Customer feedback endpoints'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      }
    ],
    components: {
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
          description: 'HTTP Basic Authentication for admin endpoints'
        }
      }
    }
  },
  apis: ['./src/routes/*.ts', './src/index.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
