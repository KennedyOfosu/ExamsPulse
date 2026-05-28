import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { parseOffice } from 'officeparser';
import { writeFile, unlink } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const SUPPORTED_TYPES = {
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'pptx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

/**
 * Extract plain text from a file Buffer.
 * Supports PDF, PPTX, PPTX (legacy), DOCX.
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @param {string} filename
 * @returns {Promise<string>}
 */
export const extractText = async (buffer, mimetype, filename) => {
  const type = SUPPORTED_TYPES[mimetype] || guessTypeFromFilename(filename);

  if (!type) {
    throw new Error(`Unsupported file type: ${mimetype}. Please upload a PDF or PowerPoint file.`);
  }

  if (type === 'pdf') {
    return extractFromPDF(buffer);
  } else {
    return extractFromOffice(buffer, filename);
  }
};

const guessTypeFromFilename = (filename = '') => {
  const ext = filename.toLowerCase().split('.').pop();
  if (ext === 'pdf') return 'pdf';
  if (['ppt', 'pptx'].includes(ext)) return 'pptx';
  if (['doc', 'docx'].includes(ext)) return 'docx';
  return null;
};

const extractFromPDF = async (buffer) => {
  try {
    const data = await pdfParse(buffer);
    const text = data.text?.trim();
    if (!text || text.length < 50) {
      throw new Error('Could not extract readable text. The PDF may be scanned or image-based.');
    }
    return text;
  } catch (err) {
    if (err.message.includes('readable text')) throw err;
    throw new Error('Failed to parse PDF: ' + err.message);
  }
};

const extractFromOffice = async (buffer, filename) => {
  // officeparser v6 uses magic bytes for Buffer input, but PPTX/DOCX look like ZIP.
  // Write to a named temp file so it uses the extension for format detection.
  const ext = filename.split('.').pop().toLowerCase();
  const tmpPath = join(tmpdir(), `ep_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  try {
    await writeFile(tmpPath, buffer);
    const ast = await parseOffice(tmpPath);
    const cleaned = ast.toText()?.trim();
    if (!cleaned || cleaned.length < 20) {
      throw new Error(`Could not extract readable text from "${filename}". The file may be empty or image-based.`);
    }
    return cleaned;
  } catch (err) {
    if (err.message.includes('readable text')) throw err;
    throw new Error(`Failed to parse "${filename}": ` + err.message);
  } finally {
    unlink(tmpPath).catch(() => {});
  }
};
