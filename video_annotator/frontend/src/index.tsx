/**
 * Streamlit Video Annotator - Entry Point
 *
 * Initializes the Streamlit component and renders the VideoAnnotator.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Streamlit, RenderData } from 'streamlit-component-lib';
import VideoAnnotator from './VideoAnnotator';
import { ComponentArgs, DEFAULT_COLORS, Theme } from './types';

// Initialize Streamlit connection
Streamlit.setComponentReady();
Streamlit.setFrameHeight(800);

const container = document.getElementById('root');
const root = createRoot(container!);

function onRender(event: Event): void {
  const renderEvent = event as CustomEvent<RenderData>;
  const args = renderEvent.detail.args as ComponentArgs;
  const theme = renderEvent.detail.theme as Theme | undefined;
  const height = args.height ?? 600;
  const existingAnnotations = args.existingAnnotations ?? [];
  const colors = args.colors ?? DEFAULT_COLORS;

  root.render(
    <React.StrictMode>
      <VideoAnnotator
        videoUrl={args.videoUrl}
        existingAnnotations={existingAnnotations}
        height={height}
        labels={args.labels}
        colors={colors}
        theme={theme}
      />
    </React.StrictMode>
  );

  Streamlit.setFrameHeight(height);
}

Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender);
