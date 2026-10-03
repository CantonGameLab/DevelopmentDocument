# Choosing Texture Formats for WebGPU applications

- **作者**：Ignacio Castaño
- **日期**：2026-01-26（更新于 2026-03-21）
- **原文**：https://www.ludicon.com/castano/blog/2026/01/choosing-texture-formats-for-webgpu-applications/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

This is a supplement to Don McCurdy’s excellent article, [Choosing texture formats for WebGL and WebGPU applications](https://www.donmccurdy.com/2024/02/11/web-texture-formats/). Don covers the tradeoffs between modern image formats like WebP and AVIF, and GPU optimized container formats like KTX2, with practical guidance on when each makes sense.

Since that article was published, a new option has emerged: **[spark.js](https://ludicon.com/sparkjs/)**, a real time GPU texture compression  library for WebGPU, which makes it possible to ship textures as standard web images while still ending up with efficient block compressed textures in GPU memory.

Prior the arrival of [spark.js](https://ludicon.com/sparkjs/), developers wanting to load textures in their applications effectively had three options:

- use traditional image formats like PNG, JPEG, WebP, or AVIF,

- use GPU-specialized block compression formats like BC7 or ASTC, or

- use universal GPU texture formats like KTX2.

### Traditional Image Formats

Traditional image formats, and in particular modern formats like WebP and AVIF, are optimized to maximize image quality while minimizing file size. The main disadvantage is that these formats need to be decompressed on the CPU and uploaded to the GPU in an uncompressed format. This can result in high video memory consumption, potentially leading to oversubscription and poor performance. Additionally, sampling these textures generally has worse cache behavior, which can reduce rendering performance and increase power consumption.

### GPU Texture Formats

To avoid these issues, GPUs support specialized block-compressed texture formats that remain compressed in video memory. Because the GPU can sample these formats directly, they typically offer much better memory efficiency, bandwidth usage, and power consumption than uploading uncompressed RGBA textures.

The key constraint is that these formats must allow fast random access, so they use fixed-size blocks and therefore a fixed compression ratio. That makes their memory usage very predictable, but it also means the resulting files are often not as small as modern image formats like AVIF or WebP, and therefore are not so well suited for transmission.

Over the years there have been many attempts to make these formats more compressible by applying rate–distortion optimizations (accepting some loss in exchange for better results at a given bitrate), and by applying lossless transformations to reorganize the data and reduce its entropy. However, the underlying block structure still limits compression efficiency compared to modern image codecs.

Finally, GPU texture formats are not universally supported across devices and APIs. Desktop GPUs commonly support BC formats, while many mobile devices rely on ASTC or ETC, so supporting a broad set of platforms often requires shipping multiple versions of the same texture assets.

### Universal GPU texture formats

Basis Universal has tried to address the portability issue and narrow the gap between transmission friendly image codecs and platform specific GPU texture formats. In practice, it offers a compromise between the two: it can significantly simplify cross platform delivery, but it rarely delivers the best outcome on both ends of the pipeline.

Compared to modern image formats optimized for the web, Basis Universal typically achieves lower compression ratios, which can increase download sizes. Transcoding into device specific block formats at runtime can introduce additional quality loss, and in order to make this process practical it relies on metadata or “transcoding hints”, which further inflate the bitstream.

Finally, while decoding is relatively fast, transcoding into the device specific block format is often slower than simply decoding WebP or AVIF. Offline compression is also much slower than traditional image encoding, which increases iteration time and can have a significant impact during development.

### Real-Time GPU Transcoding

Real-time GPU transcoding, as implemented in [spark.js](https://ludicon.com/sparkjs/), offers a new option that combines the advantages of both approaches. Textures can be shipped using transmission friendly formats like AVIF or WebP, keeping download sizes small and workflows simple, but are then transcoded at runtime into a block-compressed GPU texture format. The result is that the texture remains compressed in video memory, reducing VRAM usage and bandwidth while improving sampling performance and power efficiency.

This approach does not require carrying a custom intermediate representation designed to be transcoded everywhere. Instead, it directly targets the optimal format for the current device at runtime, and employs the GPU for extremely efficient transcoding. In practice, this makes real-time GPU transcoding a best of both worlds solution: web native assets on the network, and GPU native textures in memory.

### Hardware Lossy Compression

Hardware vendors have also recognized the importance of supporting an efficient path for loading and rendering web image formats, and have started to add native support for runtime texture compression.

For example, on Apple platforms, A15-class devices introduced support for lossy texture compression through Metal, allowing a 50% memory reduction for otherwise uncompressed textures. This is easily enabled by setting the `compressionType` texture descriptor attribute to `MTLTextureCompressionTypeLossy`.

On Vulkan, the `VK_EXT_image_compression_control` extension gives applications a way to request fixed-rate compression for images, and is already available on flagship devices from Arm and Imagination.

Unfortunately, none of these vendor and API features are currently exposed through WebGPU. Until these capabilities become broadly accessible, or for devices that lack them, spark.js remains the most practical way to get transmission-friendly assets and block-compressed GPU textures at runtime in a portable WebGPU application.
