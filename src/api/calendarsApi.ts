// Calendars API
import apiClient from './client';
import type { Calendar, CalendarType } from '@/types';

// Backend CategoryResponse type
interface CategoryResponse {
  categoryId: number;
  cognitoSub: string;
  groupId: number | null;
  name: string;
  color: string;
  icon: string | null;
  isDefault: boolean;
  sourceType: string | null; // "USER", "CANVAS", "GOOGLE"
  sourceId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Convert backend CategoryResponse to frontend Calendar type
const mapCategoryResponseToCalendar = (response: CategoryResponse): Calendar => {
  // Determine calendar type based on sourceType field
  let type: CalendarType = 'local';

  if (response.sourceType === 'CANVAS_COURSE' || response.sourceType === 'CANVAS') {
    type = 'ecampus';
  } else if (response.sourceType === 'GOOGLE_CALENDAR' || response.sourceType === 'GOOGLE') {
    type = 'google';
  } else if (response.sourceType === 'USER_CREATED' || response.sourceType === 'USER' || response.sourceType === null) {
    type = 'local';
  }

  return {
    id: response.categoryId.toString(),
    name: response.name,
    type: type,
    color: response.color,
    isVisible: true, // Default to visible
    sourceId: response.sourceId || undefined,
  };
};

export const calendarsApi = {
  /**
   * Get all calendars for current user (including group calendars)
   */
  async listCalendars(): Promise<Calendar[]> {
    try {
      const response = await apiClient.get<CategoryResponse[]>('/v1/categories', {
        params: {
          includeGroups: 'true',
        },
      });
      return response.data.map(mapCategoryResponseToCalendar);
    } catch (error) {
      console.error('[calendarsApi.listCalendars] Error fetching calendars:', error);
      throw error;
    }
  },

  /**
   * Toggle calendar visibility
   * Note: Backend may not support visibility toggle yet - stored locally
   */
  async toggleVisibility(calendarId: string, isVisible: boolean): Promise<Calendar> {
    try {
      // Backend doesn't have a visibility toggle endpoint yet
      // For now, we'll just fetch the calendar and return it with the updated visibility
      // In a real implementation, you might want to store visibility in localStorage

      const response = await apiClient.get<CategoryResponse>(`/v1/categories/${calendarId}`);
      const calendar = mapCategoryResponseToCalendar(response.data);
      calendar.isVisible = isVisible; // Update locally

      // Store visibility preference in localStorage
      const visibilityKey = `calendar-visibility-${calendarId}`;
      localStorage.setItem(visibilityKey, JSON.stringify(isVisible));

      return calendar;
    } catch (error) {
      console.error('[calendarsApi.toggleVisibility] Error toggling visibility:', error);
      throw error;
    }
  },

  /**
   * Get calendar by ID
   */
  async getCalendar(calendarId: string): Promise<Calendar> {
    try {
      const response = await apiClient.get<CategoryResponse>(`/v1/categories/${calendarId}`);
      const calendar = mapCategoryResponseToCalendar(response.data);

      // Restore visibility preference from localStorage
      const visibilityKey = `calendar-visibility-${calendarId}`;
      const storedVisibility = localStorage.getItem(visibilityKey);
      if (storedVisibility !== null) {
        calendar.isVisible = JSON.parse(storedVisibility);
      }

      return calendar;
    } catch (error) {
      console.error('[calendarsApi.getCalendar] Error fetching calendar:', error);
      throw error;
    }
  },

  /**
   * Create a new calendar
   */
  async createCalendar(data: { name: string; color: string; icon?: string; groupId?: number }): Promise<Calendar> {
    try {
      const requestBody = {
        name: data.name,
        color: data.color,
        icon: data.icon || null,
        groupId: data.groupId || null,
      };

      const response = await apiClient.post<CategoryResponse>('/v1/categories', requestBody);
      return mapCategoryResponseToCalendar(response.data);
    } catch (error) {
      console.error('[calendarsApi.createCalendar] Error creating calendar:', error);
      throw error;
    }
  },
};
