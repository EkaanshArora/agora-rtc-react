import type {
  IAgoraRTCClient,
  IAgoraRTCError,
  IMicrophoneAudioTrack,
  MicrophoneAudioTrackInitConfig,
} from "agora-rtc-sdk-ng";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useState } from "react";

import { AgoraRTCReactError } from "../error";

import { useAsyncEffect, useIsUnmounted } from "./tools";
import { useIsConnected } from "./useIsConnected";

/**
 * This hook lets you create a local microphone audio track.
 *
 * @param `ready` {boolean} Whether it is ready to create the track. The default value is `true`.
 * @param `audioTrackConfig` {MicrophoneAudioTrackInitConfig} Configurations for initializing the microphone audio track. The default is `{ ANS: true, AEC: true }`. See [`MicrophoneAudioTrackInitConfig`](https://docportal.shengwang.cn/cn/live-streaming-premium-4.x/API%20Reference/web_ng/interfaces/microphoneaudiotrackinitconfig.html) for details.
 * @param `client` {IAgoraRTCClient | null} Created using the Web SDK's [`IAgoraRTC.createClient`](https://docportal.shengwang.cn/cn/video-call-4.x/API%20Reference/web_ng/interfaces/iagorartc.html#createclient) method.
 * @return localMicrophoneTrack IMicrophoneAudioTrack | null
 * @return isLoading boolean
 * @return error AgoraRTCReactError | null
 * @example
 * ```jsx
 * import { useLocalMicrophoneTrack } from "agora-rtc-react";
 *
 * function App() {
 *   const audioTrack = useLocalMicrophoneTrack(true, { ANS: true, AEC: true });
 *
 *   return <></>;
 * }
 * ```
 */
export function useLocalMicrophoneTrack(
  ready = true,
  audioTrackConfig: MicrophoneAudioTrackInitConfig = { ANS: true, AEC: true },
  client?: IAgoraRTCClient,
): {
  localMicrophoneTrack: IMicrophoneAudioTrack | null;
  isLoading: boolean;
  error: AgoraRTCReactError | null;
} {
  const isConnected = useIsConnected(client);
  const [track, setTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AgoraRTCReactError | null>(null);
  const isUnmountRef = useIsUnmounted();

  useAsyncEffect(async () => {
    if (isConnected && ready && !track) {
      try {
        if (!isUnmountRef.current) {
          setIsLoading(true);
        }
        const result = await AgoraRTC.createMicrophoneAudioTrack(audioTrackConfig);
        if (!isUnmountRef.current) {
          setTrack(result);
        }
      } catch (err) {
        console.error(err);
        if (!isUnmountRef.current) {
          setError(
            new AgoraRTCReactError("IAgoraRTC.createMicrophoneAudioTrack", err as IAgoraRTCError),
          );
        }
      }
      if (!isUnmountRef.current) {
        setIsLoading(false);
      }
    }
    if (!isConnected && !isUnmountRef.current) {
      setTrack(null);
    }
  }, [isConnected, ready]);
  return { localMicrophoneTrack: track, isLoading: isLoading, error: error };
}
