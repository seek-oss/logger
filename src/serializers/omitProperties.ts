export const omitProperties = (
  input: unknown,
  properties: string[],
): unknown => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return input;
  }

  // We can get away with a shallow clone as we only touch top-level properties.
  const output: Record<PropertyKey, unknown> = {
    ...input,
  };

  for (const property of properties) {
    // Remove the property from our shallow clone.
    delete output[property];
  }

  return output;
};
