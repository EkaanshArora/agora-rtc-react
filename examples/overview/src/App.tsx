import "./App.css";

import type { UID } from "agora-rtc-sdk-ng";
import AgoraRTC from "agora-rtc-sdk-ng";
import { useEffect, useMemo, useState } from "react";

import {
  AgoraRTCProvider,
  CameraVideoTrack,
  MicrophoneAudioTrack,
  RemoteUser,
  useAwaited,
  useClientEvent,
  usePublishedRemoteUsers,
  useRemoteUsers,
  useSafePromise,
} from "agora-rtc-react";

AgoraRTC.setLogLevel(/* warning */ 2);
const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

(window as any).AgoraRTC = AgoraRTC;
(window as any).client = client;

export const App = () => {
  const sp = useSafePromise();

  const [connectionState, setConnectionState] = useState(client.connectionState);
  useClientEvent(client, "connection-state-change", setConnectionState);

  const [uid, setUID] = useState<UID>(0);
  const users = useRemoteUsers(client);
  const published = usePublishedRemoteUsers(client);

  const [mic, setMic] = useState(false);
  const pAudioTrack = useMemo(() => (mic ? AgoraRTC.createMicrophoneAudioTrack() : null), [mic]);
  const audioTrack = useAwaited(pAudioTrack);
  useEffect(() => {
    if (audioTrack && connectionState === "CONNECTED") {
      client.publish(audioTrack).catch(console.error);
      return () => void client.unpublish(audioTrack);
    }
  }, [audioTrack, connectionState]);

  const [camera, setCamera] = useState(false);
  const pVideoTrack = useMemo(() => (camera ? AgoraRTC.createCameraVideoTrack() : null), [camera]);
  const videoTrack = useAwaited(pVideoTrack);
  useEffect(() => {
    if (videoTrack && connectionState === "CONNECTED") {
      client.publish(videoTrack).catch(console.error);
      return () => void client.unpublish(videoTrack);
    }
  }, [videoTrack, connectionState]);

  const joinChannel = async () => {
    const uid = await sp(
      client.join(
        import.meta.env.AGORA_APPID,
        import.meta.env.AGORA_CHANNEL,
        import.meta.env.AGORA_TOKEN,
        null, // use random uid assigned by Agora server
      ),
    );
    console.log("join channel ok, uid =", uid);
    setUID(uid);
  };

  const leaveChannel = async () => {
    await sp(client.leave());
    setUID(0);
  };

  return (
    <>
      <div className="row local-tracks">
        {mic && <MicrophoneAudioTrack track={pAudioTrack} />}
        {camera && <CameraVideoTrack className="local-video-track" track={pVideoTrack} play />}
        <div className="local-tracks-controls">
          <label>
            <input type="checkbox" checked={mic} onChange={e => setMic(e.target.checked)} />
            <span>Microphone</span>
          </label>
          <label>
            <input type="checkbox" checked={camera} onChange={e => setCamera(e.target.checked)} />
            <span>Camera</span>
          </label>
        </div>
      </div>
      <div className="row">
        <span>Channel: '{import.meta.env.AGORA_CHANNEL}'</span>&emsp;
        <button onClick={joinChannel} disabled={connectionState !== "DISCONNECTED"}>
          JOIN
        </button>
        &nbsp;
        <button onClick={leaveChannel} disabled={connectionState === "DISCONNECTED"}>
          LEAVE
        </button>
        &emsp;
        <span className={"state-" + connectionState.toLowerCase()}>({connectionState})</span>&emsp;
        <span>UID: {uid}</span>
      </div>
      <div className="row">Remote Users: [{users.map(e => e.uid).join(",")}]</div>
      <div className="row users">
        <AgoraRTCProvider client={client}>
          {published.map(user => (
            <RemoteUser key={user.uid} user={user} videoOn audioOn />
          ))}
        </AgoraRTCProvider>
      </div>
    </>
  );
};

export default App;
