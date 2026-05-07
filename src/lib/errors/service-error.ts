export type ServiceErrorCode =
  | 'NOT_FOUND'
  | 'DUPLICATE'
  | 'INVALID_STATE'
  | 'FOREIGN_KEY_VIOLATION';

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly context?: Record<string, unknown>;

  constructor(code: ServiceErrorCode, message: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'ServiceError';
    this.code = code;
    this.context = context;
  }
}
