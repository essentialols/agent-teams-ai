import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { catchError, Observable, tap, throwError } from "rxjs";

import {
  CONTROL_PLANE_LOGGER,
  type ControlPlaneLogger,
} from "@agent-teams-control-plane/platform-logger";

import { getHttpStatusForSafeError } from "../errors/public-error-response.js";
import {
  CORRELATION_ID_HEADER,
  createRequestContext,
  REQUEST_CONTEXT_STORE,
  REQUEST_ID_HEADER,
  type RequestContext,
  type RequestContextStore,
} from "../request-context/request-context.js";
import {
  sanitizeRequestPath,
  setResponseHeader,
  type HttpRequestLike,
  type HttpResponseLike,
} from "./http-adapter-types.js";
import { getHttpStatusForException, toApiSafeError } from "./safe-error-mapper.js";

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  public constructor(
    @Inject(REQUEST_CONTEXT_STORE)
    private readonly requestContextStore: RequestContextStore,
    @Inject(CONTROL_PLANE_LOGGER)
    private readonly logger: ControlPlaneLogger,
  ) {}

  public intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const http = context.switchToHttp();
    const request = http.getRequest<HttpRequestLike>();
    const response = http.getResponse<HttpResponseLike>();
    const requestContext = createRequestContext({ headers: request.headers ?? {} });

    setResponseHeader(response, REQUEST_ID_HEADER, requestContext.requestId);
    setResponseHeader(response, CORRELATION_ID_HEADER, requestContext.correlationId);

    return new Observable((subscriber) =>
      this.requestContextStore.run(requestContext, () =>
        next
          .handle()
          .pipe(
            tap(() => this.logRequest("info", request, response, requestContext)),
            catchError((error: unknown) => {
              this.logRequest("warn", request, response, requestContext, error);
              return throwError(() => error);
            }),
          )
          .subscribe(subscriber),
      ),
    );
  }

  private logRequest(
    level: "info" | "warn",
    request: HttpRequestLike,
    response: HttpResponseLike,
    context: RequestContext,
    error?: unknown,
  ): void {
    const statusCode =
      error === undefined
        ? (response.statusCode ?? 200)
        : (getHttpStatusForException(error) ??
          getHttpStatusForSafeError(toApiSafeError(error)));
    const durationMs = Math.max(0, Date.now() - context.startedAtMs);
    const metadata = {
      correlationId: context.correlationId,
      durationMs,
      method: request.method ?? "UNKNOWN",
      path: sanitizeRequestPath(request.url),
      requestId: context.requestId,
      statusCode,
    };

    if (level === "warn") {
      this.logger.warn("API request failed", metadata);
      return;
    }
    this.logger.info("API request completed", metadata);
  }
}
