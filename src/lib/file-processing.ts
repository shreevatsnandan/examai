// src/lib/file-processing.ts
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { DocxLoader } from 'langchain/document_loaders/fs/docx';

export async function extractTextFromFile(file: File): Promise<string> {
  const fileType = file.type;
  let loader;

  // Create temporary file path
  const tempFilePath = `/tmp/${file.name}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());
  await fs.promises.writeFile(tempFilePath, fileBuffer);

  try {
    // Choose appropriate loader based on file type
    if (fileType === 'application/pdf') {
      loader = new PDFLoader(tempFilePath);
    } else if (fileType === 'text/plain') {
      loader = new TextLoader(tempFilePath);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      loader = new DocxLoader(tempFilePath);
    } else {
      throw new Error('Unsupported file type');
    }

    const docs = await loader.load();
    return docs.map(doc => doc.pageContent).join('\n\n');
  } finally {
    // Clean up temporary file
    await fs.promises.unlink(tempFilePath);
  }
}