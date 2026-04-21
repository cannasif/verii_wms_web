import { api } from '@/lib/axios';
import type { ApiRequestOptions } from '@/lib/request-utils';
import type { ApiResponse } from '@/types/api';
import type {
  BarcodeDesignerPreviewRequest,
  BarcodeDesignerPreviewResult,
  BarcodeBindingCatalogGroup,
  BarcodeBindingCatalogRequest,
  BarcodeSchemaMetadata,
  BarcodeComplianceReport,
  BarcodePrintSourceItem,
  BarcodeTemplate,
  BarcodeTemplateDraft,
  BarcodeTemplateVersion,
  BarcodeTemplateUpsertRequest,
  Gs1BuildRequest,
  Gs1BuildResult,
} from '../types/barcode-designer-editor.types';

export const barcodeDesignerApi = {
  async getTemplates(options?: ApiRequestOptions): Promise<ApiResponse<BarcodeTemplate[]>> {
    return await api.get<ApiResponse<BarcodeTemplate[]>>('/api/BarcodeDesigner/templates', options);
  },

  async getBindingCatalog(request?: BarcodeBindingCatalogRequest, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeBindingCatalogGroup[]>> {
    return await api.get<ApiResponse<BarcodeBindingCatalogGroup[]>>('/api/BarcodeDesigner/binding-catalog', {
      ...options,
      params: request,
    });
  },

  async getSchemaMetadata(request?: BarcodeBindingCatalogRequest, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeSchemaMetadata>> {
    return await api.get<ApiResponse<BarcodeSchemaMetadata>>('/api/BarcodeDesigner/schema-metadata', {
      ...options,
      params: request,
    });
  },

  async getTemplate(id: number, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeTemplate>> {
    return await api.get<ApiResponse<BarcodeTemplate>>(`/api/BarcodeDesigner/templates/${id}`, options);
  },

  async createTemplate(payload: BarcodeTemplateUpsertRequest, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeTemplate>> {
    return await api.post<ApiResponse<BarcodeTemplate>>('/api/BarcodeDesigner/templates', payload, options);
  },

  async updateTemplate(id: number, payload: BarcodeTemplateUpsertRequest, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeTemplate>> {
    return await api.put<ApiResponse<BarcodeTemplate>>(`/api/BarcodeDesigner/templates/${id}`, payload, options);
  },

  async deleteTemplate(id: number, options?: ApiRequestOptions): Promise<ApiResponse<boolean>> {
    return await api.delete<ApiResponse<boolean>>(`/api/BarcodeDesigner/templates/${id}`, options);
  },

  async setTemplateActive(id: number, isActive: boolean, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeTemplate>> {
    return await api.patch<ApiResponse<BarcodeTemplate>>(`/api/BarcodeDesigner/templates/${id}/active`, { isActive }, options);
  },

  async getDraft(templateId: number, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeTemplateDraft>> {
    return await api.get<ApiResponse<BarcodeTemplateDraft>>(`/api/BarcodeDesigner/templates/${templateId}/draft`, options);
  },

  async saveDraft(templateId: number, payload: BarcodeTemplateDraft, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeTemplateDraft>> {
    return await api.post<ApiResponse<BarcodeTemplateDraft>>(`/api/BarcodeDesigner/templates/${templateId}/draft`, payload, options);
  },

  async getVersions(templateId: number, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeTemplateVersion[]>> {
    return await api.get<ApiResponse<BarcodeTemplateVersion[]>>(`/api/BarcodeDesigner/templates/${templateId}/versions`, options);
  },

  async publishVersion(templateId: number, versionId: number, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeTemplateVersion>> {
    return await api.post<ApiResponse<BarcodeTemplateVersion>>(`/api/BarcodeDesigner/templates/${templateId}/publish`, { versionId }, options);
  },

  async getComplianceReport(templateId: number, versionId: number, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeComplianceReport>> {
    return await api.get<ApiResponse<BarcodeComplianceReport>>(`/api/BarcodeDesigner/templates/${templateId}/versions/${versionId}/compliance-report`, options);
  },

  async preview(payload: BarcodeDesignerPreviewRequest, options?: ApiRequestOptions): Promise<ApiResponse<BarcodeDesignerPreviewResult>> {
    return await api.post<ApiResponse<BarcodeDesignerPreviewResult>>('/api/BarcodeDesigner/preview', payload, options);
  },

  async buildGs1(payload: Gs1BuildRequest, options?: ApiRequestOptions): Promise<ApiResponse<Gs1BuildResult>> {
    return await api.post<ApiResponse<Gs1BuildResult>>('/api/BarcodeDesigner/gs1/build', payload, options);
  },

  async resolvePrintSource(
    payload: { sourceModule?: string | null; sourceHeaderId?: number | null; sourceLineId?: number | null; printMode?: string | null },
    options?: ApiRequestOptions,
  ): Promise<ApiResponse<BarcodePrintSourceItem[]>> {
    return await api.post<ApiResponse<BarcodePrintSourceItem[]>>('/api/BarcodeDesigner/resolve-print-source', payload, options);
  },
};
