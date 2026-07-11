import { os } from '@orpc/server'
import { listItems, getItem, createItem, deleteItem, itemRouter } from './contract'

function genId(): string {
  return crypto.randomUUID()
}

function now(): string {
  return new Date().toISOString()
}

function mapRow(row: any) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const itemHandler = os.router({
  listItems: listItems.handler(async ({ context }) => {
    const { db, user } = context as { db: D1Database; user?: { id: string } }
    if (!user) return []
    const stmt = db.prepare('SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC')
    const rows = stmt.all(user.id) as any[]
    return rows.map(mapRow)
  }),

  getItem: getItem.handler(async ({ input, context }) => {
    const { db } = context as { db: D1Database }
    const stmt = db.prepare('SELECT * FROM items WHERE id = ?')
    const row = stmt.first(input.id) as any | null
    return row ? mapRow(row) : null
  }),

  createItem: createItem.handler(async ({ input, context }) => {
    const { db, user } = context as { db: D1Database; user?: { id: string } }
    if (!user) throw new Error('Unauthorized')
    const id = genId()
    const ts = now()
    db.prepare(
      'INSERT INTO items (id, user_id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, user.id, input.title, input.content ?? null, ts, ts)
    return { id, userId: user.id, title: input.title, content: input.content, createdAt: ts, updatedAt: ts }
  }),

  deleteItem: deleteItem.handler(async ({ input, context }) => {
    const { db } = context as { db: D1Database }
    db.prepare('DELETE FROM items WHERE id = ?').run(input.id)
  }),
})
