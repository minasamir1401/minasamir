import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Get messages for a specific user
router.get('/:userId', protect, async (req, res) => {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.params.userId },
          { receiverId: req.params.userId }
        ]
      },
      include: {
        sender: true,
        receiver: true,
        job: true
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Send a message
router.post('/', protect, async (req, res) => {
  try {
    const { text, senderId, receiverId, jobId } = req.body;
    const newMessage = await prisma.message.create({
      data: {
        text,
        senderId,
        receiverId,
        jobId: jobId || null
      }
    });
    res.status(201).json(newMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default router;
