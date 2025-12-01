// e-Campus (Canvas LMS) API
import apiClient from './client';
import type { User } from '@/types';

export interface EcampusConnectionRequest {
  canvasToken: string;
}

export interface EcampusConnectionResponse {
  success: boolean;
  message: string;
  user: User;
}

export interface CanvasSyncResponse {
  success: boolean;
  message: string;
  coursesCount: number;
  assignmentsCount: number;
  syncedAt?: string;
}

export type CanvasSyncMode = 'courses' | 'assignments';

export const ecampusApi = {
  /**
   * Connect e-Campus (Canvas LMS) account
   */
  async connect(canvasToken: string): Promise<EcampusConnectionResponse> {
    try {
      const response = await apiClient.post('/v1/integrations/canvas/credentials', {
        canvasToken,
      });

      // 백엔드가 user 객체를 반환하지 않으므로, 현재 user 데이터를 가져와서 ecampusToken 필드만 업데이트
      const currentUserData = localStorage.getItem('user_data');
      let updatedUser = currentUserData ? JSON.parse(currentUserData) : null;

      if (updatedUser) {
        updatedUser.ecampusToken = canvasToken;
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      }

      return {
        success: response.data.success || true,
        message: response.data.message || 'Canvas 토큰이 성공적으로 등록되었습니다.',
        user: updatedUser,
      };
    } catch (error: any) {
      console.error('[ecampusApi.connect] 에러 발생:', error);
      console.error('[ecampusApi.connect] error.response:', error.response);

      let message = 'e-Campus 연동에 실패했습니다.';

      if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        if (backendMessage.includes('Invalid token') || backendMessage.includes('토큰')) {
          message = '유효하지 않은 Canvas Token입니다.';
        } else if (backendMessage.includes('already connected') || backendMessage.includes('이미 연동')) {
          message = '이미 e-Campus가 연동되어 있습니다.';
        } else {
          message = backendMessage;
        }
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      }

      console.error('[ecampusApi.connect] 최종 에러 메시지:', message);
      throw new Error(message);
    }
  },

  /**
   * Disconnect e-Campus (Canvas LMS) account
   */
  async disconnect(): Promise<EcampusConnectionResponse> {
    try {
      await apiClient.delete('/v1/integrations/canvas/credentials');

      // 백엔드가 204 No Content를 반환하므로, 현재 user 데이터를 가져와서 ecampusToken 필드만 제거
      const currentUserData = localStorage.getItem('user_data');
      let updatedUser = currentUserData ? JSON.parse(currentUserData) : null;

      if (updatedUser) {
        delete updatedUser.ecampusToken;
        localStorage.setItem('user_data', JSON.stringify(updatedUser));
      }

      return {
        success: true,
        message: 'Canvas 연동이 해제되었습니다.',
        user: updatedUser,
      };
    } catch (error: any) {
      console.error('[ecampusApi.disconnect] 에러 발생:', error);
      console.error('[ecampusApi.disconnect] error.response:', error.response);

      const message = error.response?.data?.message || error.response?.data?.error || 'e-Campus 연동 해제에 실패했습니다.';

      console.error('[ecampusApi.disconnect] 최종 에러 메시지:', message);
      throw new Error(message);
    }
  },

  /**
   * Verify Canvas token validity
   */
  async verifyToken(canvasToken: string): Promise<boolean> {
    try {
      const response = await apiClient.post('/v1/users/ecampus/verify', {
        canvasToken,
      });

      return response.data.valid === true;
    } catch (error) {
      console.error('[ecampusApi.verifyToken] 에러 발생:', error);
      return false;
    }
  },

  /**
   * Sync Canvas data with 2-step process
   * Step 1 (mode=courses): Sync courses only to create enrollments
   * Step 2 (mode=assignments): Sync assignments for enabled courses only
   */
  async syncCanvas(mode: CanvasSyncMode = 'assignments'): Promise<CanvasSyncResponse> {
    try {
      console.log(`[ecampusApi.syncCanvas] 동기화 요청 시작 (mode: ${mode})`);
      const response = await apiClient.post(`/v1/integrations/canvas/sync?mode=${mode}`);

      console.log('[ecampusApi.syncCanvas] 응답 받음:', response);
      console.log('[ecampusApi.syncCanvas] 응답 데이터:', response.data);

      const { success, message, coursesCount, assignmentsCount, syncedAt } = response.data;

      // Customize message based on mode
      let resultMessage = message;
      if (!message) {
        if (mode === 'courses') {
          resultMessage = `과목 동기화 완료: ${coursesCount || 0}개의 과목을 불러왔습니다.`;
        } else {
          resultMessage = `과제 동기화 완료: ${assignmentsCount || 0}개의 과제를 불러왔습니다.`;
        }
      }

      return {
        success: success !== false,
        message: resultMessage,
        coursesCount: coursesCount || 0,
        assignmentsCount: assignmentsCount || 0,
        syncedAt: syncedAt,
      };
    } catch (error: any) {
      console.error('[ecampusApi.syncCanvas] 에러 발생:', error);
      console.error('[ecampusApi.syncCanvas] error.response:', error.response);
      console.error('[ecampusApi.syncCanvas] error.response.data:', error.response?.data);

      let message = 'Canvas 동기화에 실패했습니다.';

      if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        if (backendMessage.includes('token') || backendMessage.includes('토큰')) {
          message = 'Canvas 토큰이 등록되지 않았습니다. 먼저 토큰을 연동해주세요.';
        } else if (backendMessage.includes('Canvas API')) {
          message = 'Canvas API 호출에 실패했습니다. 토큰을 확인해주세요.';
        } else {
          message = backendMessage;
        }
      } else if (error.response?.data?.error) {
        message = error.response.data.error;
      } else if (error.message) {
        message = `Canvas 동기화 중 오류: ${error.message}`;
      }

      console.error('[ecampusApi.syncCanvas] 최종 에러 메시지:', message);
      throw new Error(message);
    }
  },
};
