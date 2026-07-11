import { Hono } from 'hono'
import { RPCHandler } from '@orpc/server/fetch'
import { itemHandler } from './handler'
import { createAuth } from './auth'

export type Env = {
  Bindings: {
    DB: D1Database
    BETTER_AUTH_URL: string
    BETTER_AUTH_SECRET: string
  }
  Variables: {
    userId: string | null
  }
}

const app = new Hono<Env>()

// better-auth handler
const getAuth = (c: { env: Env['Bindings'] }) => createAuth(c.env)
app.on(['GET', 'POST'], '/api/auth/*', (c) => {
  return getAuth(c).handler(c.req.raw)
})

// oRPC RPC handler
const orpcHandler = new RPCHandler(itemHandler)

app.use('/rpc/*', async (c, next) => {
  const { matched, response } = await orpcHandler.handle(c.req.raw, {
    prefix: '/rpc',
    context: { db: c.env.DB, user: null },
  })
  if (matched) {
    return c.newResponse(response.body, response)
  }
  await next()
})

app.get('/health', (c) => c.json({ status: 'ok' }))

export default app
