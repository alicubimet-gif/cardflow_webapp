/**
 * Canonical helper for constructing WebApp Record View paths.
 * Guarantees standard query-parameter route: /groups/record/?groupId=...&subgroupId=...&recordId=...
 */
export function buildRecordViewPath(record: any): string | null {
  if (!record) return null;

  const recordId = record.id ?? record.record_id ?? record.recordId;
  if (!recordId || recordId === 'undefined') {
    return null;
  }

  const groupId =
    record.group_id ??
    record.groupId ??
    record.group?.id ??
    record.group;

  const subgroupId =
    record.subgroup_id ??
    record.sub_group_id ??
    record.sub_group ??
    record.subgroupId ??
    record.subgroup?.id ??
    record.subgroup;

  const searchParamsObj: Record<string, string> = {
    recordId: String(recordId),
  };

  if (groupId && groupId !== 'undefined') {
    searchParamsObj.groupId = String(groupId);
  }

  if (subgroupId && subgroupId !== 'undefined') {
    searchParamsObj.subgroupId = String(subgroupId);
  }

  const params = new URLSearchParams(searchParamsObj);
  return `/groups/record/?${params.toString()}`;
}
