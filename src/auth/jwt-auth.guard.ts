import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClerkAuthService } from './services/clerk-auth.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly DEBUG_MODE = true; // Modo de debug temporário

  constructor(private clerkAuthService: ClerkAuthService) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    // Log de todos os headers para debug
    if (this.DEBUG_MODE) {
      this.logger.debug(`Headers recebidos: ${JSON.stringify(request.headers)}`);
    }

    // Extrair token do cabeçalho Authorization
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

      // Para depuração, permitir acesso mesmo com falha na verificação
      if (this.DEBUG_MODE) {
        this.logger.warn('MODO DEBUG: Permitindo acesso mesmo com falha na autenticação');

        // Decodificar token sem verificar para extrair o ID
        try {
          const decoded = jwt.decode(token);
          request.user = {
            id: 'debug-user',
            email: 'debug@example.com',
            role: 'admin',
            clerkId: decoded?.sub || 'debug-clerk-id'
          };
          return true;
        } catch (decodeError) {
          this.logger.error(`Erro ao decodificar token: ${decodeError.message}`);
        }
      }

      throw new UnauthorizedException('Token de autenticação inválido');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
} 