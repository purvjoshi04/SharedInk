import { AxiosError } from "axios";
import { toast } from "sonner";

interface ApiError {
    message?: string;
    errors?: Record<string, string[]>;
}

interface StatusMessage {
    message: string;
    toastTitle: string;
    toastDescription: string;
}

export function handleAuthError(
    error: unknown,
    setErrors: (errors: Record<string, string>) => void,
    setApiError: (msg: string) => void,
    statusMessages: Record<number, StatusMessage> = {},
) {
    if (!(error instanceof AxiosError)) {
        setApiError("An unexpected error occurred. Please try again.");
        toast.error("Unexpected error", { description: "Please try again." });
        console.error("Auth error:", error);
        return;
    }

    const axiosError = error as AxiosError<ApiError>;

    if (!axiosError.response) {
        if (axiosError.request) {
            setApiError("Unable to connect to server. Please check your internet connection.");
            toast.error("Connection error", { description: "Please check your internet connection." });
        } else {
            setApiError("An unexpected error occurred. Please try again.");
            toast.error("Unexpected error", { description: "Please try again." });
        }
        return;
    }

    const { status, data } = axiosError.response;

    if (status === 400 && data?.errors) {
        const newErrors: Record<string, string> = {};
        Object.entries(data.errors).forEach(([key, messages]) => {
            newErrors[key] = messages[0];
        });
        setErrors(newErrors);
        toast.error("Validation failed", { description: "Please check your input." });
        return;
    }

    if (statusMessages[status]) {
        const { message, toastTitle, toastDescription } = statusMessages[status];
        setApiError(message);
        toast.error(toastTitle, { description: toastDescription });
        return;
    }

    if (status === 500 || status === 502 || status === 503) {
        setApiError("Server error. Please try again later.");
        toast.error("Server error", { description: "Please try again later." });
        return;
    }

    if (status === 400) {
        setApiError(data?.message || "Invalid request. Please check your input.");
        toast.error("Invalid request", { description: "Please check your input and try again." });
        return;
    }

    setApiError(data?.message || "An error occurred. Please try again.");
    toast.error("Error", { description: data?.message || "An error occurred." });
}