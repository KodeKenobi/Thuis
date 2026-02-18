import { router } from "expo-router";
import { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

export type InteractionType = "navigate" | "scroll" | "tap" | "wait";

export interface Interaction {
  type: InteractionType;
  timestamp: number;
  data: {
    route?: string;
    scrollY?: number;
    scrollX?: number;
    target?: string;
    duration?: number; // for wait actions
  };
}

class InteractionRecorder {
  private interactions: Interaction[] = [];
  private isRecording = false;
  private startTime = 0;

  startRecording() {
    this.interactions = [];
    this.isRecording = true;
    this.startTime = Date.now();
    console.log("[InteractionRecorder] Started recording");
  }

  stopRecording() {
    this.isRecording = false;
    console.log(
      `[InteractionRecorder] Stopped recording. Captured ${this.interactions.length} interactions`
    );
    return this.interactions;
  }

  recordNavigation(route: string) {
    if (!this.isRecording) return;

    this.interactions.push({
      type: "navigate",
      timestamp: Date.now() - this.startTime,
      data: { route },
    });
  }

  recordScroll(scrollY: number, scrollX: number = 0) {
    if (!this.isRecording) return;

    // Throttle scroll events (only record every 100ms)
    const lastScroll = this.interactions
      .filter((i) => i.type === "scroll")
      .pop();

    if (
      lastScroll &&
      Date.now() - (this.startTime + lastScroll.timestamp) < 100
    ) {
      // Update last scroll instead of adding new one
      lastScroll.data.scrollY = scrollY;
      lastScroll.data.scrollX = scrollX;
      return;
    }

    this.interactions.push({
      type: "scroll",
      timestamp: Date.now() - this.startTime,
      data: { scrollY, scrollX },
    });
  }

  recordTap(target: string) {
    if (!this.isRecording) return;

    this.interactions.push({
      type: "tap",
      timestamp: Date.now() - this.startTime,
      data: { target },
    });
  }

  recordWait(duration: number) {
    if (!this.isRecording) return;

    this.interactions.push({
      type: "wait",
      timestamp: Date.now() - this.startTime,
      data: { duration },
    });
  }

  getInteractions(): Interaction[] {
    return [...this.interactions];
  }

  clear() {
    this.interactions = [];
  }
}

export const interactionRecorder = new InteractionRecorder();
