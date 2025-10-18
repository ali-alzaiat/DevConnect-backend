import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  LoggerService,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Inject } from '@nestjs/common';

@Injectable()
export class WinstonLoggingInterceptor implements NestInterceptor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl } = req;
    const now = Date.now();

    this.logger.log(`Incoming Request → ${method} ${originalUrl}`, 'HTTP');

    return next
      .handle()
      .pipe(
        tap(() =>
          this.logger.log(
            `Handled ${method} ${originalUrl} in ${Date.now() - now}ms`,
            'HTTP',
          ),
        ),
      );
  }
}
