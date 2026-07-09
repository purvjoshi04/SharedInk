import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Create your account — SharedInk",
    description: "Create a free SharedInk account and start drawing on an infinite collaborative canvas with your team.",
};

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
    return children;
}