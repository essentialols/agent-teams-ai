import { Global, Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";

import {
  AsyncLocalRequestContextStore,
  REQUEST_CONTEXT_STORE,
} from "../request-context/request-context.js";
import { RequestContextInterceptor } from "./request-context.interceptor.js";
import { SafeErrorExceptionFilter } from "./safe-error-exception.filter.js";

@Global()
@Module({
  exports: [REQUEST_CONTEXT_STORE],
  providers: [
    {
      provide: REQUEST_CONTEXT_STORE,
      useFactory: () => new AsyncLocalRequestContextStore(),
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestContextInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: SafeErrorExceptionFilter,
    },
  ],
})
export class PlatformApiModule {}
