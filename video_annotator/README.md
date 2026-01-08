# Streamlit Video Annotator

A custom Streamlit component for annotating videos with drawable regions and time-range markers.

## Features

- **Time Range Selection**: Mark start and end times to define annotation ranges
- **Shape Drawing**: Draw rectangles or circles on the video to highlight regions
- **Visual Overlays**: Shapes appear during playback when video reaches annotated time ranges
- **Comments**: Add text comments to each annotation
- **Custom Colors**: Choose from a configurable color palette
- **Internationalization**: All UI labels are customizable for any language
- **Normalized Coordinates**: Shape coordinates are stored as 0-1 values for resolution independence

## Installation

Copy the `video_annotator` folder to your Streamlit project's `components/` directory.

### Building the Frontend

```bash
cd components/video_annotator/frontend
npm install
npm run build
```

For development with hot-reload:

```bash
npm start
```

## Usage

```python
from components.video_annotator import video_annotator, DEFAULT_LABELS

# Basic usage
result = video_annotator(
    video_url="https://example.com/video.mp4",
    height=600,
)

# With existing annotations and custom labels
result = video_annotator(
    video_url="https://example.com/video.mp4",
    existing_annotations=my_annotations,
    height=650,
    labels={
        "play": "Spela",
        "pause": "Pausa",
        "markStart": "Markera Start",
        "markEnd": "Markera Slut",
        # ... other labels
    },
    colors=["#00ff00", "#ff0000", "#0000ff"],
    key="video_annotator_1",
)

# Handle results
if result:
    if result.get("newAnnotation"):
        # Save the new annotation
        save_to_database(result["newAnnotation"])

    if result.get("deletedAnnotationId"):
        # Handle deletion
        delete_from_database(result["deletedAnnotationId"])
```

## API Reference

### `video_annotator()`

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `video_url` | `str` | required | Direct URL to video file (MP4, WebM). YouTube URLs not supported. |
| `existing_annotations` | `List[AnnotationData]` | `[]` | Previously saved annotations to display |
| `height` | `int` | `600` | Component height in pixels |
| `labels` | `Dict[str, str]` | `DEFAULT_LABELS` | UI labels for internationalization |
| `colors` | `List[str]` | See below | Color palette for annotations |
| `key` | `str` | `None` | Unique key for the component |

### Default Colors

```python
["#00ff00", "#ff0000", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"]
```

### Default Labels

```python
{
    "play": "Play",
    "pause": "Pause",
    "tools": "Tools",
    "rectangle": "Rectangle",
    "circle": "Circle",
    "color": "Color",
    "markStart": "Mark Start",
    "markEnd": "Mark End",
    "start": "Start",
    "end": "End",
    "saveAnnotation": "Save Annotation",
    "cancel": "Cancel",
    "annotations": "Annotations",
    "noAnnotations": "No annotations yet.",
    "delete": "Delete",
    "commentPlaceholder": "Write a comment...",
    "drawInstruction": "Draw a {shape} on the video to mark a region",
}
```

### Return Value

Returns `None` if no changes, or a dictionary with:

| Key | Type | Description |
|-----|------|-------------|
| `annotations` | `List[AnnotationData]` | Current list of all annotations |
| `newAnnotation` | `AnnotationData` | Most recently added annotation (if any) |
| `deletedAnnotationId` | `str` | ID of deleted annotation (if any) |

### `AnnotationData` Structure

```python
{
    "id": "uuid-string",
    "startTime": 10.5,        # seconds
    "endTime": 15.0,          # seconds
    "shape": {
        "id": "uuid-string",
        "type": "rectangle",  # or "circle"
        "x": 0.5,             # center X (0-1)
        "y": 0.5,             # center Y (0-1)
        "width": 0.2,         # for rectangles (0-1)
        "height": 0.15,       # for rectangles (0-1)
        "radius": 0.1,        # for circles (0-1)
        "color": "#00ff00"
    },
    "comment": "User's comment",
    "createdAt": "2024-01-15T10:30:00Z"
}
```

## Development Mode

Set the environment variable to use the dev server:

```bash
# Terminal 1: Start frontend dev server
cd components/video_annotator/frontend
npm start

# Terminal 2: Run Streamlit (dev mode is automatic when build/ doesn't exist)
streamlit run app.py
```

For production, build the frontend and set:

```bash
export STREAMLIT_COMPONENT_RELEASE=true
```

## Video URL Requirements

The component requires direct URLs to video files. Streaming services like YouTube are not supported because they don't serve raw video files.

Supported:
- Direct file URLs (e.g., `https://storage.example.com/video.mp4`)
- Azure Blob Storage URLs with SAS tokens
- S3 pre-signed URLs
- Any URL that returns a video file directly

Not supported:
- YouTube, Vimeo, or other streaming platforms
- Embed URLs

## License

MIT
