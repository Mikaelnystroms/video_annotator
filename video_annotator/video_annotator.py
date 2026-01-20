"""
Streamlit Video Annotator Component

A custom Streamlit component for annotating videos with drawable regions
and time-range markers. Supports rectangles and circles as annotation shapes.

Example usage:
    from components.video_annotator import video_annotator

    result = video_annotator(
        video_url="https://example.com/video.mp4",
        existing_annotations=[],
        height=600,
        labels={
            "play": "Play",
            "pause": "Pause",
            # ... other labels
        }
    )

    if result and result.get("newAnnotation"):
        # Handle new annotation
        save_to_database(result["newAnnotation"])
"""

import os
from typing import Any, Dict, List, Optional, TypedDict

import streamlit.components.v1 as components

__version__ = "0.1.3"

# Development vs production mode
# Use build folder if it exists, unless explicitly set to dev mode
_BUILD_PATH = os.path.join(os.path.dirname(__file__), "frontend", "build")
_DEV_MODE = os.environ.get("STREAMLIT_COMPONENT_DEV", "false").lower() == "true"

if _DEV_MODE:
    # Development mode: use local dev server
    _component_func = components.declare_component(
        "video_annotator",
        url="http://localhost:3001"
    )
else:
    # Production mode: use built frontend
    _component_func = components.declare_component(
        "video_annotator",
        path=_BUILD_PATH
    )


class ShapeData(TypedDict, total=False):
    """
    Shape data for drawable regions. All fields optional for flexibility.

    Attributes:
        id: Unique identifier for the shape
        type: Shape type ('rectangle', 'circle', 'path', or 'arrow')
        color: CSS color string (e.g., '#ff0000')
        x: X coordinate (0-1 normalized) - used by rectangle, circle, arrow
        y: Y coordinate (0-1 normalized) - used by rectangle, circle, arrow
        width: Width for rectangles (0-1 normalized)
        height: Height for rectangles (0-1 normalized)
        radius: Radius for circles (0-1 normalized, relative to video width)
        endX: End X coordinate for arrows (0-1 normalized)
        endY: End Y coordinate for arrows (0-1 normalized)
        points: List of points for path (freedraw) - each point is {x: float, y: float}
    """

    id: str
    type: str
    color: str

    # Rectangle/Circle properties
    x: float
    y: float
    width: float
    height: float
    radius: float

    # Arrow properties
    endX: float
    endY: float

    # Path properties
    points: List[Dict[str, float]]


class AnnotationData(TypedDict):
    """
    Video annotation data structure.

    Attributes:
        id: Unique identifier for the annotation
        startTime: Start time in seconds
        endTime: End time in seconds
        shape: Shape data for the annotation region
        comment: User comment/description
        createdAt: ISO 8601 timestamp of creation
    """

    id: str
    startTime: float
    endTime: float
    shape: ShapeData
    comment: str
    createdAt: str


# Default UI labels (English)
DEFAULT_LABELS: Dict[str, str] = {
    "play": "Play",
    "pause": "Pause",
    "tools": "Tools",
    "rectangle": "Rectangle",
    "circle": "Circle",
    "freedraw": "Freedraw",
    "arrow": "Arrow",
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


def video_annotator(
    video_url: str,
    existing_annotations: Optional[List[AnnotationData]] = None,
    height: int = 600,
    labels: Optional[Dict[str, str]] = None,
    colors: Optional[List[str]] = None,
    key: Optional[str] = None,
) -> Optional[Dict[str, Any]]:
    """
    Render the video annotation component.

    This component allows users to:
    - Play and scrub through a video
    - Mark start/end times for annotations
    - Draw rectangles or circles on the video
    - Add comments to annotations
    - View and delete existing annotations

    Args:
        video_url: Direct URL to the video file (MP4, WebM, etc.).
            Note: YouTube and other streaming URLs are not supported.
        existing_annotations: List of existing annotations to display.
            These will be shown during playback when the video reaches
            their time range.
        height: Component height in pixels. Default is 600.
        labels: Dictionary of UI labels for internationalization.
            See DEFAULT_LABELS for available keys.
        colors: List of color options for annotations.
            Default: ['#00ff00', '#ff0000', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
        key: Unique key for the component instance.

    Returns:
        Dictionary with the following keys (or None if no changes):
        - annotations: Full list of current annotations
        - newAnnotation: Most recently added annotation (if any)
        - deletedAnnotationId: ID of deleted annotation (if any)

    Example:
        result = video_annotator(
            video_url="https://storage.example.com/video.mp4",
            height=650,
            labels={"play": "Spela", "pause": "Pausa"},  # Swedish
        )

        if result:
            if result.get("newAnnotation"):
                print(f"New annotation: {result['newAnnotation']}")
            if result.get("deletedAnnotationId"):
                print(f"Deleted: {result['deletedAnnotationId']}")
    """
    # Merge custom labels with defaults
    merged_labels = {**DEFAULT_LABELS, **(labels or {})}

    component_value = _component_func(
        videoUrl=video_url,
        existingAnnotations=existing_annotations or [],
        height=height,
        labels=merged_labels,
        colors=colors,
        key=key,
        default=None,
    )

    return component_value
