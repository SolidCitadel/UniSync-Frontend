// Enrollments API for Canvas course management
import apiClient from './client';
import type { Enrollment } from '@/types';

export interface EnrollmentToggleRequest {
  isSyncEnabled: boolean;
}

export const enrollmentsApi = {
  /**
   * Get all enrollments for current user
   * Returns list of courses the user is enrolled in
   */
  async listEnrollments(): Promise<Enrollment[]> {
    try {
      console.log('[enrollmentsApi.listEnrollments] Fetching enrollments...');
      const response = await apiClient.get<Enrollment[]>('/v1/enrollments');
      console.log('[enrollmentsApi.listEnrollments] Fetched enrollments:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[enrollmentsApi.listEnrollments] Error fetching enrollments:', error);

      let message = '수강 목록을 불러오는데 실패했습니다.';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      }

      throw new Error(message);
    }
  },

  /**
   * Toggle sync status for an enrollment
   * When disabled, all schedules for this course will be deleted
   */
  async toggleEnrollmentSync(enrollmentId: number, isSyncEnabled: boolean): Promise<Enrollment> {
    try {
      console.log(`[enrollmentsApi.toggleEnrollmentSync] Toggling enrollment ${enrollmentId} to ${isSyncEnabled}`);

      const requestBody: EnrollmentToggleRequest = {
        isSyncEnabled,
      };

      const response = await apiClient.put<Enrollment>(
        `/v1/enrollments/${enrollmentId}/sync`,
        requestBody
      );

      console.log('[enrollmentsApi.toggleEnrollmentSync] Updated enrollment:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[enrollmentsApi.toggleEnrollmentSync] Error toggling enrollment:', error);

      let message = '수강 동기화 설정 변경에 실패했습니다.';
      if (error.response?.status === 404) {
        message = '수강 정보를 찾을 수 없습니다.';
      } else if (error.response?.status === 400) {
        const backendMessage = error.response.data?.message;
        if (backendMessage?.includes('권한')) {
          message = '해당 수강 정보에 접근할 권한이 없습니다.';
        } else {
          message = backendMessage || message;
        }
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      }

      throw new Error(message);
    }
  },
};
