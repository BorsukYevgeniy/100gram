export const enum UserPattern {
  GET_BY_ID = 'user.getById',
  ASSIGN_ADMIN = 'user.assignAdmin',
  CREATE = 'user.create',
  FIND_BY_EMAIL = 'user.findByEmail',
  FIND_FULL_USER_BY_ID = 'user.findFullUserById',
  VERIFY = 'user.verify',
  GET_BY_VERIFICATION_CODE = 'user.getUserByVerificationCode',
  CREATE_GOOGLE_USER = 'user.createGoogleUser',
  ADD_OTP_TO_USER = 'user.addOtpToUser',
  INCREMENT_OTP_ATTEMPTS = 'user.incrementOtpAttempts',
  RESET_PASSWORD_WITH_OTP = 'user.resetPasswordWithOtp',
  DELETE = 'user.delete',
}
