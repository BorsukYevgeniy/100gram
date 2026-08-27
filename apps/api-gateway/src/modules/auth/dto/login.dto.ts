import { CreateUserDto } from '@app/contracts/user/dto';
import { OmitType } from '@nestjs/swagger';

export class LoginDto extends OmitType(CreateUserDto, ['nickname']) {}
