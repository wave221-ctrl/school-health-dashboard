import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Toaster } from 'sonner';


export const metadata: Metadata = {
    title: "School Health Calculator",
    description: "Track your school's health year over year",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ClerkProvider>
            <html lang="en">
                <body>{children}</body>
            </html>
        </ClerkProvider>
    );
    return (
        <html lang="en">
            <body>
                {children}
                <Toaster
                    position="top-center"
                    richColors
                    closeButton
                // Optional: theme="light" or match your emerald branding
                />
            </body>
        </html>
    );
}