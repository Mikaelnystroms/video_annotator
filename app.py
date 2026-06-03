"""
Demo app for Streamlit Video Annotator Component

Run with: streamlit run app.py
"""

import streamlit as st
from video_annotator import video_annotator, DEFAULT_LABELS

# Page config
st.set_page_config(
    page_title="Video Annotator Demo",
    layout="wide"
)

st.title("Streamlit Video Annotator Demo")
st.markdown("""
This is a demo of the `streamlit-video-annotator` component. Try annotating the video below!
""")

# Sidebar configuration
st.sidebar.header("Configuration")

# Video URL input
video_url = st.sidebar.text_input(
    "Video URL",
    value="https://download.blender.org/peach/bigbuckbunny_movies/BigBuckBunny_320x180.mp4",
    help="Direct URL to video file (MP4, WebM, etc.)"
)

# Height slider
height = st.sidebar.slider(
    "Component Height",
    min_value=400,
    max_value=900,
    value=800,
    step=50
)

# Language selection
st.sidebar.subheader("Language")
language = st.sidebar.selectbox(
    "UI Language",
    options=["English", "Swedish", "Spanish", "French", "German"],
    help="Change the UI labels"
)

# Define language labels
LABELS = {
    "English": DEFAULT_LABELS,
    "Swedish": {
        "play": "Spela",
        "pause": "Pausa",
        "tools": "Verktyg",
        "rectangle": "Rektangel",
        "circle": "Cirkel",
        "freedraw": "Frihand",
        "arrow": "Pil",
        "color": "Färg",
        "markStart": "Markera Start",
        "markEnd": "Markera Slut",
        "start": "Start",
        "end": "Slut",
        "saveAnnotation": "Spara Annotering",
        "cancel": "Avbryt",
        "annotations": "Annoteringar",
        "noAnnotations": "Inga annoteringar än.",
        "delete": "Ta bort",
        "commentPlaceholder": "Skriv en kommentar...",
        "drawInstruction": "Rita en {shape} på videon för att markera ett område",
        "quickSave": "Snabbspara",
    },
    "Spanish": {
        "play": "Reproducir",
        "pause": "Pausar",
        "tools": "Herramientas",
        "rectangle": "Rectángulo",
        "circle": "Círculo",
        "freedraw": "Dibujo libre",
        "arrow": "Flecha",
        "color": "Color",
        "markStart": "Marcar inicio",
        "markEnd": "Marcar fin",
        "start": "Inicio",
        "end": "Fin",
        "saveAnnotation": "Guardar anotación",
        "cancel": "Cancelar",
        "annotations": "Anotaciones",
        "noAnnotations": "Aún no hay anotaciones.",
        "delete": "Eliminar",
        "commentPlaceholder": "Escribe un comentario...",
        "drawInstruction": "Dibuja un {shape} en el video para marcar una región",
        "quickSave": "Guardado rápido",
    },
    "French": {
        "play": "Jouer",
        "pause": "Pause",
        "tools": "Outils",
        "rectangle": "Rectangle",
        "circle": "Cercle",
        "freedraw": "Dessin libre",
        "arrow": "Flèche",
        "color": "Couleur",
        "markStart": "Marquer le début",
        "markEnd": "Marquer la fin",
        "start": "Début",
        "end": "Fin",
        "saveAnnotation": "Enregistrer l'annotation",
        "cancel": "Annuler",
        "annotations": "Annotations",
        "noAnnotations": "Pas encore d'annotations.",
        "delete": "Supprimer",
        "commentPlaceholder": "Écrire un commentaire...",
        "drawInstruction": "Dessinez un {shape} sur la vidéo pour marquer une région",
        "quickSave": "Enregistrement rapide",
    },
    "German": {
        "play": "Abspielen",
        "pause": "Pause",
        "tools": "Werkzeuge",
        "rectangle": "Rechteck",
        "circle": "Kreis",
        "freedraw": "Freihand",
        "arrow": "Pfeil",
        "color": "Farbe",
        "markStart": "Start markieren",
        "markEnd": "Ende markieren",
        "start": "Start",
        "end": "Ende",
        "saveAnnotation": "Anmerkung speichern",
        "cancel": "Abbrechen",
        "annotations": "Anmerkungen",
        "noAnnotations": "Noch keine Anmerkungen.",
        "delete": "Löschen",
        "commentPlaceholder": "Schreibe einen Kommentar...",
        "drawInstruction": "Zeichne ein {shape} auf das Video, um einen Bereich zu markieren",
        "quickSave": "Schnellspeichern",
    }
}

# Color options
st.sidebar.subheader("Colors")
use_custom_colors = st.sidebar.checkbox("Use custom colors")
colors = None
if use_custom_colors:
    colors = [
        st.sidebar.color_picker("Color 1", "#FF5733"),
        st.sidebar.color_picker("Color 2", "#33FF57"),
        st.sidebar.color_picker("Color 3", "#3357FF"),
        st.sidebar.color_picker("Color 4", "#F033FF"),
    ]

# Initialize session state for annotations
if "annotations" not in st.session_state:
    st.session_state.annotations = []

# Main content
col1, col2 = st.columns([2, 1])

with col1:
    st.subheader("Video Annotator")

    # Render the component
    result = video_annotator(
        video_url=video_url,
        existing_annotations=st.session_state.annotations,
        height=height,
        labels=LABELS[language],
        colors=colors,
        key="video_annotator"
    )

    # Handle component output
    if result:
        if result.get("newAnnotation"):
            # Add new annotation
            new_ann = result["newAnnotation"]
            st.session_state.annotations.append(new_ann)
            st.success(f"New annotation added. ID: {new_ann['id']}")
            st.rerun()

        if result.get("deletedAnnotationId"):
            # Remove deleted annotation
            deleted_id = result["deletedAnnotationId"]
            st.session_state.annotations = [
                ann for ann in st.session_state.annotations
                if ann["id"] != deleted_id
            ]
            st.warning(f"Annotation deleted. ID: {deleted_id}")
            st.rerun()

with col2:
    st.subheader("Annotations Data")

    # Show annotation count
    st.metric("Total Annotations", len(st.session_state.annotations))

    # Clear all button
    if st.session_state.annotations:
        if st.button("Clear All Annotations", type="secondary"):
            st.session_state.annotations = []
            st.rerun()

    # Display annotations
    if st.session_state.annotations:
        st.markdown("---")
        for i, ann in enumerate(st.session_state.annotations):
            with st.expander(f"Annotation {i+1} - {ann['shape']['type']}", expanded=False):
                st.json({
                    "id": ann["id"],
                    "startTime": f"{ann['startTime']:.2f}s",
                    "endTime": f"{ann['endTime']:.2f}s",
                    "shape": ann["shape"]["type"],
                    "color": ann["shape"]["color"],
                    "comment": ann["comment"],
                    "createdAt": ann["createdAt"]
                })
    else:
        st.info("No annotations yet. Draw on the video to quick-save an annotation.")

# Footer
st.markdown("---")
st.markdown("""
### How to Use

1. **Quick Save**: Draw on the video to create an annotation immediately.
2. **Review Faster**: Use the speed button for 2x, 4x, 8x, or 16x playback and the +/-10s buttons to jump.
3. **Optional Details**: Turn off "Quick save" to mark exact start/end times and add a comment before saving.
4. **Choose Tool/Color**: Rectangle is selected by default; switch tools or colors when needed.

### Installation

```bash
pip install streamlit-video-annotator
```

### Code Example

```python
from streamlit_video_annotator import video_annotator

result = video_annotator(
    video_url="https://example.com/video.mp4",
    existing_annotations=[],
    height=600
)

if result and result.get("newAnnotation"):
    print("New annotation:", result["newAnnotation"])
```

### Links

- [GitHub Repository](https://github.com/mikaelnystroms/video_annotator)
- [PyPI Package](https://pypi.org/project/streamlit-video-annotator/)
- [Documentation](https://github.com/mikaelnystroms/video_annotator#readme)
""")
