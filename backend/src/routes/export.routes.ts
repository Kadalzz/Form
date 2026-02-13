import { Router, Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { prisma } from '../server';
import { authenticate, isAdmin, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Export responses to Excel
router.get('/excel/:formId', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;

    // Verify form ownership
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        questions: { orderBy: { order: 'asc' } }
      }
    });

    if (!form || form.createdById !== req.user!.id) {
      return res.status(403).json({ error: true, message: 'Access denied' });
    }

    // Get all responses
    const responses = await prisma.response.findMany({
      where: { formId },
      include: {
        responder: {
          select: { name: true, email: true }
        },
        answers: {
          include: {
            question: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Responses');

    // Add header
    worksheet.addRow([form.title]);
    worksheet.addRow([form.description || '']);
    worksheet.addRow([]); // Empty row

    // Add column headers
    const headers = [
      'No',
      'Timestamp',
      'Responder Name',
      'Responder Email',
      ...form.questions.map(q => q.title)
    ];
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data rows
    responses.forEach((response, index) => {
      const row: any[] = [
        index + 1,
        response.createdAt.toLocaleString(),
        response.responder?.name || 'Anonymous',
        response.responder?.email || '-'
      ];

      // Add answers in question order
      form.questions.forEach(question => {
        const answer = response.answers.find(a => a.questionId === question.id);
        if (answer) {
          const value = Array.isArray(answer.value) 
            ? answer.value.join(', ') 
            : answer.value;
          row.push(value);
        } else {
          row.push('-');
        }
      });

      worksheet.addRow(row);
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      if (column) {
        column.width = 20;
      }
    });

    // Send file
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${form.title}_responses.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error: any) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: true, message: error.message || 'Export failed' });
  }
});

// Export responses to PDF
router.get('/pdf/:formId', authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { formId } = req.params;

    // Verify form ownership
    const form = await prisma.form.findUnique({
      where: { id: formId },
      include: {
        questions: { orderBy: { order: 'asc' } }
      }
    });

    if (!form || form.createdById !== req.user!.id) {
      return res.status(403).json({ error: true, message: 'Access denied' });
    }

    // Get all responses
    const responses = await prisma.response.findMany({
      where: { formId },
      include: {
        responder: {
          select: { name: true, email: true }
        },
        answers: {
          include: {
            question: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${form.title}_responses.pdf"`
    );

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
    responses.forEach((response, index) => {
      // Check if we need a new page
      if (doc.y > 700) {
        doc.addPage();
      }

      doc.fontSize(14).font('Helvetica-Bold').text(`Response #${index + 1}`);
      doc.fontSize(10).font('Helvetica')
        .text(`Responder: ${response.responder?.name || 'Anonymous'}`)
        .text(`Email: ${response.responder?.email || '-'}`)
        .text(`Submitted: ${response.createdAt.toLocaleString()}`);
      doc.moveDown();

      // Answers
      form.questions.forEach(question => {
        const answer = response.answers.find(a => a.questionId === question.id);
        
        doc.fontSize(11).font('Helvetica-Bold').text(question.title);
        
        if (answer) {
          const value = Array.isArray(answer.value) 
            ? answer.value.join(', ') 
            : answer.value;
          doc.fontSize(10).font('Helvetica').text(`  ${value}`);
        } else {
          doc.fontSize(10).font('Helvetica').text('  (No answer)');
        }
        
        doc.moveDown(0.5);
      });

      doc.moveDown(1);
      doc.strokeColor('#CCCCCC').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);
    });

    doc.end();
  } catch (error: any) {
    console.error('PDF export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: true, message: error.message || 'Export failed' });
    }
  }
});

export default router;
