"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { GestureEngine, GestureResult } from "@/engine/gesture/GestureEngine";
import { useGestureStore } from "@/stores/useGestureStore";
import { HandLandmark } from "@/types";

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recognizerRef = useRef<import("@mediapipe/tasks-vision").GestureRecognizer | null>(null);
  const engineRef = useRef<GestureEngine>(new GestureEngine());
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const readyRef = useRef<boolean>(false);
  const errorCountRef = useRef<number>(0);
  const [cameraReady, setCameraReady] = useState(false);

  const {
    setTracking,
    setCurrentGesture,
    setHandDetected,
    setLandmarks,
  } = useGestureStore();

  const drawHandSkeleton = useCallback((landmarks: HandLandmark[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    if (!landmarks || landmarks.length === 0) return;

    const connections = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17],
    ];

    ctx.strokeStyle = "rgba(59,130,246,0.6)";
    ctx.lineWidth = 2;
    for (const [a, b] of connections) {
      const pa = landmarks[a], pb = landmarks[b];
      if (pa && pb) {
        ctx.beginPath();
        ctx.moveTo((1-pa.x)*w, pa.y*h);
        ctx.lineTo((1-pb.x)*w, pb.y*h);
        ctx.stroke();
      }
    }
    for (let i = 0; i < landmarks.length; i++) {
      const p = landmarks[i];
      const x = (1-p.x)*w, y = p.y*h;
      const isTip = [4,8,12,16,20].includes(i);
      ctx.beginPath();
      ctx.arc(x, y, isTip?5:3, 0, Math.PI*2);
      ctx.fillStyle = isTip?"rgba(6,182,212,0.9)":"rgba(59,130,246,0.7)";
      ctx.fill();
    }
    const thumb = landmarks[4], index = landmarks[8];
    if (thumb && index) {
      const dist = Math.hypot(thumb.x-index.x, thumb.y-index.y);
      if (dist < 0.1) {
        ctx.beginPath();
        ctx.moveTo((1-thumb.x)*w, thumb.y*h);
        ctx.lineTo((1-index.x)*w, index.y*h);
        ctx.strokeStyle = `rgba(255,215,0,${1-dist/0.1})`;
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
  }, []);

  const startTracking = useCallback(async () => {
    try {
      setTracking("initializing");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width:{ideal:640}, height:{ideal:480}, facingMode:"user" },
      });
      streamRef.current = stream;

      const video = document.createElement("video");
      video.setAttribute("playsinline","");
      video.setAttribute("autoplay","");
      video.muted = true;
      video.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none";
      document.body.appendChild(video);
      video.srcObject = stream;
      await video.play();
      videoRef.current = video;
      setCameraReady(true);

      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      canvas.style.cssText = "position:fixed;bottom:80px;left:16px;width:160px;height:120px;border-radius:8px;border:1px solid rgba(59,130,246,0.2);background:rgba(5,5,16,0.8);z-index:55;pointer-events:none";
      document.body.appendChild(canvas);
      canvasRef.current = canvas;

      // Suppress TensorFlow/MediaPipe console.error during entire lifecycle
      const _origError = console.error;
      const _origWarn = console.warn;
      console.error = () => {};
      console.warn = () => {};

      const vision = await import("@mediapipe/tasks-vision");
      const { GestureRecognizer, FilesetResolver } = vision;
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      const recognizer = await GestureRecognizer.createFromOptions(filesetResolver, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });

      // Restore after init
      console.error = _origError;
      console.warn = _origWarn;

      recognizerRef.current = recognizer;
      readyRef.current = true;
      lastTimestampRef.current = 0;
      errorCountRef.current = 0;
      setTracking("active");

      const tick = () => {
        if (!readyRef.current) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        const rec = recognizerRef.current;
        const vid = videoRef.current;
        if (!rec || !vid || vid.readyState < 2 || !vid.videoWidth || !vid.videoHeight) {
          animFrameRef.current = requestAnimationFrame(tick);
          return;
        }

        const rawNow = performance.now();
        const ts = Math.max(rawNow, lastTimestampRef.current + 1);
        lastTimestampRef.current = ts;

        let result: import("@mediapipe/tasks-vision").GestureRecognizerResult | null = null;
        try {
          console.error = () => {};
          console.warn = () => {};
          result = rec.recognizeForVideo(vid, ts);
        } catch {
          errorCountRef.current++;
          if (errorCountRef.current > 50) {
            readyRef.current = false;
            console.error = _origError;
            console.warn = _origWarn;
            setTracking("error");
            return;
          }
        } finally {
          console.error = _origError;
          console.warn = _origWarn;
        }

        if (result && result.landmarks && result.landmarks.length > 0) {
          errorCountRef.current = 0; // Reset on success
          const lm: HandLandmark[] = result.landmarks[0].map((p: { x: number; y: number; z: number }) => ({
            x: p.x, y: p.y, z: p.z,
          }));

          drawHandSkeleton(result.landmarks[0]);
          setHandDetected(true);
          setLandmarks(lm);
          setTracking("active");

          const mpGesture =
            result.gestures && result.gestures.length > 0
              ? result.gestures[0][0]
              : null;

          const gesture: GestureResult = engineRef.current.process(
            lm, ts,
            mpGesture ? { name: mpGesture.categoryName, score: mpGesture.score } : null
          );
          setCurrentGesture(gesture);
        } else {
          const c = canvasRef.current;
          if (c) { const ctx = c.getContext("2d"); if (ctx) ctx.clearRect(0,0,c.width,c.height); }
          setHandDetected(false);
          setTracking("inactive");
        }

        animFrameRef.current = requestAnimationFrame(tick);
      };

      animFrameRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.error("Hand tracking init failed:", err);
      setTracking("error");
    }
  }, [setTracking, setHandDetected, setLandmarks, setCurrentGesture, drawHandSkeleton]);

  const stopTracking = useCallback(() => {
    readyRef.current = false;
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (videoRef.current) { videoRef.current.srcObject = null; videoRef.current.remove(); videoRef.current = null; }
    if (canvasRef.current) { canvasRef.current.remove(); canvasRef.current = null; }
    if (recognizerRef.current) { try{recognizerRef.current.close();}catch{} recognizerRef.current = null; }
    engineRef.current.reset();
    setTracking("inactive");
  }, [setTracking]);

  useEffect(() => {
    return () => {
      readyRef.current = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.remove();
      if (canvasRef.current) canvasRef.current.remove();
      if (recognizerRef.current) { try{recognizerRef.current.close();}catch{} }
    };
  }, []);

  return { startTracking, stopTracking, cameraReady, videoRef };
}
