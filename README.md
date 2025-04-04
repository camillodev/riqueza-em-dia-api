# Riqueza em Dia API

A powerful financial management API for tracking accounts, transactions, and generating financial reports.

## Features

- 👤 **User Management**: Secure user authentication and profile management
- 💰 **Accounts Management**: Track multiple financial accounts with balances
- 💸 **Transaction Tracking**: Record and categorize income and expenses
- 📊 **Financial Reports**: Generate insights and visualizations of your financial data
- 🔒 **Security**: JWT authentication, input validation, and data protection
- 📱 **API Ready**: Ready-to-use endpoints for your frontend applications

## Project Setup

```bash
# Install dependencies
$ npm install

# Set up environment variables
$ cp .env.example .env
# Then edit .env with your configuration

# Initialize database with Prisma
$ npx prisma migrate dev
```

## Running the Application

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## API Documentation

For detailed API documentation, please refer to:

- Swagger UI: Visit `/api/docs` when the application is running
- API Documentation file: See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## Key Components

- **Authentication**: JWT-based auth system with Clerk integration
- **Users**: Profile management and preferences
- **Accounts**: Bank accounts, credit cards, and other financial accounts
- **Transactions**: Income and expense tracking with categorization
- **Reports**: Financial analytics and data visualization

## Technologies

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM for Node.js
- [PostgreSQL](https://www.postgresql.org/) - Advanced open-source database
- [Zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation
- [Swagger](https://swagger.io/) - API documentation

## License

This project is [MIT licensed](LICENSE).
