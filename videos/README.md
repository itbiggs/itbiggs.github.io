# Project Video Demonstrations

This directory contains video demonstrations for your projects.

## How to Add Video Demonstrations

### Step 1: Add Your Video Files
Place your video files in this directory with the following names:
- `chicago-crime-demo.mp4` - Chicago Crime Analytics demo
- `transit-predictor-demo.mp4` - Transit Delay Predictor demo
- `text-system-demo.mp4` - Automated Text System demo

### Step 2: Uncomment the Video Code in index.html

For each project you want to add a video to:

1. Find the project card in `index.html`
2. Uncomment the `<div class="project-video">` section
3. Optionally uncomment the Demo link in the `card-links` section

#### Example:
Change this:
```html
<!-- Uncomment to add video demo:
<div class="project-video">
  <video controls>
    <source src="videos/chicago-crime-demo.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>
-->
```

To this:
```html
<div class="project-video">
  <video controls>
    <source src="videos/chicago-crime-demo.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>
```

### Video Guidelines
- **Format**: MP4 (most compatible)
- **Size**: Keep under 50MB for faster loading
- **Resolution**: 1080p or 720p recommended
- **Length**: 30-90 seconds is ideal for demos

### Alternative: Link to External Videos
If your videos are too large, you can host them on YouTube/Vimeo and update the Demo link:
```html
<a href="https://youtu.be/your-video-id" target="_blank">Demo ↗</a>
```
