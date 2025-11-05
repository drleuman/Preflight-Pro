
/// <reference lib="webworker" />
import { PreflightWorkerCommand, PreflightWorkerMessage, PreflightResult, Issue, Severity, IssueCategory, Bbox } from '../types';
import { defaultProfile } from '../profiles/defaultProfile';

// This is the worker's main message handler.
// It will be assigned to `self.onmessage` by the SystemJS loader in App.tsx.
const onmessage = (event: MessageEvent<PreflightWorkerCommand>) => {
  if (event.data.type === 'analyze') {
    const { fileMeta, samplePageCount } = event.data;
    console.log(`Worker: Starting analysis for ${fileMeta.name} (${fileMeta.size} bytes)...`);

    // Simulate analysis time
    setTimeout(() => {
      try {
        const result = defaultProfile.analyze(fileMeta, samplePageCount);
        self.postMessage({ type: 'analysisResult', result } as PreflightWorkerMessage);
        console.log("Worker: Analysis complete.");
      } catch (error: any) {
        console.error("Worker: Analysis error:", error);
        self.postMessage({ type: 'analysisError', message: error.message || 'Unknown analysis error' } as PreflightWorkerMessage);
      }
    }, 2000); // 2 seconds delay
  }
};

export default { onmessage };
