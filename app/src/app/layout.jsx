import "./globals.css";
import { AuthProvider } from "../context/AuthContext";

export const metadata = {
  title: "Ordinis AI",
  description: "Personal Finance Assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full w-full">
      <body className="h-full w-full bg-[#131314] text-white overflow-hidden">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
