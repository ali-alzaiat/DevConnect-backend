import { Module } from '@nestjs/common';
import { SnippetService } from './snippet.service';
import { SnippetController } from './snippet.controller';

@Module({
  providers: [SnippetService],
  controllers: [SnippetController]
})
export class SnippetModule {}
