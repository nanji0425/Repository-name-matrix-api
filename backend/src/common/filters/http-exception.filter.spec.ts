import assert from 'node:assert/strict';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

function createHostMock() {
  const response: any = {
    statusCode: 0,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: any) {
      this.body = payload;
      return this;
    },
  };

  const host: any = {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  };

  return { host, response };
}

function captureLogger(filter: any) {
  const calls = {
    warn: [] as string[],
    error: [] as string[],
  };
  filter.logger = {
    warn: (message: string) => calls.warn.push(message),
    error: (message: string) => calls.error.push(message),
  };
  return calls;
}

const notFoundFilter: any = new HttpExceptionFilter();
const notFoundCalls = captureLogger(notFoundFilter);
const notFoundContext = createHostMock();
notFoundFilter.catch(new NotFoundException('missing'), notFoundContext.host);

assert.equal(notFoundContext.response.statusCode, 404);
assert.equal(notFoundCalls.warn.length, 1);
assert.equal(notFoundCalls.error.length, 0);

const serverErrorFilter: any = new HttpExceptionFilter();
const serverErrorCalls = captureLogger(serverErrorFilter);
const serverErrorContext = createHostMock();
serverErrorFilter.catch(new HttpException('broken', HttpStatus.INTERNAL_SERVER_ERROR), serverErrorContext.host);

assert.equal(serverErrorContext.response.statusCode, 500);
assert.equal(serverErrorCalls.warn.length, 0);
assert.equal(serverErrorCalls.error.length, 1);

console.log('http exception filter log level test passed');
