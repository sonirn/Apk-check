import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CloudUpload, FileArchive, AlertCircle, CheckCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function FileUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('apk', file);
      
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Upload Successful",
        description: `APK file uploaded successfully. Analysis ID: ${data.id}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/analyses'] });
    },
    onError: (error) => {
      setIsUploading(false);
      setUploadProgress(0);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload APK file",
        variant: "destructive",
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "APK file must be less than 100MB",
          variant: "destructive",
        });
        return;
      }
      uploadMutation.mutate(file);
    }
  }, [uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.android.package-archive': ['.apk'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  return (
    <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
      <CardContent className="p-8">
        <div className="text-center">
          <CloudUpload className="mx-auto h-16 w-16 text-blue-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Upload APK File for Security Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Drag and drop your APK file or click to browse
          </p>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 transition-colors cursor-pointer ${
              isDragActive
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            
            {isUploading ? (
              <div className="space-y-4">
                <div className="animate-spin mx-auto h-12 w-12 border-4 border-blue-400 border-t-transparent rounded-full" />
                <div>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">Uploading...</p>
                  <Progress value={uploadProgress} className="mt-2 max-w-xs mx-auto" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {uploadProgress}% complete
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <FileArchive className="mx-auto h-12 w-12 text-gray-400" />
                <div>
                  <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                    {isDragActive ? "Drop the APK file here" : "Choose APK file"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Supports .apk files up to 100MB
                  </p>
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isUploading}
                >
                  Select File
                </Button>
              </div>
            )}
          </div>

          {/* Upload Guidelines */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-left">
                <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                  Security Analysis Guidelines
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• Only upload APK files you have permission to analyze</li>
                  <li>• Analysis includes comprehensive security vulnerability scanning</li>
                  <li>• Results are stored securely and can be deleted at any time</li>
                  <li>• Large files may take several minutes to analyze</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
