import { PartialType } from '@nestjs/swagger';
import CreateSnippetDTO from './create-snippet.dto';

export class UpdateSnippetDto extends PartialType(CreateSnippetDTO) {}
