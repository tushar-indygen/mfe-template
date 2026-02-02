import { auth } from "@/auth"
import { UserModel } from "@/types/user"
import MainLayoutClient from "@/app/(main)/main-layout-client"

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  // Cast session.user to UserModel as it contains the extended fields (roles, tenant_id)
  const user = (session?.user as UserModel) || null

  return <MainLayoutClient user={user}>{children}</MainLayoutClient>
}
