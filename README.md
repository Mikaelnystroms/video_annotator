# Streamlit Video Annotator

A custom Streamlit component for annotating videos with drawable regions and time-range markers. Perfect for computer vision, machine learning, and video analysis applications.

## Features

- **Video Playback Controls**: Play, pause, scrub, and move forward or rewind at 1x, 2x, 4x, 8x, or 16x
- **Multiple Drawing Tools**:
  - Rectangle
  - Circle
  - Freedraw (path)
  - Arrow
- **Quick Save**: Draw on the video to immediately create an annotation with default rectangle mode
- **Time-Range Annotations**: Mark start and end times manually when exact ranges are needed
- **Annotation Presets**: One-click category buttons can apply the saved comment, color, and tool
- **Color Customization**: Choose from multiple colors for annotations
- **Comments**: Add text descriptions to annotations
- **Annotation Management**: View, edit, and delete existing annotations
- **Custom Labels**: Customize UI labels when needed
- **Responsive Design**: Adjustable height and responsive layout

## Installation

```bash
pip install streamlit-video-annotator
```

## Try the Demo

Clone the repository and run the demo app:

```bash
git clone https://github.com/mikaelnystrom/video_annotator.git
cd video_annotator
pip install -e .
streamlit run app.py
```

The demo app includes:
- Public sample video with CORS enabled
- Customizable colors and height
- Live annotation preview and data display

## Quick Start

```python
import streamlit as st
from video_annotator import video_annotator

# Basic usage
result = video_annotator(
    video_url="https://example.com/video.mp4",
    height=600
)

# Handle new annotations
if result and result.get("newAnnotation"):
    st.write("New annotation created:", result["newAnnotation"])
    # Save to database, process, etc.

# Handle deletions
if result and result.get("deletedAnnotationId"):
    st.write("Annotation deleted:", result["deletedAnnotationId"])
```

## Advanced Usage

### With Existing Annotations

```python
from video_annotator import video_annotator

# Load existing annotations from your database
existing_annotations = [
    {
        "id": "annotation-1",
        "startTime": 5.0,
        "endTime": 10.0,
        "shape": {
            "type": "rectangle",
            "x": 0.2,
            "y": 0.3,
            "width": 0.4,
            "height": 0.3,
            "color": "#ff0000"
        },
        "comment": "Object of interest",
        "createdAt": "2026-01-08T10:00:00Z"
    }
]

result = video_annotator(
    video_url="https://example.com/video.mp4",
    existing_annotations=existing_annotations,
    height=800
)
```

### Custom Labels

```python
custom_labels = {
    "play": "Start",
    "pause": "Pause",
    "tools": "Drawing tools",
    "rectangle": "Box",
    "circle": "Circle",
    "freedraw": "Free draw",
    "arrow": "Arrow",
    "color": "Color",
    "markStart": "Set Start",
    "markEnd": "Set End",
    "saveAnnotation": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "quickSave": "Quick save",
    "rewind": "Rewind",
    "forward": "Forward"
}

result = video_annotator(
    video_url="video.mp4",
    labels=custom_labels
)
```

### Custom Colors

```python
result = video_annotator(
    video_url="video.mp4",
    colors=["#FF5733", "#33FF57", "#3357FF", "#F033FF"]
)
```

### Annotation Presets

```python
from video_annotator import video_annotator

result = video_annotator(
    video_url="video.mp4",
    annotation_presets=[
        {
            "label": "Subject",
            "comment": "Subject",
            "color": "#00ff00",
            "tool": "rectangle",
        },
        {
            "label": "Interaction",
            "comment": "Interaction",
            "color": "#0000ff",
            "tool": "rectangle",
        },
    ],
)
```

## API Reference

### video_annotator()

```python
video_annotator(
    video_url: str,
    existing_annotations: Optional[List[AnnotationData]] = None,
    height: int = 800,
    labels: Optional[Dict[str, str]] = None,
    colors: Optional[List[str]] = None,
    annotation_presets: Optional[List[AnnotationPreset]] = None,
    key: Optional[str] = None,
) -> Optional[Dict[str, Any]]
```

**Parameters:**

- `video_url` (str): Direct URL to the video file. Supports MP4, WebM, and other browser-compatible formats. Note: YouTube URLs are not supported.
- `existing_annotations` (list, optional): List of annotation dictionaries to display.
- `height` (int, optional): Component height in pixels. Default: 600.
- `labels` (dict, optional): Custom UI labels.
- `colors` (list, optional): List of color hex codes for annotations. Default: ['#00ff00', '#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].
- `annotation_presets` (list, optional): Fast category buttons. Each preset can set `label`, `comment`, `color`, and `tool`.
- `key` (str, optional): Unique key for the component instance.

**Returns:**

Dictionary with:
- `annotations`: Full list of current annotations
- `newAnnotation`: Most recently added annotation (if any)
- `deletedAnnotationId`: ID of deleted annotation (if any)

Returns `None` if no changes occurred.

## Data Structures

### AnnotationData

```python
{
    "id": str,              # Unique identifier
    "startTime": float,     # Start time in seconds
    "endTime": float,       # End time in seconds
    "shape": ShapeData,     # Shape information
    "comment": str,         # User comment
    "createdAt": str        # ISO 8601 timestamp
}
```

### ShapeData

```python
{
    "id": str,
    "type": str,           # 'rectangle', 'circle', 'path', or 'arrow'
    "color": str,          # CSS color (e.g., '#ff0000')

    # For rectangles:
    "x": float,            # 0-1 normalized
    "y": float,            # 0-1 normalized
    "width": float,        # 0-1 normalized
    "height": float,       # 0-1 normalized

    # For circles:
    "x": float,            # Center X (0-1 normalized)
    "y": float,            # Center Y (0-1 normalized)
    "radius": float,       # 0-1 normalized

    # For arrows:
    "x": float,            # Start X
    "y": float,            # Start Y
    "endX": float,         # End X
    "endY": float,         # End Y

    # For paths (freedraw):
    "points": [            # List of points
        {"x": float, "y": float},
        ...
    ]
}
```

## Use Cases

- **Computer Vision Training**: Create labeled datasets for object detection and tracking
- **Video Analysis**: Mark regions of interest in research videos
- **Quality Assurance**: Annotate defects or issues in video footage
- **Sports Analysis**: Mark player positions and movements
- **Medical Imaging**: Annotate regions in medical video footage
- **Educational Content**: Create interactive video lessons with annotations

## Requirements

- Python >= 3.8
- Streamlit >= 1.0.0

## Development

### Local Development Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -e .
   cd video_annotator/frontend
   npm install
   ```
3. For frontend development, start the dev server and set the dev mode flag:
   ```bash
   npm start
   STREAMLIT_COMPONENT_DEV=true streamlit run app.py
   ```

### Publishing to PyPI

This package uses GitHub Actions with PyPI trusted publishing for secure, automated releases.


## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter any issues or have questions, please file an issue on GitHub.

## Links

- [GitHub Repository](https://github.com/mikaelnystrom/video_annotator)
- [Streamlit Documentation](https://docs.streamlit.io)
- [Report Issues](https://github.com/mikaelnystrom/video_annotator/issues)
