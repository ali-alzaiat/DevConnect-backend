import { applyDecorators, SetMetadata } from '@nestjs/common';
import { ApiSecurity } from '@nestjs/swagger';

export const PublicRoute = () => {
  return applyDecorators(
    SetMetadata('isPublic', true),
    ApiSecurity({}),
  );
};
