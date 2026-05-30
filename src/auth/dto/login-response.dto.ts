import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseDto {
  @ApiProperty()
  token: string;
  @ApiProperty()
  user: { id: number; email: string; name: string };
}
