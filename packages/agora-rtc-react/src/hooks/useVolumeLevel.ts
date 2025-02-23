import type { ILocalAudioTrack, IRemoteAudioTrack } from "agora-rtc-sdk-ng";
import { useEffect, useState } from "react";

import { interval } from "../misc/utils";

/**
 * Returns the volume level of an audio track at a frequency of once per second.
 *
 * @param `audioTrack` {IRemoteAudioTrack | ILocalAudioTrack | undefined} The local or remote audio track. The local audio track can be created by calling [`useLocalMicrophoneTrack`](https://doc.shengwang.cn/api-ref/rtc/react/react-sdk/hooks#uselocalmicrophonetrack). If undefined, the volume level is 0.
 * @return number The volume level. The value range is [0,1]. 1 is the highest volume level. Usually a user with a volume level above 0.6 is a speaking user.
 * @example
 * ```jsx
 * import { useVolumeLevel, useLocalMicrophoneTrack } from "agora-rtc-react";
 *
 * function App() {
 *   const audioTrack = useLocalMicrophoneTrack();
 *   const volumeLevel = useVolumeLevel(audioTrack);
 *
 *   return <div>{volumeLevel}</div>;
 * }
 * ```
 */
export function useVolumeLevel(audioTrack?: IRemoteAudioTrack | ILocalAudioTrack): number {
  const [volumeLevel, setVolumeLevel] = useState(0);

  useEffect(() => {
    if (audioTrack) {
      return interval(() => {
        setVolumeLevel(audioTrack.getVolumeLevel());
      }, 1000);
    }
  }, [audioTrack]);

  return volumeLevel;
}
