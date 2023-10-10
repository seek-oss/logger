import { omitProperties } from './omitProperties';
import type { SerializerFn } from './types';

export const createOmitPropertiesSerializer = (
  /**
   * A list of properties that should not be logged.
   */
  properties: readonly string[],
): SerializerFn => {
  const uniquePropertySet = new Set(properties);

  if (uniquePropertySet.size === 0) {
    return (input) => input;
  }

  const uniqueProperties = Array.from(uniquePropertySet);

  return (input) => omitProperties(input, uniqueProperties);
};
