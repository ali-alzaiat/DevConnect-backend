export function mapSnippetToDTO(snippet: any) {
  const { creatorId, ...rest } = snippet;
  return {
    ...rest,
    description: rest.description ?? undefined,
    code: rest.code ?? undefined,
  };
}