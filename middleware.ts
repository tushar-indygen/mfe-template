import { auth } from "@/auth"
import authConfig from "@/config/auth.config.json"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isPublicRoute = authConfig.publicRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  const isPublicAsset =
    /\.(svg|png|jpg|jpeg|gif|webp|ico|txt|xml|woff|woff2|ttf|otf)$/.test(
      nextUrl.pathname
    )

  if (
    isAuthRoute ||
    isPublicRoute ||
    isPublicAsset ||
    process.env.NEXT_PUBLIC_DISABLE_AUTH === "true"
  ) {
    return
  }

  if (!isLoggedIn) {
    return Response.redirect(
      new URL(authConfig.redirects.unauthorized, nextUrl)
    )
  }
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
