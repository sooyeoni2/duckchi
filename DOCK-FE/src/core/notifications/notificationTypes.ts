export type NotificationOpenSource =
  | 'foreground'
  | 'background_notification_press'
  | 'quit_notification_press';

// FCM 원본 메시지에서 앱 내부에서 공통으로 사용할 최소 정보만 추린다.
export interface NotificationMessage {
  messageId?: string;
  title?: string;
  body?: string;
  sentTime?: number;
  data: Record<string, string>;
}

// 사용자가 알림을 열었을 때의 진입 상태와 메시지 정보를 함께 보관한다.
export interface NotificationOpenEvent {
  source: NotificationOpenSource;
  message: NotificationMessage;
  receivedAt: number;
}
