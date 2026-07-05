import { Snippet, Tag, User } from '@prisma/client';
import SnippetResponseDTO from './dto/snippet-response.dto';

export type SnippetWithRelations = Snippet & {
  tags: Tag[];
  creator: Pick<User, 'id' | 'name'> | null;
};

export function mapSnippetToDTO(
  snippet: SnippetWithRelations,
): SnippetResponseDTO {
  return {
    id: snippet.id,
    name: snippet.name,
    description: snippet.description ?? undefined,
    code: snippet.code,
    tags: snippet.tags.map((tag) => tag.name),
    createdAt: snippet.createdAt,
    updatedAt: snippet.updatedAt,
  };
}
