import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorResponse = {
      success: false,
      code: status,
      message: typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : (exceptionResponse as any).message || exception.message,
      timestamp: new Date().toISOString(),
    };

    const logMessage = `${status} - ${JSON.stringify(errorResponse.message)}`;
    if (status >= 500) {
      this.logger.error(logMessage);
    } else {
      this.logger.warn(logMessage);
    }

    response.status(status).json(errorResponse);
  }
}
