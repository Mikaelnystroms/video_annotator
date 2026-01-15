# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Streamlit Video Annotator is a custom Streamlit component for annotating videos with drawable regions (rectangle, circle, freedraw, arrow) and time-range markers. Published to PyPI as `streamlit-video-annotator`.

## Development Commands

### Frontend (React/TypeScript)
```bash
cd video_annotator/frontend
npm install              # Install dependencies
npm start                # Start webpack dev server on port 3001
npm run build            # Build production bundle to frontend/build/
```

### Python/Streamlit
```bash
pip install -e .                              # Install in development mode
streamlit run app.py                          # Run demo application
STREAMLIT_COMPONENT_DEV=true streamlit run app.py  # Run with frontend dev server
```

### Building & Publishing
```bash
uv build        # Build distribution package
uv publish      # Publish to PyPI (or use GitHub Actions with tags: v*)
```

## Architecture

**Dual-stack Streamlit component:**
- **Backend**: Python wrapper in `video_annotator/video_annotator.py` using `streamlit.components.v1`
- **Frontend**: React 18 + TypeScript in `video_annotator/frontend/src/`
- **Communication**: Streamlit component protocol via iframes

### Key Files
- `video_annotator/video_annotator.py` - Python component wrapper, declares component and handles dev/prod mode switching
- `video_annotator/frontend/src/VideoAnnotator.tsx` - Main React component with drawing tools and annotation logic
- `video_annotator/frontend/src/types.ts` - TypeScript interfaces for shapes and annotations
- `app.py` - Demo application showing component usage

### Development Mode
Set `STREAMLIT_COMPONENT_DEV=true` to use the webpack dev server (localhost:3001) instead of the production build. The component wrapper switches between these automatically.

### Data Flow
- Annotations use normalized coordinates (0-1) for shapes
- Frontend sends `newAnnotation` or `deletedAnnotationId` back to Python
- Parent app receives changes via component return value and manages persistence
