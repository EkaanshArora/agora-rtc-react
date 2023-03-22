import type { Meta, StoryObj } from "@storybook/react";
import type { LocalMicrophoneAndCameraUserProps } from "./LocalUser";

import { action } from "@storybook/addon-actions";
import {
  createFakeRtcClient,
  FakeCameraVideoTrack,
  FakeMicrophoneAudioTrack,
} from "fake-agora-rtc";
import { useEffect, useMemo, useState } from "react";
import { AgoraRTCProvider } from "../hooks";
import { LocalMicrophoneAndCameraUser } from "./LocalUser";

const meta: Meta<LocalMicrophoneAndCameraUserProps> = {
  title: "Prebuilt/LocalUser",
  component: LocalMicrophoneAndCameraUser,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "light" },
  },
};

export default meta;

export interface OverviewProps {
  micOn: boolean;
  cameraOn: boolean;
}

type OverviewArgs = OverviewProps & Omit<LocalMicrophoneAndCameraUserProps, keyof OverviewProps>;

export const Overview: StoryObj<OverviewArgs> = {
  args: {
    micOn: false,
    cameraOn: false,
    playVideo: false,
    playAudio: false,
    style: { borderRadius: 8 },
    cover: "http://placekitten.com/200/200",
  },
  render: function RenderLocalUser({ micOn, cameraOn, ...args }: OverviewArgs) {
    const [client] = useState(() =>
      createFakeRtcClient({
        publish: async () => {
          action("IAgoraRTCClient.publish()")();
        },
      }),
    );

    const audioTrack = useMemo(() => {
      return micOn ? FakeMicrophoneAudioTrack.create() : null;
    }, [micOn]);

    const videoTrack = useMemo(() => {
      return cameraOn ? FakeCameraVideoTrack.create() : null;
    }, [cameraOn]);

    useEffect(() => {
      if (client && audioTrack) {
        client.publish(audioTrack);
      }
    }, [client, audioTrack]);

    useEffect(() => {
      if (client && videoTrack) {
        client.publish(videoTrack);
      }
    }, [client, videoTrack]);

    return (
      <AgoraRTCProvider client={client}>
        <LocalMicrophoneAndCameraUser
          audioTrack={audioTrack}
          videoTrack={videoTrack}
          micDisabled={!micOn}
          cameraDisabled={!cameraOn}
          {...args}
        />
      </AgoraRTCProvider>
    );
  },
};
