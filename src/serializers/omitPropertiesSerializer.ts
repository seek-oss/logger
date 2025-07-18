import { omitProperties } from './omitProperties.js';
import type { SerializerFn } from './types.js';

export const createOmitPropertiesSerializer = (
  /**
   * A list of properties that should not be logged.
   */
  properties: readonly string[],
): SerializerFn => {
  const uniquePropertySet = new Set(properties);

  if (uniquePropertySet.size === 0) {
    return (input): unknown => input;
  }

  const uniqueProperties = Array.from(uniquePropertySet);

  return (input) => omitProperties(input, uniqueProperties);
};
