import React, { useState, useRef, useEffect } from 'react';
import RecordRTC from 'recordrtc';

interface ScreenRecorderProps {
  isRecording: boolean;
  onRecordingComplete: (videoUrl: string) => void;
  onPermissionGranted?: () => void;
  screenStream?: MediaStream; // 直接从用户手势上下文传递的屏幕流
}

export const ScreenRecorder: React.FC<ScreenRecorderProps> = ({ isRecording, onRecordingComplete, onPermissionGranted, screenStream: propScreenStream }) => {
  const [recorder, setRecorder] = useState<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);

  // Start recording when isRecording becomes true
  useEffect(() => {
    if (isRecording && !recorder) {
      startRecording();
    }

    return () => {
      // Cleanup if component unmounts while recording
      if (recorder) {
        stopRecording();
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      // Use the screen stream provided from parent component (already in user gesture context)
      let screenStream = propScreenStream;
      
      // Validate that we have a screen stream
      if (!screenStream) {
        console.warn('没有获取到屏幕流，将跳过屏幕录制功能');
        return; // 静默返回，不抛出错误
      }
      
      // Verify screen video tracks exist
      const screenVideoTracks = screenStream.getVideoTracks();
      if (screenVideoTracks.length === 0) {
        console.warn('无法获取屏幕视频轨道，将跳过屏幕录制功能');
        return; // 静默返回，不抛出错误
      }
      
      // Just use the provided screen stream directly
      streamRef.current = screenStream;
      
      // Create recorder using screen stream
      const newRecorder = RecordRTC(screenStream, {
        type: 'video',
        mimeType: 'video/mp4',
        timeSlice: 1000,
        disableLogs: false
      });

      newRecorder.startRecording();
      setRecorder(newRecorder);
      
      // Request fullscreen when recording starts (still in user gesture context)
      if (onPermissionGranted) {
        onPermissionGranted();
      }

      // Handle when screen recording stream ends
      screenVideoTracks[0].onended = () => {
        stopRecording();
      };
    } catch (error) {
      console.error('开始录制时发生错误:', error);
      
      // 只在出现实际错误时显示提示，避免在正常跳过录制时显示
      if (propScreenStream) { // 只有在提供了屏幕流但仍出错时才显示提示
        let errorMsg = `录像功能遇到问题:\n\n`;
        errorMsg += error instanceof Error ? error.message : '未知错误';
        alert(errorMsg);
      }
      
      // 重置状态
      onRecordingComplete('');
    }
  };

  const stopRecording = () => {
    if (recorder && streamRef.current) {
      recorder.stopRecording(() => {
        // Get the recorded blob
        const blob = recorder.getBlob();
        // Create download URL
        const videoUrl = URL.createObjectURL(blob);
        
        // Notify parent component that recording is complete
        onRecordingComplete(videoUrl);

        // Cleanup all tracks
        recorder.destroy();
        streamRef.current?.getTracks().forEach(track => track.stop());
        setRecorder(null);
        streamRef.current = null;
      });
    }
  };

  // Stop recording when isRecording becomes false
  useEffect(() => {
    if (!isRecording && recorder) {
      stopRecording();
    }
  }, [isRecording]);

  return null; // This component doesn't render anything
};
