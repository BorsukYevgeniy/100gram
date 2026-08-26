import { CreateUserDto } from '@app/contracts/user';
import { OmitType } from '@nestjs/swagger';

export class LoginDto extends OmitType(CreateUserDto, ['nickname']) {}
