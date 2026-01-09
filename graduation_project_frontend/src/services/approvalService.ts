import api from './api';

export const approvalService = {
  // جلب الموافقات
  async getApprovals(status?: string) {
    try {
      const response = await api.get('/approvals', {
        params: status ? { status } : {},
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
      throw error;
    }
  },

  // جلب تفاصيل موافقة
  async getApprovalDetail(approvalId: number) {
    try {
      const response = await api.get(`/approvals/${approvalId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch approval detail:', error);
      throw error;
    }
  },

  // الموافقة على طلب
  // الموافقة على طلب - تم إضافة / في نهاية الرابط
  async approveRequest(approvalId: number, data?: any) {
    try {
      // ✅ أضفنا السلاش بعد كلمة approve
      const response = await api.post(`/approvals/${approvalId}/approve/`, data); 
      return response.data;
    } catch (error) {
      console.error('Failed to approve request:', error);
      throw error;
    }
  },

  // رفض طلب - تم إضافة / في نهاية الرابط
  async rejectRequest(approvalId: number, reason?: string) {
    try {
      // ✅ أضفنا السلاش بعد كلمة reject
      const response = await api.post(`/approvals/${approvalId}/reject/`, {
        reason,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to reject request:', error);
      throw error;
    }
  },
  // طلب تعديلات
  async requestModifications(approvalId: number, modifications: string) {
    try {
      const response = await api.post(`/approvals/${approvalId}/request-modifications`, {
        modifications,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to request modifications:', error);
      throw error;
    }
  },
};
