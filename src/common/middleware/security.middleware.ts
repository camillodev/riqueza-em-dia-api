import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import * as xss from 'xss-clean';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private helmet = helmet();
  private logger = new Logger(SecurityMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    // Apply helmet middleware (sets various HTTP security headers)
    this.helmet(req, res, (err: any) => {
      if (err) {
        this.logger.error(`Helmet middleware error: ${err}`);
        return next(err);
      }

      // XSS prevention
      xss()(req, res, (err: any) => {
        if (err) {
          this.logger.error(`XSS middleware error: ${err}`);
          return next(err);
        }

        // Log access attempt for audit purposes (in real app, would store this in a database)
        this.logger.log(
          `${req.method} ${req.originalUrl} [${req.ip}] - User: ${(req as any).user?.id || 'unauthenticated'
          }`,
        );

        next();
      });
    });
  }
} 