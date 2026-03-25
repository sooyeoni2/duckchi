import { axiosClient as axiosInstance } from '@core/network/axiosClient';

/**
 * 모임방 생성 (ROOM-01)
 * POST /api/v1/rooms
 */
export const createMeetingRoom = async (data: { roomName: string; category: string; description: string }): Promise<any> => {
  const payload = {
    name: data.roomName,
    category: data.category,
    description: data.description,
  };
  const response = await axiosInstance.post('/api/v1/rooms', payload);
  return response.data;
};

/**
 * 모임방 정보 수정 (ROOM-05)
 * PATCH /api/v1/rooms/{roomId}
 */
export const updateRoomInfo = async (roomId: number, data: { roomName: string; category?: string; description?: string }): Promise<void> => {
  const payload = {
    name: data.roomName,
    category: data.category,
  };
  await axiosInstance.patch(`/api/v1/rooms/${roomId}`, payload);
};

/**
 * 모임방 자동이체 동의 여부 토글 (ROOM-14)
 * PATCH /api/v1/rooms/{roomId}/my-transfer-agree
 */
export const updateAutoTransferAgree = async (roomId: number): Promise<void> => {
  await axiosInstance.patch(`/api/v1/rooms/${roomId}/my-transfer-agree`);
};

/**
 * 자동이체 동의/거절 가입 (ROOM-04)
 * PATCH /api/v1/rooms/{roomId}/auto-debit/consents?status=AGREED|DECLINED
 */
export const updateAutoDebitConsent = async (roomId: number, status: 'AGREED' | 'DECLINED'): Promise<void> => {
  await axiosInstance.patch(`/api/v1/rooms/${roomId}/auto-debit/consents?status=${status}`);
};

/**
 * 모임 시작 (ROOM-17)
 * POST /api/v1/rooms/{roomId}/start
 */
export const startMeetingRoom = async (roomId: number): Promise<void> => {
  await axiosInstance.post(`/api/v1/rooms/${roomId}/start`);
};

/**
 * 모임 종료 (ROOM-18)
 * POST /api/v1/rooms/{roomId}/end
 */
export const endMeetingRoom = async (roomId: number): Promise<void> => {
  await axiosInstance.post(`/api/v1/rooms/${roomId}/end`);
};

/**
 * 모임방 나가기 (ROOM-06)
 * DELETE /api/v1/rooms/{roomId}/members/left
 */
export const leaveMeetingRoom = async (roomId: number): Promise<void> => {
  await axiosInstance.delete(`/api/v1/rooms/${roomId}/members/left`);
};

/**
 * 모임방 삭제 (ROOM-07)
 * DELETE /api/v1/rooms/{roomId}/delete
 */
export const deleteMeetingRoom = async (roomId: number): Promise<void> => {
  await axiosInstance.delete(`/api/v1/rooms/${roomId}/delete`);
};

export interface RoomListResponse {
  roomId: number;
  roomName: string;
  category: string;
  isProgress: boolean;
  participants: number[];
  participantCount: number;
  totalPay: number;
  payCount: number;
  percent: number;
}

/**
 * 내 모임방 목록 조회 (ROOM-08)
 * GET /api/v1/rooms/room-lists
 */
export const getRoomLists = async (isProgress?: boolean): Promise<RoomListResponse[]> => {
  const params = isProgress !== undefined ? { isProgress } : {};
  const response = await axiosInstance.get('/api/v1/rooms/room-lists', { params });
  return (response.data?.data || []) as RoomListResponse[];
};
