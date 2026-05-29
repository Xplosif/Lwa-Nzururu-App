import { Router, type IRouter } from "express";
import { db, messagesTable, usersTable } from "@workspace/db";
import { eq, or, and, desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/messages/unread-count", async (req, res): Promise<void> => {
  if (!req.session?.userId) { res.status(401).json({ error: "Non authentifie" }); return; }
  const userId = req.session.userId;

  const unread = await db
    .select()
    .from(messagesTable)
    .where(and(eq(messagesTable.toUserId, userId), eq(messagesTable.isRead, false)));

  res.json({ count: unread.length });
});

router.get("/messages", async (req, res): Promise<void> => {
  if (!req.session?.userId) { res.status(401).json({ error: "Non authentifie" }); return; }
  const userId = req.session.userId;
  const withUserId = parseInt(req.query.withUserId as string);
  if (!withUserId || isNaN(withUserId)) { res.status(400).json({ error: "withUserId requis" }); return; }

  const msgs = await db
    .select({
      id: messagesTable.id,
      fromUserId: messagesTable.fromUserId,
      toUserId: messagesTable.toUserId,
      content: messagesTable.content,
      isRead: messagesTable.isRead,
      createdAt: messagesTable.createdAt,
      fromFullName: usersTable.fullName,
    })
    .from(messagesTable)
    .leftJoin(usersTable, eq(messagesTable.fromUserId, usersTable.id))
    .where(
      or(
        and(eq(messagesTable.fromUserId, userId), eq(messagesTable.toUserId, withUserId)),
        and(eq(messagesTable.fromUserId, withUserId), eq(messagesTable.toUserId, userId))
      )
    )
    .orderBy(desc(messagesTable.createdAt))
    .limit(100);

  await db
    .update(messagesTable)
    .set({ isRead: true })
    .where(and(eq(messagesTable.fromUserId, withUserId), eq(messagesTable.toUserId, userId)));

  res.json(msgs.reverse());
});

router.post("/messages", async (req, res): Promise<void> => {
  if (!req.session?.userId) { res.status(401).json({ error: "Non authentifie" }); return; }
  const fromUserId = req.session.userId;
  const { toUserId, content } = req.body;
  if (!toUserId || typeof content !== "string" || !content.trim()) {
    res.status(400).json({ error: "toUserId et content requis" }); return;
  }

  const [msg] = await db.insert(messagesTable).values({ fromUserId, toUserId, content: content.trim() }).returning();

  const [fromUser] = await db.select().from(usersTable).where(eq(usersTable.id, fromUserId));

  res.status(201).json({ ...msg, fromFullName: fromUser?.fullName || "" });
});

router.get("/messages/conversations", async (req, res): Promise<void> => {
  if (!req.session?.userId) { res.status(401).json({ error: "Non authentifie" }); return; }
  const userId = req.session.userId;

  const sent = await db.select({ partnerId: messagesTable.toUserId }).from(messagesTable).where(eq(messagesTable.fromUserId, userId));
  const received = await db.select({ partnerId: messagesTable.fromUserId }).from(messagesTable).where(eq(messagesTable.toUserId, userId));

  const partnerIds = [...new Set([...sent.map(m => m.partnerId), ...received.map(m => m.partnerId)])];

  const partners = partnerIds.length === 0 ? [] : await Promise.all(
    partnerIds.map(async (partnerId) => {
      const [partner] = await db.select().from(usersTable).where(eq(usersTable.id, partnerId));
      if (!partner) return null;
      const [lastMsg] = await db.select().from(messagesTable)
        .where(or(
          and(eq(messagesTable.fromUserId, userId), eq(messagesTable.toUserId, partnerId)),
          and(eq(messagesTable.fromUserId, partnerId), eq(messagesTable.toUserId, userId))
        ))
        .orderBy(desc(messagesTable.createdAt))
        .limit(1);
      const unread = await db.select().from(messagesTable)
        .where(and(eq(messagesTable.fromUserId, partnerId), eq(messagesTable.toUserId, userId), eq(messagesTable.isRead, false)));
      return {
        userId: partner.id,
        fullName: partner.fullName,
        role: partner.role,
        lastMessage: lastMsg?.content || "",
        lastMessageAt: lastMsg?.createdAt || "",
        unreadCount: unread.length,
      };
    })
  );

  const filtered = partners.filter(Boolean).sort((a, b) => new Date(b!.lastMessageAt).getTime() - new Date(a!.lastMessageAt).getTime());
  res.json(filtered);
});

export default router;
