import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Validation schema
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  isPublished: z.boolean().optional(),
  headerImage: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  themeColor: z.string().optional().nullable(),
});

// Create form (Admin only)
router.post('/', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = formSchema.parse(req.body);

    const form = await prisma.form.create({
      data: {
        ...data,
        createdById: req.user!.id
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        questions: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Form created successfully',
      data: form
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// Get all forms (Admin only)
router.get('/', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const forms = await prisma.form.findMany({
      where: { createdById: req.user!.id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        questions: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { responses: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: forms });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// Get single form by ID (Public jika published, Admin untuk draft)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const form = await prisma.form.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        questions: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: { responses: true }
        }
      }
    });

    if (!form) {
      return res.status(404).json({ error: true, message: 'Form not found' });
    }

    // Check if user has access (published forms are public)
    if (!form.isPublished) {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(403).json({ error: true, message: 'This form is not published' });
      }

      try {
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET) as any;
        if (decoded.id !== form.createdById) {
          return res.status(403).json({ error: true, message: 'Access denied' });
        }
      } catch {
        return res.status(403).json({ error: true, message: 'This form is not published' });
      }
    }

    res.json({ success: true, data: form });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// Update form (Admin only)
router.put('/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = formSchema.partial().parse(req.body);

    // Verify ownership
    const existingForm = await prisma.form.findUnique({ where: { id } });
    if (!existingForm) {
      return res.status(404).json({ error: true, message: 'Form not found' });
    }
    if (existingForm.createdById !== req.user!.id) {
      return res.status(403).json({ error: true, message: 'Access denied' });
    }

    const form = await prisma.form.update({
      where: { id },
      data,
      include: {
        questions: { orderBy: { order: 'asc' } },
        _count: { select: { responses: true } }
      }
    });

    res.json({
      success: true,
      message: 'Form updated successfully',
      data: form
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// Delete form (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existingForm = await prisma.form.findUnique({ where: { id } });
    if (!existingForm) {
      return res.status(404).json({ error: true, message: 'Form not found' });
    }
    if (existingForm.createdById !== req.user!.id) {
      return res.status(403).json({ error: true, message: 'Access denied' });
    }

    await prisma.form.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Form deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// Publish/Unpublish form
router.patch('/:id/publish', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const form = await prisma.form.findUnique({ where: { id } });
    if (!form) {
      return res.status(404).json({ error: true, message: 'Form not found' });
    }
    if (form.createdById !== req.user!.id) {
      return res.status(403).json({ error: true, message: 'Access denied' });
    }

    const updatedForm = await prisma.form.update({
      where: { id },
      data: { isPublished: isPublished ?? !form.isPublished }
    });

    res.json({
      success: true,
      message: `Form ${updatedForm.isPublished ? 'published' : 'unpublished'} successfully`,
      data: updatedForm
    });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

export default router;
