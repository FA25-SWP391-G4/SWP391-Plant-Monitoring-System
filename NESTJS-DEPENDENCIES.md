# NestJS Dependencies Required for the Auth Module

To implement the NestJS authentication module, we need to install the following packages:

```bash
npm install --save @nestjs/common @nestjs/core @nestjs/passport @nestjs/jwt @nestjs/config @nestjs/typeorm @nestjs/swagger
npm install --save passport passport-jwt passport-local
npm install --save bcrypt uuid class-validator class-transformer
npm install --save typeorm pg
npm install --save reflect-metadata rxjs
npm install --save-dev @types/passport-jwt @types/passport-local @types/bcrypt @types/uuid
```

## Description of Packages

### Core NestJS Packages
- `@nestjs/common` - Common utilities and decorators
- `@nestjs/core` - Core NestJS framework
- `@nestjs/passport` - Passport integration for NestJS
- `@nestjs/jwt` - JWT utilities for NestJS
- `@nestjs/config` - Configuration management
- `@nestjs/typeorm` - TypeORM integration for NestJS
- `@nestjs/swagger` - Swagger/OpenAPI documentation

### Authentication Packages
- `passport` - Authentication middleware for Node.js
- `passport-jwt` - Passport strategy for JWT authentication
- `passport-local` - Passport strategy for username/password authentication
- `bcrypt` - Password hashing
- `uuid` - UUID generation for tokens

### Validation & Transformation
- `class-validator` - Validation decorators
- `class-transformer` - Object transformation

### Database
- `typeorm` - ORM for TypeScript
- `pg` - PostgreSQL client

### Other Dependencies
- `reflect-metadata` - Required for decorators
- `rxjs` - Reactive extensions for JavaScript

### Type Definitions (Dev Dependencies)
- `@types/passport-jwt` - Type definitions for passport-jwt
- `@types/passport-local` - Type definitions for passport-local
- `@types/bcrypt` - Type definitions for bcrypt
- `@types/uuid` - Type definitions for uuid

## NestJS Project Structure

Our authentication module follows the standard NestJS project structure:

```
src/
  auth/
    controllers/
      auth.controller.ts
    dto/
      register.dto.ts
      login.dto.ts
      forgot-password.dto.ts
      reset-password.dto.ts
      change-password.dto.ts
    entities/
      token-blacklist.entity.ts
    guards/
      jwt-auth.guard.ts
      local-auth.guard.ts
    strategies/
      jwt.strategy.ts
      local.strategy.ts
    decorators/
      public.decorator.ts
    services/
      token.service.ts
    auth.module.ts
    auth.service.ts
```

This structure organizes the code into logical components, making it easier to maintain and understand.

## Next Steps

After installing the dependencies, we need to:

1. Create a NestJS module for users
2. Update the auth module to use TypeORM repositories
3. Create database migrations for token blacklist and user tables
4. Configure NestJS app module to load auth and user modules
5. Implement email service for verification and password reset emails