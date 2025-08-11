export abstract class AppException extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationException extends AppException {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_ERROR';

  constructor(message: string = 'Validation failed') {
    super(message);
  }
}

export class NotFoundException extends AppException {
  readonly statusCode = 404;
  readonly errorCode = 'NOT_FOUND';

  constructor(resource: string) {
    super(`${resource} not found`);
  }
}

export class ServiceUnavailableException extends AppException {
  readonly statusCode = 503;
  readonly errorCode = 'SERVICE_UNAVAILABLE';

  constructor(service: string) {
    super(`${service} is currently unavailable`);
  }
}

export class LLMProviderException extends AppException {
  readonly statusCode = 500;
  readonly errorCode = 'LLM_PROVIDER_ERROR';

  constructor(message: string = 'LLM provider error') {
    super(message);
  }
}

export class DatabaseException extends AppException {
  readonly statusCode = 500;
  readonly errorCode = 'DATABASE_ERROR';

  constructor(message: string = 'Database operation failed') {
    super(message);
  }
}