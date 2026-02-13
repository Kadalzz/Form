import { PrismaClient } from '@prisma/client';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

// ============ PRISMA CLIENT (singleton for serverless) ============
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ============ AUTH MIDDLEWARE ============
interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: true, message: 'Authentication token required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ error: true, message: 'Invalid or expired token' });
  }
};

const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') return res.status(403).json({ error: true, message: 'Admin access required' });
  next();
};

// ============ EXPRESS APP ============
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ VALIDATION SCHEMAS ============
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['ADMIN', 'USER']).optional()
});
const loginSchema = z.object({ email: z.string().email(), password: z.string() });
const formSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  isPublished: z.boolean().optional(),
  headerImage: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  themeColor: z.string().optional().nullable(),
});
const questionSchema = z.object({
  formId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['SHORT_TEXT', 'LONG_TEXT', 'MULTIPLE_CHOICE', 'CHECKBOX', 'LINEAR_SCALE', 'SECTION_HEADER']),
  isRequired: z.boolean().optional(),
  order: z.number().int().min(0),
  options: z.array(z.string()).optional()
});
const answerSchema = z.object({
  questionId: z.string(),
  value: z.union([z.string(), z.array(z.string())])
});
const responseSchema = z.object({
  formId: z.string(),
  answers: z.array(answerSchema)
});

// ============ HEALTH CHECK ============
app.get('/api', (_req: Request, res: Response) => {
  res.json({ message: 'Form Builder API is running!', version: '1.0.0', timestamp: new Date().toISOString() });
});

// ============ AUTH ROUTES ============
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = registerSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ error: true, message: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: role || 'USER' },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.status(201).json({ success: true, message: 'User registered successfully', data: { user, token } });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: true, message: 'Validation error', details: error.errors });
    console.error('Register error:', error);
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: true, message: 'Invalid credentials' });
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) return res.status(401).json({ error: true, message: 'Invalid credentials' });
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
    res.json({
      success: true,
      message: 'Login successful',
      data: { user: { id: user.id, email: user.email, name: user.name, role: user.role }, token }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: true, message: 'Validation error', details: error.errors });
    console.error('Login error:', error);
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.get('/api/auth/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: true, message: 'Token required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ error: true, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch {
    res.status(401).json({ error: true, message: 'Invalid token' });
  }
});

// ============ FORM ROUTES ============
app.post('/api/forms', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = formSchema.parse(req.body);
    const form = await prisma.form.create({
      data: { ...data, createdById: req.user!.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        questions: true
      }
    });
    res.status(201).json({ success: true, message: 'Form created successfully', data: form });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: true, message: 'Validation error', details: error.errors });
    console.error('Create form error:', error);
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.get('/api/forms', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const forms = await prisma.form.findMany({
      where: { createdById: req.user!.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        questions: { orderBy: { order: 'asc' } },
        _count: { select: { responses: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: forms });
  } catch (error: any) {
    console.error('Get forms error:', error);
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.get('/api/forms/:id', async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        questions: { orderBy: { order: 'asc' } },
        _count: { select: { responses: true } }
      }
    });
    if (!form) return res.status(404).json({ error: true, message: 'Form not found' });
    if (!form.isPublished) {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(403).json({ error: true, message: 'This form is not published' });
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        if (decoded.id !== form.createdById) return res.status(403).json({ error: true, message: 'Access denied' });
      } catch {
        return res.status(403).json({ error: true, message: 'This form is not published' });
      }
    }
    res.json({ success: true, data: form });
  } catch (error: any) {
    console.error('Get form error:', error);
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.put('/api/forms/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = formSchema.partial().parse(req.body);
    const existingForm = await prisma.form.findUnique({ where: { id: req.params.id } });
    if (!existingForm) return res.status(404).json({ error: true, message: 'Form not found' });
    if (existingForm.createdById !== req.user!.id) return res.status(403).json({ error: true, message: 'Access denied' });
    const form = await prisma.form.update({
      where: { id: req.params.id },
      data,
      include: { questions: { orderBy: { order: 'asc' } }, _count: { select: { responses: true } } }
    });
    res.json({ success: true, message: 'Form updated successfully', data: form });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: true, message: 'Validation error', details: error.errors });
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.delete('/api/forms/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const existingForm = await prisma.form.findUnique({ where: { id: req.params.id } });
    if (!existingForm) return res.status(404).json({ error: true, message: 'Form not found' });
    if (existingForm.createdById !== req.user!.id) return res.status(403).json({ error: true, message: 'Access denied' });
    await prisma.form.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Form deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.patch('/api/forms/:id/publish', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findUnique({ where: { id: req.params.id } });
    if (!form) return res.status(404).json({ error: true, message: 'Form not found' });
    if (form.createdById !== req.user!.id) return res.status(403).json({ error: true, message: 'Access denied' });
    const updatedForm = await prisma.form.update({
      where: { id: req.params.id },
      data: { isPublished: req.body.isPublished ?? !form.isPublished }
    });
    res.json({ success: true, message: `Form ${updatedForm.isPublished ? 'published' : 'unpublished'} successfully`, data: updatedForm });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// ============ QUESTION ROUTES ============
app.post('/api/questions', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = questionSchema.parse(req.body);
    const form = await prisma.form.findUnique({ where: { id: data.formId } });
    if (!form || form.createdById !== req.user!.id) return res.status(403).json({ error: true, message: 'Access denied' });
    const question = await prisma.question.create({ data: { ...data, options: data.options || [] } });
    res.status(201).json({ success: true, message: 'Question created successfully', data: question });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: true, message: 'Validation error', details: error.errors });
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.get('/api/questions/form/:formId', async (req: Request, res: Response) => {
  try {
    const questions = await prisma.question.findMany({ where: { formId: req.params.formId }, orderBy: { order: 'asc' } });
    res.json({ success: true, data: questions });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.put('/api/questions/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const data = questionSchema.partial().parse(req.body);
    const existing = await prisma.question.findUnique({ where: { id: req.params.id }, include: { form: true } });
    if (!existing) return res.status(404).json({ error: true, message: 'Question not found' });
    if (existing.form.createdById !== req.user!.id) return res.status(403).json({ error: true, message: 'Access denied' });
    const question = await prisma.question.update({ where: { id: req.params.id }, data });
    res.json({ success: true, message: 'Question updated successfully', data: question });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: true, message: 'Validation error', details: error.errors });
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.delete('/api/questions/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.question.findUnique({ where: { id: req.params.id }, include: { form: true } });
    if (!existing) return res.status(404).json({ error: true, message: 'Question not found' });
    if (existing.form.createdById !== req.user!.id) return res.status(403).json({ error: true, message: 'Access denied' });
    await prisma.question.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.patch('/api/questions/reorder', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions)) return res.status(400).json({ error: true, message: 'Invalid input' });
    await prisma.$transaction(
      questions.map((q: any) => prisma.question.update({ where: { id: q.id }, data: { order: q.order } }))
    );
    res.json({ success: true, message: 'Questions reordered successfully' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// ============ RESPONSE ROUTES ============
app.post('/api/responses', async (req: AuthRequest, res: Response) => {
  try {
    const { formId, answers } = responseSchema.parse(req.body);
    const form = await prisma.form.findUnique({ where: { id: formId }, include: { questions: true } });
    if (!form) return res.status(404).json({ error: true, message: 'Form not found' });
    if (!form.isPublished) return res.status(403).json({ error: true, message: 'This form is not accepting responses' });

    // Validate required questions
    const requiredQuestions = form.questions.filter(q => q.isRequired);
    const answeredIds = answers.map(a => a.questionId);
    for (const rq of requiredQuestions) {
      if (!answeredIds.includes(rq.id)) {
        return res.status(400).json({ error: true, message: `Question "${rq.title}" is required` });
      }
    }

    // Get responder if authenticated
    let responderId: string | null = null;
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
        responderId = decoded.id;
      } catch {}
    }

    const response = await prisma.response.create({
      data: {
        formId,
        responderId,
        answers: { create: answers.map(a => ({ questionId: a.questionId, value: a.value })) }
      },
      include: { answers: { include: { question: true } } }
    });
    res.status(201).json({ success: true, message: 'Response submitted successfully', data: response });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: true, message: 'Validation error', details: error.errors });
    console.error('Submit response error:', error);
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.get('/api/responses/form/:formId', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findUnique({ where: { id: req.params.formId } });
    if (!form || form.createdById !== req.user!.id) return res.status(403).json({ error: true, message: 'Access denied' });
    const responses = await prisma.response.findMany({
      where: { formId: req.params.formId },
      include: {
        responder: { select: { id: true, name: true, email: true } },
        answers: { include: { question: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: responses });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.get('/api/responses/form/:formId/stats', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findUnique({ where: { id: req.params.formId } });
    if (!form || form.createdById !== req.user!.id) return res.status(403).json({ error: true, message: 'Access denied' });
    const totalResponses = await prisma.response.count({ where: { formId: req.params.formId } });
    const responses = await prisma.response.findMany({
      where: { formId: req.params.formId },
      include: { answers: { include: { question: true } } }
    });

    const questionStats: any = {};
    responses.forEach(r => r.answers.forEach(a => {
      if (!questionStats[a.questionId]) {
        questionStats[a.questionId] = {
          questionId: a.questionId, questionTitle: a.question.title,
          questionType: a.question.type, totalAnswers: 0, answers: {}
        };
      }
      questionStats[a.questionId].totalAnswers++;
      if (Array.isArray(a.value)) {
        (a.value as string[]).forEach(v => {
          questionStats[a.questionId].answers[v] = (questionStats[a.questionId].answers[v] || 0) + 1;
        });
      } else {
        const v = a.value as string;
        questionStats[a.questionId].answers[v] = (questionStats[a.questionId].answers[v] || 0) + 1;
      }
    }));

    res.json({ success: true, data: { totalResponses, questionStats: Object.values(questionStats) } });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.get('/api/responses/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const response = await prisma.response.findUnique({
      where: { id: req.params.id },
      include: {
        form: true,
        responder: { select: { id: true, name: true, email: true } },
        answers: { include: { question: true } }
      }
    });
    if (!response) return res.status(404).json({ error: true, message: 'Response not found' });
    if (response.form.createdById !== req.user!.id) return res.status(403).json({ error: true, message: 'Access denied' });
    res.json({ success: true, data: response });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

app.delete('/api/responses/:id', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const response = await prisma.response.findUnique({ where: { id: req.params.id }, include: { form: true } });
    if (!response) return res.status(404).json({ error: true, message: 'Response not found' });
    if (response.form.createdById !== req.user!.id) return res.status(403).json({ error: true, message: 'Access denied' });
    await prisma.response.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Response deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: true, message: error.message || 'Server error' });
  }
});

// ============ EXPORT ROUTES ============
app.get('/api/export/excel/:formId', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const ExcelJS = require('exceljs');
    const form = await prisma.form.findUnique({
      where: { id: req.params.formId },
      include: { questions: { orderBy: { order: 'asc' } } }
    });
    if (!form || form.createdById !== req.user!.id) return res.status(403).json({ error: true, message: 'Access denied' });

    const responses = await prisma.response.findMany({
      where: { formId: req.params.formId },
      include: {
        responder: { select: { name: true, email: true } },
        answers: { include: { question: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Responses');

    // Title rows
    worksheet.addRow([form.title]);
    worksheet.addRow([form.description || '']);
    worksheet.addRow([]);

    // Header row
    const headers = ['No', 'Timestamp', 'Responder Name', 'Responder Email',
      ...form.questions.map((q: any) => q.title)];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };

    // Data rows
    responses.forEach((r: any, i: number) => {
      const row: any[] = [
        i + 1,
        r.createdAt.toLocaleString(),
        r.responder?.name || 'Anonymous',
        r.responder?.email || '-'
      ];
      form.questions.forEach((q: any) => {
        const answer = r.answers.find((a: any) => a.questionId === q.id);
        row.push(answer ? (Array.isArray(answer.value) ? answer.value.join(', ') : answer.value) : '-');
      });
      worksheet.addRow(row);
    });

    worksheet.columns.forEach((col: any) => { if (col) col.width = 20; });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${form.title}_responses.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: true, message: error.message || 'Export failed' });
  }
});

app.get('/api/export/pdf/:formId', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const PDFDocument = require('pdfkit');
    const form = await prisma.form.findUnique({
      where: { id: req.params.formId },
      include: { questions: { orderBy: { order: 'asc' } } }
    });
    if (!form || form.createdById !== req.user!.id) return res.status(403).json({ error: true, message: 'Access denied' });

    const responses = await prisma.response.findMany({
      where: { formId: req.params.formId },
      include: {
        responder: { select: { name: true, email: true } },
        answers: { include: { question: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${form.title}_responses.pdf"`);
    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text(form.title, { align: 'center' });
    doc.moveDown();
    if (form.description) {
      doc.fontSize(12).font('Helvetica').text(form.description, { align: 'center' });
      doc.moveDown();
    }
    doc.fontSize(10).text(`Total Responses: ${responses.length}`, { align: 'center' });
    doc.moveDown(2);

    // Responses
    responses.forEach((r: any, i: number) => {
      if (doc.y > 700) doc.addPage();
      doc.fontSize(14).font('Helvetica-Bold').text(`Response #${i + 1}`);
      doc.fontSize(10).font('Helvetica')
        .text(`Responder: ${r.responder?.name || 'Anonymous'}`)
        .text(`Email: ${r.responder?.email || '-'}`)
        .text(`Submitted: ${r.createdAt.toLocaleString()}`);
      doc.moveDown();

      form.questions.forEach((q: any) => {
        const answer = r.answers.find((a: any) => a.questionId === q.id);
        doc.fontSize(11).font('Helvetica-Bold').text(q.title);
        doc.fontSize(10).font('Helvetica').text(
          answer ? `  ${Array.isArray(answer.value) ? answer.value.join(', ') : answer.value}` : '  (No answer)'
        );
        doc.moveDown(0.5);
      });

      doc.moveDown(1);
      doc.strokeColor('#CCCCCC').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);
    });

    doc.end();
  } catch (error: any) {
    console.error('PDF export error:', error);
    if (!res.headersSent) res.status(500).json({ error: true, message: error.message || 'Export failed' });
  }
});

// ============ ERROR HANDLER ============
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: true, message: err.message || 'Internal Server Error' });
});

// Export for Vercel Serverless
export default app;
