import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Get jobs (optional filter by clientId)
router.get('/', async (req, res) => {
  try {
    const { clientId } = req.query;
    const where = clientId ? { clientId: String(clientId) } : {};
    
    const jobs = await prisma.job.findMany({
      where,
      include: { 
        client: true, 
        proposals: {
           include: { developer: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
});

// Get single job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: { 
        client: true, 
        proposals: {
           include: { developer: true }
        }
      }
    });
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch job" });
  }
});

// Create a job
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, budget, technologies, clientId } = req.body;
    const newJob = await prisma.job.create({
      data: {
        title,
        description,
        budget: parseFloat(budget),
        technologies,
        clientId
      }
    });
    res.status(201).json(newJob);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create job" });
  }
});

// Update job status
router.put('/:id/status', protect, async (req, res) => {
   try {
     const { status } = req.body;
     const updated = await prisma.job.update({
        where: { id: req.params.id },
        data: { status }
     });
     res.json(updated);
   } catch (err) {
      res.status(500).json({ error: "Failed to update job status" });
   }
});

export default router;
