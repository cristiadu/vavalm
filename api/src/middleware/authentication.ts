import * as express from "express"
import jwt, { JwtPayload } from 'jsonwebtoken'

interface CustomJwtPayload extends JwtPayload {
  scopes: string[],
}

export function expressAuthentication(
  request: express.Request,
  securityName: string,
  scopes?: string[],
): Promise<CustomJwtPayload> {
  if (securityName === "BearerAuth") {
    const authHeader = request.headers["authorization"]
    const token = typeof authHeader === 'string' ? authHeader.split("Bearer ")[1] : undefined

    if (!token) {
      return Promise.reject(new Error("No token provided"))
    }

    return new Promise((resolve, reject) => {
      if (!token) {
        reject(new Error("No token provided"))
        return
      }

      if (!process.env.JWT_SECRET) {
        reject(new Error("JWT_SECRET is not defined"))
        return Promise.reject(new Error("JWT_SECRET is not defined"))
      }

      jwt.verify(
        token,
        process.env.JWT_SECRET,
        { algorithms: ['HS256'] },
        (err: jwt.VerifyErrors | null, decoded: unknown) => {
          if (err) {
            reject(err)
            return
          }

          const payload = decoded as CustomJwtPayload

          // Check if JWT contains all required scopes
          if (scopes && scopes.length > 0) {
            for (const scope of scopes) {
              if (!payload.scopes?.includes(scope)) {
                reject(new Error("JWT does not contain required scope."))
                return
              }
            }
          }

          resolve(payload)
        },
      )
    })
  }

  return Promise.reject(new Error(`Security scheme ${securityName} is not supported`))
}
