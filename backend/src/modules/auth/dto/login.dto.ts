import { OmitType } from '@nestjs/swagger';
import { CreateUserDto } from '../../user/dto/create-user.dto';

export class LoginDto extends OmitType(CreateUserDto, ['nickname']) {}
