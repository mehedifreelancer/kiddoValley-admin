import { apiPublic } from "../../apiConfig";

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendOrderEmail = (payload: SendEmailPayload) => {
  return apiPublic.post("email/send", payload);
};