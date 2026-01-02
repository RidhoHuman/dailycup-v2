const formidable = require('formidable');
const fs = require('fs').promises;
const path = require('path');
const { MAX_FILE_SIZE, ALLOWED_FILE_TYPES, UPLOAD_DIR } = require('../config/constants');
const { getFileExtension, generateRandomString } = require('../utils/helpers');

// Parse multipart form data (file upload)
async function parseMultipartForm(req, uploadDir = 'products') {
  return new Promise((resolve, reject) => {
    const uploadPath = path.join(UPLOAD_DIR, uploadDir);
    
    const form = formidable({
      uploadDir: uploadPath,
      keepExtensions: false,
      maxFileSize: MAX_FILE_SIZE,
      multiples: true,
      filter: function({ mimetype }) {
        return ALLOWED_FILE_TYPES.includes(mimetype);
      }
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      try {
        // Process uploaded files
        const processedFiles = {};
        
        for (const key in files) {
          const file = Array.isArray(files[key]) ? files[key] : [files[key]];
          const processed = [];

          for (const f of file) {
            if (f && f.filepath) {
              const ext = getFileExtension(f.originalFilename || '');
              const newFilename = `${generateRandomString(16)}.${ext}`;
              const newPath = path.join(uploadPath, newFilename);

              // Rename file
              await fs.rename(f.filepath, newPath);
              
              processed.push({
                filename: newFilename,
                originalName: f.originalFilename,
                mimetype: f.mimetype,
                size: f.size,
                path: path.join(uploadDir, newFilename)
              });
            }
          }

          processedFiles[key] = processed.length === 1 ? processed[0] : processed;
        }

        // Process fields (convert arrays to single values where appropriate)
        const processedFields = {};
        for (const key in fields) {
          const value = fields[key];
          processedFields[key] = Array.isArray(value) && value.length === 1 ? value[0] : value;
        }

        resolve({
          fields: processedFields,
          files: processedFiles
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

// Delete uploaded file
async function deleteUploadedFile(filePath) {
  try {
    const fullPath = path.join(UPLOAD_DIR, filePath);
    await fs.unlink(fullPath);
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

// Ensure upload directories exist
async function ensureUploadDirs() {
  const dirs = ['products', 'reviews', 'returns', 'payment_proofs'];
  
  for (const dir of dirs) {
    const dirPath = path.join(UPLOAD_DIR, dir);
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dir}:`, error);
    }
  }
}

module.exports = {
  parseMultipartForm,
  deleteUploadedFile,
  ensureUploadDirs
};
