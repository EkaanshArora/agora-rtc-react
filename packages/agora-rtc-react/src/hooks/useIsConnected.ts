import type { IAgoraRTCClient } from "agora-rtc-sdk-ng";
import { useEffect, useState } from "react";

import { useRTCClient } from "../hooks/useRTCClient";
import { listen } from "../misc/listen";
import { joinDisposers, timeout } from "../misc/utils";

/**
 * Returns whether the SDK is connected to Agora's server.
 *
 * @param `client` {IAgoraRTCClient | null} Created using the Web SDK's [`IAgoraRTC.createClient`](https://docportal.shengwang.cn/cn/video-call-4.x/API%20Reference/web_ng/interfaces/iagorartc.html#createclient) method.
 * @return boolean <li>true: The SDK is connected to the server.</li><li>false: The SDK is not connected to the server.</li>
 * @example
 * ```jsx
 * import { useIsConnected } from "agora-rtc-react";
 *
 * function App() {
 *   const isConnected = useIsConnected();
 *
 *   return <div>{isConnected}</div>;
 * }
 * ```
 */
export function useIsConnected(client?: IAgoraRTCClient | null): boolean {
  const resolvedClient = useRTCClient(client);

  const [isConnected, setConnected] = useState(
    resolvedClient ? resolvedClient.connectionState === "CONNECTED" : false,
  );
  useEffect(() => {
    if (resolvedClient) {
      setConnected(resolvedClient.connectionState === "CONNECTED");
      let dispose: (() => void) | undefined;
      return joinDisposers([
        listen(resolvedClient, "connection-state-change", state => {
          dispose?.();
          // RTC is really connected after a short delay
          dispose = timeout(() => setConnected(state === "CONNECTED"), 0);
        }),
        () => dispose?.(),
      ]);
    } else {
      setConnected(false);
    }
  }, [resolvedClient]);

  return isConnected;
}
