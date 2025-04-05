import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClerkAuthService } from './services/clerk-auth.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private clerkAuthService: ClerkAuthService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      this.logger.warn('Token não encontrado nos headers da requisição');
      throw new UnauthorizedException('Token de autenticação ausente');
    }

    try {
      // Verificar o token e obter dados do usuário
      const user = await this.clerkAuthService.verifyTokenAndGetUser(token);

      // Adicionar usuário à requisição
      request.user = user;
      return true;
    } catch (error) {
      this.logger.error(`Falha na autenticação: ${error.message}`, error.stack);
      throw new UnauthorizedException('Token de autenticação inválido');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 