import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign in — SharedInk",
    description: "Sign in to your SharedInk account and jump back onto your collaborative whiteboards.",
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
    return children;
}