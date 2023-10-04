export const omitProperties = (
  record: Record<string, unknown>,
  keyList: string[],
): Record<string, unknown> => {
  if (!record || typeof record !== 'object' || Array.isArray(record))
    return record;

  let reducedRecord = record;

  /* eslint-disable-next-line @typescript-eslint/prefer-for-of --
   * For loop is faster than `for of` and performance is preferred over readability here
   **/
  for (let keyIndex = 0; keyIndex < keyList.length; keyIndex++) {
    const key = keyList[keyIndex];
    if (typeof key !== 'string') continue;

    const { [key]: _, ...keepRecord } = reducedRecord;

    reducedRecord = keepRecord;
  }

  return reducedRecord;
};
