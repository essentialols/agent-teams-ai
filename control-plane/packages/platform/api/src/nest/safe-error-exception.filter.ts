import { ArgumentsHost, Catch, Inject, type ExceptionFilter } from "@nestjs/common";

import {
  CONTROL_PLANE_LOGGER,
  type ControlPlaneLogger,
} from "@agent-teams-control-plane/platform-logger";

import {
  createPublicErrorResponse,
  getHttpStatusForSafeError,
} from "../errors/public-error-response.js";
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
  sendJsonResponse,
  setResponseHeader,
  type HttpRequestLike,
  type HttpResponseLike,
} from "./http-adapter-types.js";
import { getHttpStatusForException, toApiSafeError } from "./safe-error-mapper.js";

@Catch()
export class SafeErrorExceptionFilter implements ExceptionFilter {
  public constructor(
    @Inject(REQUEST_CONTEXT_STORE)
    private readonly requestContextStore: RequestContextStore,
    @Inject(CONTROL_PLANE_LOGGER)
    private readonly logger: ControlPlaneLogger,
  ) {}

  public catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<HttpRequestLike>();
    const response = http.getResponse<HttpResponseLike>();
    const requestContext =
      this.requestContextStore.current() ??
      createRequestContext({ headers: request.headers ?? {} });
    const safeError = toApiSafeError(exception);
    const statusCode =
      getHttpStatusForException(exception) ?? getHttpStatusForSafeError(safeError);
    const body = createPublicErrorResponse({
      correlationId: requestContext.correlationId,
      safeError,
    });

    setResponseHeader(response, REQUEST_ID_HEADER, requestContext.requestId);
    setResponseHeader(response, CORRELATION_ID_HEADER, requestContext.correlationId);
    this.logException(request, requestContext, statusCode, safeError.code);
    sendJsonResponse(response, statusCode, body);
  }

  private logException(
    request: HttpRequestLike,
    context: RequestContext,
    statusCode: number,
    safeErrorCode: string,
  ): void {
    const metadata = {
      correlationId: context.correlationId,
      method: request.method ?? "UNKNOWN",
      path: sanitizeRequestPath(request.url),
      requestId: context.requestId,
      safeErrorCode,
      statusCode,
    };

    if (statusCode >= 500) {
      this.logger.error("API exception handled", metadata);
      return;
    }
    this.logger.warn("API exception handled", metadata);
  }
}
