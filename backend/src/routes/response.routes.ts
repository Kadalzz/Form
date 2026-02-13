import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../server';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Validation schema
const answerSchema = z.object({
  questionId: z.string().uuid(),
  value: z.union([z.string(), z.array(z.string())]) // string untuk text, array untuk checkbox
});

const responseSchema = z.object({
  formId: z.string().uuid(),
  answers: z.array(answerSchema)
});

// Submit response (Public untuk published forms)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { formId, answers } = responseSchema.parse(req.body);

    // Check if form exists and is published
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        questions: true
      }
    });

    if (!form) {
      return res.status(404).json({ error: true, message: 'Form not found' });
    }

    if (!form.isPublished) {
      return res.status(403).json({ error: true, message: 'This form is not accepting responses' });
    }

    // Validate required questions
    const requiredQuestions = form.questions.filter(q => q.isRequired);
    const answeredQuestionIds = answers.map(a => a.questionId);
    
    for (const reqQuestion of requiredQuestions) {
      if (!answeredQuestionIds.includes(reqQuestion.id)) {
        return res.status(400).json({
          error: true,
          message: `Question "${reqQuestion.title}" is required`
        });
      }
    }

    // Get responderId if authenticated
    let responderId: string | null = null;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET) as any;
        responderId = decoded.id;
      } catch {
        // Anonymous response
      }
    }

    // Create response with answers in transaction
    const response = await prisma.response.create({
      data: {
        formId,
        responderId,
        answers: {
          create: answers.map(answer => ({
            questionId: answer.questionId,
            value: answer.value
          }))
        }
      },
      include: {
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Response submitted successfully',
      data: response
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// Get all responses for a form (Admin only)
router.get('/form/:formId', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;

    // Verify form ownership
    const form = await prisma.form.findUnique({ where: { id: formId } });
    if (!form || form.createdById !== req.user!.id) {
      return res.status(403).json({ error: true, message: 'Access denied' });
    }

    const responses = await prisma.response.findMany({
      where: { formId },
      include: {
        responder: {
          select: { id: true, name: true, email: true }
        },
        answers: {
          include: {
            question: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: responses });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// Get single response (Admin only)
router.get('/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const response = await prisma.response.findUnique({
      where: { id },
      include: {
        form: true,
        responder: {
          select: { id: true, name: true, email: true }
        },
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    if (!response) {
      return res.status(404).json({ error: true, message: 'Response not found' });
    }

    // Verify ownership
    if (response.form.createdById !== req.user!.id) {
      return res.status(403).json({ error: true, message: 'Access denied' });
    }

    res.json({ success: true, data: response });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// Delete response (Admin only)
router.delete('/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const response = await prisma.response.findUnique({
      where: { id },
      include: { form: true }
    });

    if (!response) {
      return res.status(404).json({ error: true, message: 'Response not found' });
    }

    // Verify ownership
    if (response.form.createdById !== req.user!.id) {
      return res.status(403).json({ error: true, message: 'Access denied' });
    }

    await prisma.response.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Response deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// Get response statistics for a form
router.get('/form/:formId/stats', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;

    // Verify form ownership
    const form = await prisma.form.findUnique({ where: { id: formId } });
    if (!form || form.createdById !== req.user!.id) {
      return res.status(403).json({ error: true, message: 'Access denied' });
    }

    const totalResponses = await prisma.response.count({ where: { formId } });

    const responses = await prisma.response.findMany({
      where: { formId },
      include: {
        answers: {
          include: {
            question: true
          }
        }
      }
    });

    // Calculate statistics per question
    const questionStats: any = {};

    responses.forEach(response => {
      response.answers.forEach(answer => {
        const questionId = answer.questionId;
        const questionTitle = answer.question.title;
        const questionType = answer.question.type;

        if (!questionStats[questionId]) {
          questionStats[questionId] = {
            questionId,
            questionTitle,
            questionType,
            totalAnswers: 0,
            answers: {}
          };
        }

        questionStats[questionId].totalAnswers++;

        // Count answer frequency
        if (Array.isArray(answer.value)) {
          // Checkbox - multiple values
          answer.value.forEach((val: string) => {
            questionStats[questionId].answers[val] = 
              (questionStats[questionId].answers[val] || 0) + 1;
          });
        } else {
          // Single value
          const val = answer.value as string;
          questionStats[questionId].answers[val] = 
            (questionStats[questionId].answers[val] || 0) + 1;
        }
      });
    });

    res.json({
      success: true,
      data: {
        totalResponses,
        questionStats: Object.values(questionStats)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

export default router;
