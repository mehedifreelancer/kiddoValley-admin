import { useCallback } from "react";
import { toast } from "react-hot-toast";

export const usePathao = () => {
  const createPathaoOrder = useCallback((orderData: any) => {
    // TODO: Implement Pathao API integration
    console.log("Pathao order:", orderData);
    toast.info("Pathao order created (mock)");
  }, []);
  return { createPathaoOrder };
};
