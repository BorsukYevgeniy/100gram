export interface AddOtpToUserPayload {
  userId: number;
  otpHash: string;
  otpExpiresAt: Date;
}
