import React, { useState } from "react";
import axios from "axios";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

type CSVFileImportProps = {
  url: string;
  title: string;
};

export default function CSVFileImport({ url, title }: CSVFileImportProps) {
  const [file, setFile] = useState<File | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const uploadFile = async () => {
    if (!file) {
      console.error("No file selected!");
      return;
    }

    try {
      console.log("Getting Pre-Signed URL...");

      // Gọi API để lấy Pre-Signed URL
      const response = await axios.get(url, {
        params: { name: encodeURIComponent(file.name) },
      });

      const presignedUrl = response.data; // URL upload S3
      console.log("Pre-Signed URL received:", presignedUrl);

      console.log("Uploading file to S3...");
      const uploadResponse = await fetch(presignedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (uploadResponse.ok) {
        console.log("✅ Upload thành công!");
        alert("Upload thành công!");
      } else {
        console.error("❌ Upload thất bại!", uploadResponse);
        alert("Upload thất bại!");
      }
    } catch (error) {
      console.error("Lỗi khi upload file:", error);
      alert("Lỗi khi upload file!");
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {!file ? (
        <input type="file" accept=".csv" onChange={onFileChange} />
      ) : (
        <div>
          <button onClick={removeFile}>Remove file</button>
          <button onClick={uploadFile}>Upload file</button>
        </div>
      )}
    </Box>
  );
}
