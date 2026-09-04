import { PartialType } from '@nestjs/mapped-types';
import { AddReactionDto } from './add-reaction.dto';

export class UpdateReactionDto extends PartialType(AddReactionDto) {}
