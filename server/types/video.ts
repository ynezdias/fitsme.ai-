export type VideoRole = "publisher";

export interface VideoRoomResponse {
  success: true;
  room: {
    sessionId: string;
    applicationId: string;
  };
}

export interface VideoCredentialsResponse {
  success: true;
  credentials: {
    applicationId: string;
    sessionId: string;
    token: string;
  };
}
