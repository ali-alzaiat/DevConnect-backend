import { Snippet } from "@prisma/client";

export function formatSnippetResponse(snippet: Snippet) {
  return {
    id: snippet.id,
    name: snippet.name,
    description: snippet.description ?? undefined,
    code: snippet.code,
    createdAt: snippet.createdAt,
    creatorId: snippet.creatorId,
    updatedAt: snippet.updatedAt,
  };
}