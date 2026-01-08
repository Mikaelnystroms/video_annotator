/**
 * Streamlit Video Annotator - Entry Point
 *
 * Initializes the Streamlit component and renders the VideoAnnotator.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { Streamlit, RenderData } from 'streamlit-component-lib';
import VideoAnnotator from './VideoAnnotator';
import { ComponentArgs, DEFAULT_COLORS } from './types';

// Initialize Streamlit connection
Streamlit.setComponentReady();
Streamlit.setFrameHeight(600);

const container = document.getElementById('root');
const root = createRoot(container!);

function onRender(event: Event): void {
  const renderEvent = event as CustomEvent<RenderData>;
  const args = renderEvent.detail.args as ComponentArgs;

  root.render(
    <React.StrictMode>
      <VideoAnnotator
        videoUrl={args.videoUrl}
        existingAnnotations={args.existingAnnotations || []}
        height={args.height || 600}
        labels={args.labels}
        colors={args.colors || DEFAULT_COLORS}
      />
    </React.StrictMode>
  );

  Streamlit.setFrameHeight(args.height || 600);
}

Streamlit.events.addEventListener(Streamlit.RENDER_EVENT, onRender);
