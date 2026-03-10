import React from "react";
import { useActionState } from "react";
import Button from "../ui/Button";
import InputField from "../ui/InputField";
import Card from "../ui/Card";
import {
  Send,
  User,
  Mail,
  MessageSquare,
  CheckCircle,
  User2,
} from "lucide-react";

interface FormState {
  success: boolean;
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    message?: string[];
  };
}

const ContactForm: React.FC = () => {
  const submitForm = async (
    prevState: FormState,
    formData: FormData,
  ): Promise<FormState> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const message = formData.get("message") as string;

    // Validation
    const errors: any = {};
    if (!name) errors.name = ["Name is required"];
    if (!email) errors.email = ["Email is required"];
    else if (!email.includes("@")) errors.email = ["Invalid email address"];
    if (!message) errors.message = ["Message is required"];
    else if (message.length < 10)
      errors.message = ["Message must be at least 10 characters"];

    if (Object.keys(errors).length > 0) {
      return {
        success: false,
        message: "Please fix the errors below",
        errors,
      };
    }

    // Success
    console.log("Form submitted:", { name, email, message });

    return {
      success: true,
      message: "Form submitted successfully!",
    };
  };

  const [state, formAction, isPending] = useActionState(submitForm, {
    success: false,
    message: "",
  });

  return (
    <Card title="Contact Us" icon={<MessageSquare className="w-5 h-5" />}>
      <form action={formAction} className="space-y-4">
        {/* Success Message */}
        {state.success && (
          <div className="flex items-center gap-2 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">{state.message}</span>
          </div>
        )}

        {/* Error Message */}
        {!state.success && state.message && (
          <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
            {state.message}
          </div>
        )}

        {/* Name Field */}
        <InputField
          label="Full Name"
          name="name"
          type="text"
          placeholder="John Doe"
          icon={<User2 className="w-4 h-4" />}
          error={state.errors?.name?.[0]}
          disabled={isPending}
          isRequired
        />

        {/* Email Field */}
        <InputField
          label="Email Address"
          name="email"
          type="email"
          placeholder="john@example.com"
          icon={<Mail className="w-4 h-4" />}
          error={state.errors?.email?.[0]}
          disabled={isPending}
          isRequired
        />

        {/* Message Field */}
        <InputField
          label="Message"
          name="message"
          type="textarea"
          placeholder="Type your message here..."
          error={state.errors?.message?.[0]}
          disabled={isPending}
          isRequired
          rows={4}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isPending}
          icon={<Send className="w-4 h-4" />}
        >
          {isPending ? "Sending..." : "Send Message"}
        </Button>

        {/* Note about form status */}
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Button shows loading state automatically while form is submitting
        </p>
      </form>
    </Card>
  );
};

export default ContactForm;
