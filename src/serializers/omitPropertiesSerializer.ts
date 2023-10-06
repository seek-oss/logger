import { omitProperties } from './omitProperties';

export interface OmitPropertiesSerializerOptions {
  /**
   * A list of properties that should not be logged.
   */
  omitPropertyNames: string[];
}

type OmitHeaderNamesFn = (record: unknown) => unknown;
type OmitHeaderNamesSerializer = Record<string, OmitHeaderNamesFn>;

/** Creates a serializer that operates on the logged object's top-level property named `topLevelPropertyName`
 *  and omits the properties listed in `options.omitPropertyNames`.
 *  @param topLevelPropertyName - The name of the root property on the logged object that to omit properties from.
 *  @param options - Options for the serializer.
 */
export const createOmitPropertiesSerializer = (
  topLevelPropertyName: string,
  options: OmitPropertiesSerializerOptions,
): OmitHeaderNamesSerializer => {
  const propertyNames = [...new Set(options.omitPropertyNames ?? [])].filter(
    (propertyName) => typeof propertyName === 'string',
  );

  if (
    !topLevelPropertyName ||
    typeof topLevelPropertyName !== 'string' ||
    topLevelPropertyName.length === 0 ||
    propertyNames.length === 0
  ) {
    return {};
  }

  return {
    [topLevelPropertyName]: (record) => omitProperties(record, propertyNames),
  };
};
