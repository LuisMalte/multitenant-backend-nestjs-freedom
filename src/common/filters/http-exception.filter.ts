import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost,) {
        const ctx = host.switchToHttp();

        const request = ctx.getRequest();
        const response = ctx.getResponse();    

        const status = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        let message: string | string[];

        if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
        ) {
        message = exceptionResponse.message as string | string[];
        } else {
        message = 'Internal Server Error';
        }



        response.status(status).json({
        success: false,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message,
        });
    }

}