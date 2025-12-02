// Friends API
import apiClient from './client';
import type { Friend, FriendRequest } from '@/types';

// Backend response types
interface UserSummaryResponse {
  cognitoSub: string;
  name: string;
  email: string;
  isFriend: boolean;
  isPending: boolean;
}

interface FriendshipResponse {
  friendshipId: number;
  friend: UserSummaryResponse;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'BLOCKED';
  createdAt: string;
}

interface FriendRequestResponseBackend {
  requestId: number;
  fromUser: UserSummaryResponse;
  createdAt: string;
}

interface MessageResponse {
  message: string;
}

// Convert backend FriendshipResponse to frontend Friend type
const mapFriendshipToFriend = (response: FriendshipResponse): Friend => {
  return {
    id: response.friend.cognitoSub,
    name: response.friend.name,
    email: response.friend.email,
    profileImage: undefined, // Backend doesn't provide profile image yet
    status: 'accepted', // We only list accepted friends
  };
};

// Convert backend FriendRequestResponse to frontend FriendRequest type
const mapFriendRequestResponse = (response: FriendRequestResponseBackend): FriendRequest => {
  return {
    id: response.requestId.toString(),
    fromUserId: response.fromUser.cognitoSub,
    fromUserName: response.fromUser.name,
    fromUserEmail: response.fromUser.email,
    toUserId: '', // Not provided in response, but not needed for display
    status: 'pending',
    createdAt: new Date(response.createdAt),
  };
};

export const friendsApi = {
  /**
   * Get all friends for current user
   */
  async listFriends(): Promise<Friend[]> {
    try {
      const response = await apiClient.get<FriendshipResponse[]>('/v1/friends');
      return response.data.map(mapFriendshipToFriend);
    } catch (error) {
      console.error('[friendsApi.listFriends] Error fetching friends:', error);
      throw error;
    }
  },

  /**
   * Search users by email or name
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserSummaryResponse[]> {
    try {
      const response = await apiClient.get<UserSummaryResponse[]>('/v1/friends/search', {
        params: { query, limit },
      });
      return response.data;
    } catch (error) {
      console.error('[friendsApi.searchUsers] Error searching users:', error);
      throw error;
    }
  },

  /**
   * Send friend request by user cognitoSub
   */
  async sendFriendRequest(friendCognitoSub: string): Promise<FriendRequest> {
    try {
      const response = await apiClient.post<FriendshipResponse>('/v1/friends/requests', {
        friendCognitoSub,
      });

      // Convert response to FriendRequest format
      return {
        id: response.data.friendshipId.toString(),
        fromUserId: '', // Not provided
        toUserId: response.data.friend.cognitoSub,
        status: 'pending',
        createdAt: new Date(response.data.createdAt),
      };
    } catch (error) {
      console.error('[friendsApi.sendFriendRequest] Error sending friend request:', error);
      throw error;
    }
  },

  /**
   * Accept friend request
   */
  async acceptFriendRequest(requestId: string): Promise<Friend> {
    try {
      await apiClient.post<MessageResponse>(`/v1/friends/requests/${requestId}/accept`);

      // After accepting, fetch updated friends list to get the new friend
      const friends = await friendsApi.listFriends();

      // Return the most recently added friend (last in the list)
      // This is a workaround since the accept endpoint only returns a message
      if (friends.length > 0) {
        return friends[friends.length - 1];
      }

      // Fallback: create a dummy friend object
      throw new Error('친구 목록 새로고침에 실패했습니다.');
    } catch (error) {
      console.error('[friendsApi.acceptFriendRequest] Error accepting friend request:', error);
      throw error;
    }
  },

  /**
   * Reject friend request
   */
  async rejectFriendRequest(requestId: string): Promise<void> {
    try {
      await apiClient.post<MessageResponse>(`/v1/friends/requests/${requestId}/reject`);
    } catch (error) {
      console.error('[friendsApi.rejectFriendRequest] Error rejecting friend request:', error);
      throw error;
    }
  },

  /**
   * Remove friend
   */
  async removeFriend(friendshipId: string): Promise<void> {
    try {
      await apiClient.delete<MessageResponse>(`/v1/friends/${friendshipId}`);
    } catch (error) {
      console.error('[friendsApi.removeFriend] Error removing friend:', error);
      throw error;
    }
  },

  /**
   * Get pending friend requests (received)
   */
  async getPendingRequests(): Promise<FriendRequest[]> {
    try {
      const response = await apiClient.get<FriendRequestResponseBackend[]>(
        '/v1/friends/requests/pending'
      );
      return response.data.map(mapFriendRequestResponse);
    } catch (error) {
      console.error('[friendsApi.getPendingRequests] Error fetching pending requests:', error);
      throw error;
    }
  },

  /**
   * Block user
   */
  async blockUser(friendCognitoSub: string): Promise<void> {
    try {
      await apiClient.post<MessageResponse>(`/v1/friends/${friendCognitoSub}/block`);
    } catch (error) {
      console.error('[friendsApi.blockUser] Error blocking user:', error);
      throw error;
    }
  },
};
