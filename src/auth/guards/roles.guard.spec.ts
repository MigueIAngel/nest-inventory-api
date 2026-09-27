import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/role.enum.js';
import { RolesGuard } from './roles.guard.js';

function contextFor(user?: { role: Role }): ExecutionContext {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  afterEach(() => vi.restoreAllMocks());

  it('allows access when no roles are required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    expect(guard.canActivate(contextFor({ role: Role.Staff }))).toBe(true);
  });

  it('allows users with a required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    expect(guard.canActivate(contextFor({ role: Role.Admin }))).toBe(true);
  });

  it('forbids users without the required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.Admin]);
    expect(() => guard.canActivate(contextFor({ role: Role.Staff }))).toThrow(
      ForbiddenException,
    );
  });
});
