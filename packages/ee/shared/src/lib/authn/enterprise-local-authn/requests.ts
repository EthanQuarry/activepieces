import { ApId } from '@activepieces/shared'
import { Static, Type } from '@sinclair/typebox'

export const VerifyEmailRequestBody = Type.Object({
    userId: ApId,
    otp: Type.String(),
})
export type VerifyEmailRequestBody = Static<typeof VerifyEmailRequestBody>;

export const ResetPasswordRequestBody = Type.Object({
    userId: ApId,
    otp: Type.String(),
    newPassword: Type.String(),
})
export type ResetPasswordRequestBody = Static<typeof ResetPasswordRequestBody>;
