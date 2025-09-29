// src/components/Preloader.jsx
import React from "react";
import styled from "styled-components";

export default function Preloader({ videoSrc }) {
  return (
    <LoaderWrap>
      <Video autoPlay muted playsInline>
        <source src={videoSrc} type="video/mp4" />
      </Video>
    </LoaderWrap>
  );
}

const LoaderWrap = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: black;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Video = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;
