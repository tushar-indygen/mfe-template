interface TokenResponse {
  access_token: string
  refresh_token?: string
  refresh_expires_in?: number
  expires_in: number
  [key: string]: unknown
}

// Validate required environment variables
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER

if (!KEYCLOAK_CLIENT_ID || !KEYCLOAK_CLIENT_SECRET || !KEYCLOAK_ISSUER) {
  console.warn(
    "Warning: Missing required Keycloak environment variables: KEYCLOAK_CLIENT_ID, KEYCLOAK_CLIENT_SECRET, KEYCLOAK_ISSUER. Authentication will not work correctly."
  )
}

const getParams = () => ({
  client_id: KEYCLOAK_CLIENT_ID,
  client_secret: KEYCLOAK_CLIENT_SECRET,
  grant_type: "refresh_token",
})

const getBaseUrl = () => {
  return `${KEYCLOAK_ISSUER}/protocol/openid-connect`
}

export const refreshTokenRequest = async (refresh_token: string) => {
  const params = new URLSearchParams({
    refresh_token,
    ...getParams(),
  })

  const response = await fetch(`${getBaseUrl()}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  })

  const data = await response.json()

  return {
    status: response.status,
    data: data as TokenResponse,
  }
}

export const logoutRequest = async (refresh_token: string) => {
  const params = new URLSearchParams({
    refresh_token,
    ...getParams(),
  })

  return fetch(`${getBaseUrl()}/logout`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  })
}
