// Industry guard utilities — enforce MODAUI 行业隔离规范
export const VALID_INDUSTRIES = ['fashion', 'catering', 'beauty', 'fitness', 'jewelry', 'home'] as const;
export type IndustryId = (typeof VALID_INDUSTRIES)[number];

export function isValidIndustry(id: string | null | undefined): id is IndustryId {
  return !!id && (VALID_INDUSTRIES as readonly string[]).includes(id);
}

export function sanitizeIndustryId(id: string | null | undefined): IndustryId | undefined {
  return isValidIndustry(id) ? id : undefined;
}

export function ensureCoreFields(obj: Record<string, any>): void {
  if (!obj) throw new Error('Missing payload');
  if (!obj.tenant_id && !obj.tenantId && !obj.tenantId) {
    throw new Error('Missing tenant_id');
  }
  if (!obj.industry_id && !obj.industryId && !obj.industry) {
    throw new Error('Missing industry_id');
  }
  if (!obj.template_id && !obj.templateId && !obj.template) {
    throw new Error('Missing template_id');
  }
}
