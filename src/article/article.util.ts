export function mapArticleToDTO(article: any) {
  const { authorId, ...rest } = article;
  return {
    ...rest,
    description: rest.description ?? undefined,
  };
}