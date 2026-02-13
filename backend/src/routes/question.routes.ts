import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Validation schema
const questionSchema = z.object({
  formId: z.string().uuid(),
  title: z.string().min(1, 'Question title is required'),
  description: z.string().optional(),
  type: z.enum(['SHORT_TEXT', 'LONG_TEXT', 'MULTIPLE_CHOICE', 'CHECKBOX']),
  isRequired: z.boolean().optional(),
  order: z.number().int().min(0),
  options: z.array(z.string()).optional() // untuk multiple choice dan checkbox
});

// Create question (Admin only)
router.post('/', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = questionSchema.parse(req.body);

    // Verify form ownership
    const form = await prisma.form.findUnique({ where: { id: data.formId } });
    if (!form || form.createdById !== req.user!.id) {
      return res.status(403).json({ error: true, message: 'Access denied' });
    }

    const question = await prisma.question.create({
      data: {
        ...data,
        options: data.options || []
      }
    });

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// Get questions by form ID
router.get('/form/:formId', async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;

    const questions = await prisma.question.findMany({
      where: { formId },
      orderBy: { order: 'asc' }
    });

    res.json({ success: true, data: questions });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// Update question (Admin only)
router.put('/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = questionSchema.partial().parse(req.body);

    // Verify ownership through form
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
      include: { form: true }
    });

    if (!existingQuestion) {
      return res.status(404).json({ error: true, message: 'Question not found' });
    }
    if (existingQuestion.form.createdById !== req.user!.id) {
      return res.status(403).json({ error: true, message: 'Access denied' });
    }

    const question = await prisma.question.update({
      where: { id },
      data
    });

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// Delete question (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const existingQuestion = await prisma.question.findUnique({
      where: { id },
      include: { form: true }
    });

    if (!existingQuestion) {
      return res.status(404).json({ error: true, message: 'Question not found' });
    }
    if (existingQuestion.form.createdById !== req.user!.id) {
      return res.status(403).json({ error: true, message: 'Access denied' });
    }

    await prisma.question.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// Bulk update question orders
router.patch('/reorder', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { questions } = req.body; // Array of { id, order }

    if (!Array.isArray(questions)) {
      return res.status(400).json({ error: true, message: 'Invalid input' });
    }

    // Update all questions in transaction
    await prisma.$transaction(
      questions.map((q: any) =>
        prisma.question.update({
          where: { id: q.id },
          data: { order: q.order }
        })
      )
    );

    res.json({
      success: true,
      message: 'Questions reordered successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

export default router;
