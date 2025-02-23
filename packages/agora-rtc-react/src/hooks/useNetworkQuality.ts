import type { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { useEffect, useState } from "react";

import { useRTCClient } from "../hooks/useRTCClient";
import { listen } from "../misc/listen";
import type { NetworkQuality } from "../types";

const initQuality = (): NetworkQuality => ({
  uplink: 0,
  downlink: 0,
  delay: 0,
});

/**
 * Returns the network quality of the local user.
 *
 * @param `client` {IAgoraRTCClient | null} Created using the Web SDK's [`IAgoraRTC.createClient`](https://docportal.shengwang.cn/cn/video-call-4.x/API%20Reference/web_ng/interfaces/iagorartc.html#createclient) method.
 * @return NetworkQuality The network quality of the local user. See NetworkQuality for details.
 * @example
 * ```jsx
 * import { useNetworkQuality } from "agora-rtc-react";
 *
 * function App() {
 *   const networkQuality = useNetworkQuality();
 *
 *   return <div>{networkQuality}</div>;
 * }
 * ```
 */
export function useNetworkQuality(client?: IAgoraRTCClient | null): NetworkQuality {
  const resolvedClient = useRTCClient(client);

  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>(initQuality);
  useEffect(() => {
    if (resolvedClient) {
      return listen(resolvedClient, "network-quality", q =>
        setNetworkQuality({
          uplink: q.uplinkNetworkQuality,
          downlink: q.downlinkNetworkQuality,
          delay: resolvedClient.getRTCStats().RTT ?? 0,
        }),
      );
    } else {
      setNetworkQuality(initQuality());
    }
  }, [resolvedClient]);

  return networkQuality;
}
