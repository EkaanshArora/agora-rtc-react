import type {
  IAgoraRTCClient,
  IAgoraRTCError,
  IAgoraRTCRemoteUser,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
} from "agora-rtc-sdk-ng";
import { useEffect, useRef, useState } from "react";

import { AgoraRTCReactError } from "../error";
import { useRTCClient } from "../hooks/useRTCClient";
import { listen } from "../misc/listen";
import type { AsyncTaskRunner } from "../misc/utils";
import { createAsyncTaskRunner, joinDisposers } from "../misc/utils";

import { useIsConnected } from "./useIsConnected";

/**
 * This hook lets you retrieve the audio or video track of a remote user.
 *
 * @param `user` {IAgoraRTCRemoteUser | undefined} The remote user.
 * @param `mediaType` {"video" | "audio"} The media type. Pass `"video"` or `"audio"`.
 * @param `client` {IAgoraRTCClient | null} Created using the Web SDK's [`IAgoraRTC.createClient`](https://docportal.shengwang.cn/cn/video-call-4.x/API%20Reference/web_ng/interfaces/iagorartc.html#createclient) method.
 * @return track IRemoteVideoTrack | IRemoteAudioTrack | undefined
 * @return isLoading boolean
 * @return error AgoraRTCReactError | null
 * @example
 * ```jsx
 * import { useRemoteUsers, useRemoteUserTrack } from "agora-rtc-react";
 *
 * function App() {
 *   const remoteUsers = useRemoteUsers();
 *
 *   const videoTrack = useRemoteUserTrack(remoteUsers[0], "video");
 *   const audioTrack = useRemoteUserTrack(remoteUsers[0], "audio");
 *
 *   return <></>;
 * }
 * ```
 */
export function useRemoteUserTrack(
  user: IAgoraRTCRemoteUser | undefined,
  mediaType: "video",
  client?: IAgoraRTCClient | null,
): { track: IRemoteVideoTrack | undefined; isLoading: boolean; error: AgoraRTCReactError | null };

export function useRemoteUserTrack(
  user: IAgoraRTCRemoteUser | undefined,
  mediaType: "audio",
  client?: IAgoraRTCClient | null,
): { track: IRemoteAudioTrack | undefined; isLoading: boolean; error: AgoraRTCReactError | null };
export function useRemoteUserTrack(
  user: IAgoraRTCRemoteUser | undefined,
  mediaType: "video" | "audio",
  client?: IAgoraRTCClient | null,
): {
  track: IRemoteVideoTrack | IRemoteAudioTrack | undefined;
  isLoading: boolean;
  error: AgoraRTCReactError | null;
} {
  const resolvedClient = useRTCClient(client);
  const trackName = mediaType === "audio" ? "audioTrack" : "videoTrack";
  const [track, setTrack] = useState(user && user[trackName]);
  const isConnected = useIsConnected();
  const runnerRef = useRef<AsyncTaskRunner | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AgoraRTCReactError | null>(null);

  useEffect(() => {
    if (!user || !isConnected) return;

    let isUnmounted = false;

    if (!isUnmounted) {
      setError(null);
    }

    const hasTrack = mediaType === "audio" ? "hasAudio" : "hasVideo";
    const uid = user.uid;

    const unsubscribe = async (
      user: IAgoraRTCRemoteUser,
      mediaType: "audio" | "video",
    ): Promise<void> => {
      if (user[trackName] && resolvedClient.remoteUsers.some(({ uid }) => user.uid === uid)) {
        try {
          if (!isUnmounted) {
            setIsLoading(true);
          }
          await resolvedClient.unsubscribe(user, mediaType);
        } catch (err) {
          if (!isUnmounted) {
            setError(new AgoraRTCReactError("IAgoraRTCClient.unsubscribe", err as IAgoraRTCError));
          }
          console.error(err);
        }
      }
      if (!isUnmounted) {
        setTrack(void 0);
        setIsLoading(false);
      }
    };

    const subscribe = async (user: IAgoraRTCRemoteUser, mediaType: "audio" | "video") => {
      try {
        if (!user[trackName] && resolvedClient.remoteUsers.some(({ uid }) => user.uid === uid)) {
          if (!isUnmounted) {
            setIsLoading(true);
          }
          await resolvedClient.subscribe(user, mediaType);
        }
        if (!isUnmounted) {
          setTrack(user[trackName]);
        }
      } catch (err) {
        if (!isUnmounted) {
          setError(new AgoraRTCReactError("IAgoraRTCClient.subscribe", err as IAgoraRTCError));
        }
        console.error(err);
      }
      if (!isUnmounted) {
        setIsLoading(false);
      }
    };

    const runner = (runnerRef.current ||= createAsyncTaskRunner());

    if (!user[trackName] && user[hasTrack]) {
      runner.run(() => subscribe(user, mediaType));
    } else {
      setTrack(user[trackName]);
    }

    return joinDisposers([
      () => {
        isUnmounted = true;
        runner.dispose();
      },
      listen(resolvedClient, "user-published", (pubUser, pubMediaType) => {
        if (pubUser.uid === uid && pubMediaType === mediaType) {
          runner.run(() => subscribe(pubUser, mediaType));
        }
      }),
      listen(resolvedClient, "user-unpublished", (pubUser, pubMediaType) => {
        if (pubUser.uid === uid && pubMediaType === mediaType) {
          runner.run(() => unsubscribe(pubUser, mediaType));
        }
      }),
    ]);
  }, [isConnected, resolvedClient, user, mediaType, trackName]);

  return { track: track, isLoading: isLoading, error: error };
}
