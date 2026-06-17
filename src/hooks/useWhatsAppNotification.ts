import { useCallback } from "react";
import { toast } from "react-hot-toast";

export const useWhatsAppNotification = () => {
  const sendNotification = useCallback((orderData: any) => {
    // TODO: Replace with actual WhatsApp API call
    console.log("WhatsApp notification:", orderData);
    toast.success("WhatsApp notification sent (mock)");
  }, []);
  return { sendNotification };
};
