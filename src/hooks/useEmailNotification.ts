import { useCallback } from "react";
import { toast } from "react-hot-toast";

interface UseEmailNotificationOptions {
  defaultTo?: string;
  defaultSubject?: string;
  defaultTemplate?: (data: any) => string;
}

export const useEmailNotification = (
  options: UseEmailNotificationOptions = {},
) => {
  const {
    defaultTo = "admin@example.com",
    defaultSubject = "New Order Notification",
    defaultTemplate = (data) => `
      <h2>New Order Created</h2>
      <p><strong>Customer:</strong> ${data.customerName}</p>
      <p><strong>Total:</strong> ${data.total} TK</p>
      <ul>
        ${data.items?.map((item: any) => `<li>${item.productName} x ${item.quantity} = ${item.finalPrice} TK</li>`).join("")}
      </ul>
      <p><strong>Phone:</strong> ${data.customerPhone}</p>
      <p><strong>Address:</strong> ${data.customerAddress}</p>
    `,
  } = options;

  const sendEmail = useCallback(
    async (to?: string, subject?: string, html?: string, variables?: any) => {
      const recipient = to || defaultTo;
      const emailSubject = subject || defaultSubject;
      const emailHtml = html || defaultTemplate(variables || {});

      try {
        // await sendOrderEmail({
        //   to: recipient,
        //   subject: emailSubject,
        //   html: emailHtml,
        // });

        toast.success("Order confirmation email sent dummy");
      } catch (error) {
        console.error("Email send error:", error);
        toast.error("Failed to send email");
      }
    },
    [defaultTo, defaultSubject, defaultTemplate],
  );

  return { sendEmail };
};
