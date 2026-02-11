import { Metadata } from "next";
import SSMTestForm from "./ssm-test-form";
import ServerStatusIndicator from "./server-status-indicator";

export const metadata: Metadata = {
  title: "SSM Verification Test | System Settings",
  description: "Test and verify SSM document extraction and auto-filling.",
};

export default function SSMVerificationTestPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SSM Verification Test</h1>
          <p className="text-muted-foreground">
            Upload sample SSM certificates to test the OCR extraction and auto-fill capabilities.
          </p>
        </div>
        <ServerStatusIndicator />
      </div>
      <SSMTestForm />
    </div>
  );
}
