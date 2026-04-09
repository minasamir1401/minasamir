import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Get proposals for a job
router.get('/job/:jobId', async (req, res) => {
  try {
    const proposals = await prisma.proposal.findMany({
      where: { jobId: req.params.jobId },
      include: { developer: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(proposals);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch proposals" });
  }
});

// Create a proposal
router.post('/', protect, async (req, res) => {
  try {
    const { description, budget, developerId, jobId } = req.body;
    const newProposal = await prisma.proposal.create({
      data: {
        description,
        budget: parseFloat(budget),
        developerId,
        jobId
      }
    });
    res.status(201).json(newProposal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create proposal" });
  }
});

// Accept a proposal
router.put('/:id/accept', protect, async (req, res) => {
  try {
    const proposal = await prisma.proposal.update({
      where: { id: req.params.id },
      data: { status: "ACCEPTED" }
    });
    res.json(proposal);
  } catch (error) {
    res.status(500).json({ error: "Failed to accept proposal" });
  }
});

export default router;
