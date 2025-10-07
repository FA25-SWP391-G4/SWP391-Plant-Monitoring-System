import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TokenBlacklistService } from '../token-blacklist.service';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private tokenBlacklistService: TokenBlacklistService
  ) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Get the request
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Check if token is blacklisted
      return this.tokenBlacklistService.isBlacklisted(token).then(isBlacklisted => {
        if (isBlacklisted) {
          return false;
        }
        
        // Continue with the default JWT validation
        return super.canActivate(context) as Promise<boolean>;
      });
    }

    // No token, continue with default behavior (will reject as unauthorized)
    return super.canActivate(context);
  }
}