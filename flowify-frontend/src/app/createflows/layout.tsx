import AuthGuard from "@/components/auth/AuthGuard";

export default function CreateFlowsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}