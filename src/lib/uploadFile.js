// src/lib/uploadFile.js

const GAS_URL = "https://script.google.com/macros/s/AKfycbwaRvnyRs2gbANVv-jTI-HSi3VGXW_-nQKRTyd7VL9CQlDBwidjvILcNuwn4aB_6Jcl/exec";

export const uploadToDrive = async (file) => {
  if (!file) return null;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Data = reader.result.split(',')[1];
      
      try {
        const response = await fetch(GAS_URL, {
          method: "POST",
          body: JSON.stringify({
            base64: base64Data,
            contentType: file.type,
            fileName: `${Date.now()}-${file.name}`
          }),
        });
        
        const result = await response.json();
        if (result.status === "success") {
          resolve(result.fileUrl); // Mengembalikan link Google Drive
        } else {
          reject(result.message);
        }
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = error => reject(error);
  });
};