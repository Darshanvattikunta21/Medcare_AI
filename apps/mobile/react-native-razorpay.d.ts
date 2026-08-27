declare module "react-native-razorpay" {
  export interface RazorpayOptions {
    description?: string;
    image?: string;
    currency: string;
    key: string;
    amount: number;
    order_id: string;
    name?: string;
    prefill?: {
      email?: string;
      contact?: string;
      name?: string;
    };
    theme?: {
      color?: string;
    };
    retry?: {
      enabled?: boolean;
      max_count?: number;
    };
    notes?: Record<string, string>;
  }

  export interface RazorpaySuccessResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  export interface RazorpayErrorResponse {
    code: number;
    description: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  }

  const RazorpayCheckout: {
    open(options: RazorpayOptions): Promise<RazorpaySuccessResponse>;
  };

  export default RazorpayCheckout;
}
