import { AuthFlowPage } from "../../../components/flow-pages";

export default async function OtpFlowPage() {
  return AuthFlowPage({
    slug: "otp-verify",
    fields: [{ label: "OTP code", placeholder: "Enter 6-digit code" }],
    actionLabel: "Verify OTP"
  });
}

