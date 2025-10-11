import { Artical } from "@prisma/client";

export function formatArticalResponse(artical: Artical) {
  return {
    id: artical.id,
    title: artical.title,
    description: artical.description ?? undefined,
    content: artical.content,
    createdAt: artical.createdAt,
    authorId: artical.authorId,
    updatedAt: artical.updatedAt,
  };
}
