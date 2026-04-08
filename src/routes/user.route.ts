import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';
import { protect } from '../middleware/auth.middleware';

const router = Router();
const prisma = new PrismaClient();

// Register user (sync)
router.post('/sync', async (req, res) => {
  try {
    const { email, name, image, role, password, bio, title, phone, skills } = req.body;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      if (!password) return res.status(400).json({ error: "Password required for registration" });
      const hashed = await hashPassword(password);
      user = await prisma.user.create({
        data: {
          email,
          name,
          image,
          password: hashed,
          role: role || "DEVELOPER",
          bio,
          title,
          phone,
          skills
        }
      });
    }
    const { password: _, ...userWithoutPassword } = user as any;
    const token = generateToken(user.id);
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to register/sync user" });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    const { password: _, ...userWithoutPassword } = user as any;
    const token = generateToken(user.id);
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { 
        jobs: true, 
        proposals: true,
        portfolioProjects: true
      }
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to get user" });
  }
});

// Update user profile
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, bio, title, phone, skills, image } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, bio, title, phone, skills, image }
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Portfolio Projects CRUD
// Get all portfolio projects for a user
router.get('/:id/portfolio', async (req, res) => {
  try {
    const projects = await prisma.portfolioProject.findMany({
      where: { userId: req.params.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to get portfolio" });
  }
});

// Create portfolio project
router.post('/:id/portfolio', protect, async (req, res) => {
  try {
    const { title, category, description, liveLink, repoLink, image, gallery, tags } = req.body;
    const project = await prisma.portfolioProject.create({
      data: {
        title,
        category: category || "Full-stack",
        description,
        liveLink,
        repoLink,
        image,
        gallery: gallery ? JSON.stringify(gallery) : null,
        tags: Array.isArray(tags) ? tags.join(',') : tags,
        userId: req.params.id
      }
    });
    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create portfolio project" });
  }
});

// Update portfolio project
router.put('/:id/portfolio/:projectId', protect, async (req, res) => {
  try {
    const { title, category, description, liveLink, repoLink, image, gallery, tags } = req.body;
    const project = await prisma.portfolioProject.update({
      where: { id: req.params.projectId },
      data: {
        title,
        category,
        description,
        liveLink,
        repoLink,
        image,
        gallery: gallery ? JSON.stringify(gallery) : null,
        tags: Array.isArray(tags) ? tags.join(',') : tags,
      }
    });
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update portfolio project" });
  }
});

// Delete portfolio project
router.delete('/:id/portfolio/:projectId', protect, async (req, res) => {
  try {
    await prisma.portfolioProject.delete({
      where: { id: req.params.projectId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete portfolio project" });
  }
});

export default router;
