import { AppException } from '@eristic/app/types/exceptions.types';
import { APIResponse } from '@eristic/app/types/api.types';

import { ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // Log all errors
  console.error(`[${new Date().toISOString()}] Error in ${req.method} ${req.path}:`, {
    message: error.message,
    stack: error.stack,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Handle custom application exceptions
  if (error instanceof AppException) {
    const response: APIResponse = {
      success: false,
      error: error.message,
      code: error.errorCode,
    };

    return res.status(error.statusCode).json(response);
  }

  // Handle validation errors from express-validator or similar
  if (error.name === 'ValidationError') {
    const response: APIResponse = {
      success: false,
      error: 'Validation failed',
      message: error.message,
    };

    return res.status(400).json(response);
  }

  // Handle JSON parsing errors
  if (error instanceof SyntaxError && 'body' in error) {
    const response: APIResponse = {
      success: false,
      error: 'Invalid JSON format',
      message: 'Request body contains invalid JSON',
    };

    return res.status(400).json(response);
  }

  // Handle unexpected errors
  const response: APIResponse = {
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  };

  return res.status(500).json(response);
};