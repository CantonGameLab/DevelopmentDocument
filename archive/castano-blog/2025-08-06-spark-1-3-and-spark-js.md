# Spark 1.3 and spark.js

- **作者**：Ignacio Castaño
- **日期**：2025-08-06（更新于 2025-09-24）
- **原文**：https://www.ludicon.com/castano/blog/2025/08/spark-1-3-and-spark-js/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

I’m excited to announce the release of *Spark* 1.3 and the launch of [spark.js](https://ludicon.com/sparkjs/), our new JavaScript API for real-time GPU texture compression on the web.

The highlight of this release is full [WebGPU](#webgpu) support. *[Spark](https://ludicon.com/spark/)*’s real-time codecs are now available as WGSL compute shaders that run natively in modern browsers. To make it easy to use *Spark* on the web, we’re also introducing [spark.js](#spark.js), a separate JavaScript package that wraps a subset of the codecs with a simple API. *spark.js* is free for non-commercial use and available under an affordable license for commercial projects.

**What’s new in Spark 1.3:**

- New RGBA codecs: Introduced a [new BC7 RGBA codec](#bc7-rgba) and improved the quality of our [ASTC RGBA codec](#astc-rgba-quality).

- Performance and quality improvements across the board, in particular a [faster EAC codec](#faster-eac), a faster [ASTC RGBA codec](#astc-rgba) and improvements to [BC1 quality](#quality-improvements).

- Expanded platform support including: [WebGPU](#webgpu), [OpenGL 4.1 (macOS), GLES 3.0 (iOS) and broader AndroidTV support](#expanded-platform-support).

This release also includes new examples, bug fixes, and continued improvements based on user feedback.

I’m thrilled to welcome [Infinite Flight](https://infiniteflight.com/) and [Netflix](https://netflix.com)as new *Spark* licensees, and deeply grateful to [HypeHype](https://hypehype.com) for their continued support.

![](https://www.ludicon.com/castano/blog/wp-content/uploads/2025/08/logos-700x158.png)

### WebGPU

[HypeHype](https://hypehype.com) has already been using *Spark* in their WebGPU client ahead of this release, but now it’s fully supported and tested across all browsers using both `f32` and `f16` floating point variants.

[![](http://www.ludicon.com/castano/blog/wp-content/uploads/2025/08/hypehype-screenshot-700x390.png)](https://hypehype.com/game/textured-fps-gdc-demo/r/ydR4wIMX5erTEP)

The codecs work reliably across all WebGPU-enabled browsers and devices we’ve tested.

### spark.js

In addition to WebGPU support, we’re introducing [spark.js](https://ludicon.com/sparkjs) a standalone JavaScript package that exposes a subset of the Spark codecs through a simple and lightweight API:

```
texure = await spark.encodeTexture("image.avif", {mips: true, srgb: true})
```

This makes it easy to load standard image formats in the browser and transcode them to native GPU formats optimized for rendering.

Modern image formats like AVIF and JXL provide excellent quality across a wide range of compression ratios, making them ideal for storage and transmission. In contrast, native GPU formats offer compact in-memory representations but compress poorly. While rate-distortion optimization (RDO) can help, the quality of RDO-based encoders degrades significantly at lower bitrates.

The chart below compares the [SSIMULACRA2](https://github.com/cloudinary/ssimulacra2) score of multiple encoders under various bit rates on an image that is representative of typical textures:

Scores above 80 are considered very high quality (distortion not noticeable by an average observer under normal viewing conditions). While RDO codecs perform well at high bitrates, their quality drops sharply as compression increases. In contrast, AVIF images transcoded with *Spark* maintain much higher quality, even at aggressive compression levels.

You can find more details, examples, and licensing information on the [spark.js website](https://ludicon.com/sparkjs) and the [GitHub repository](https://github.com/Ludicon/spark.js). To evaluate the codecs directly in a WebGPU-enabled browser, try the [spark.js viewer](https://ludicon.com/sparkjs/viewer/).

I am excited to bring the *Spark*codecs to the web and can’t wait to see what you build with them!

### BC7 RGBA Codec

The lack of support for BC7 with alpha was an outstanding gap in our codec lineup. This release closes that gap with a new BC7 RGBA codec and also improves the quality of all other RGBA formats.

The mode selection heuristic in BC7 RGBA is an improvement over the heuristic I employed in the ASTC codec. However, it’s tailored to the modes available in the BC7 format and is somewhat cheaper to evaluate. On opaque textures, it produces the same results as the BC7 RGB codec, but it’s also able to handle varying alpha values.

In addition to that it’s optimized for images where the alpha is used for transparency. By default, alpha is treated as a separate independent channel. However, when alpha is known to be used for transparency, we can weight the RGB error by the alpha channel, giving more importance to opaque texels than transparent ones.

As far as I know, this alpha-weighted optimization is only supported by the squish codec I co-wrote with Simon Brown and the NVTT and ICBC codecs derived from it, but is absent from most other offline codecs. It comes with some tradeoffs: In rare cases, it can introduce interpolation artifacts such as bleeding due to bilinear filtering. In practice, this is often not an issue, and the results compare favorably with offline codecs that do not account for transparency usage.

The quality of our alpha-weighted BC7 codec is competitive with the best offline solutions (SSIMULACRA2 scores, higher is better):

![](https://www.ludicon.com/castano/blog/wp-content/uploads/2025/08/alpha-weighted-ssimulacra2-700x130.png)

Some of these changes have also translated into improvements in the ASTC RGBA codec, where in some cases the quality has improved noticeably:

![](https://www.ludicon.com/castano/blog/wp-content/uploads/2025/08/ASTC-RGBA-SSIMU2-1.3-700x364.png)

### Faster EAC Compression

Our [previous Spark 1.2 release](https://www.ludicon.com/castano/blog/2025/03/spark-1-2/) saw some impressive performance improvements in the EAC Q0 codecs. This release brings even more performance gains and extends these improvements to the remaining quality levels.

The focus this time was on low-end Adreno devices. Some of the Adreno 5xx devices would time-out when compressing large normal map textures at the highest quality level. This could be solved by dispatching the codec kernels multiple times to compress portions of image, but this issue made me take a closer look at the performance on these devices.

An EAC_RG block is composed of two identical EAC_R sub-blocks that can be encoded independently. Most of our codecs are limited by bandwidth and reducing register pressure is critical to maintain good occupancy and maximize throughput. However, in this case most compilers chose to pre-load all the texels and interleave the instructions that encode each of the sub-blocks, possibly in a misguided effort to improve ILP. However, this doubled the number of required registers and often resulted in spilling. To prevent that from happening, I place the code inside loops that only run once, but the compiler is unable to eliminate and thus prevent code motion, ensuring the sub-blocks are encoded sequentially.

Another problem was that the EAC codec relied on lookup tables to compute the optimal index assignments. This is much faster than the typical brute force approach, but these loads are divergent and have a severe performance impact on some devices. To avoid them we pack and encode these tables into just a couple literals avoiding the divergence with some cheap math to decode the original values.

Getting these changes to not regress across any devices was particularly difficult as improvements on Adreno would often cause regressions on Mali and vice-versa. The throughput of integer operations on Mali is much lower than that of float operations and in some cases that resulted in lower performance than the lookup tables. To avoid that I had to carefully express the integer operations using int16 vectorization and work around compiler bugs that resulted in sub-optimal code.

In the end I found a solution that works great across almost all Mali devices:

while also providing a big performance boost on Adrenos:

This not only improved the throughput, but also allowed us to encode large textures with all the codecs on the lowest end devices without running into compute time-outs. If you wonder why some of the Adreno 505 bars are missing, that’s why. Previously, the Q1 and Q2 codecs would run into resource limits and timeouts on that device.

### ASTC RGBA Optimizations

The recent quality improvements in the ASTC RGBA codec introduced minor performance regressions, particularly noticeable on low-end devices. To address this, I’ve done a new round of optimizations targeted at mobile GPUs.

Endpoint encoding in the ASTC RGBA kernel is more expensive than in other codecs due to the need to handle endpoints in different quantization modes. The encoder relied on lookup tables to facilitate the encoding, but these have been eliminated in favor of vectorized int16 operations, the bread and butter of Android performance optimizations.

This change provides a moderate speedup on the most sensitive lower-end devices without sacrificing quality.

### Quality Improvements

I’ve made several small quality improvements across the board, many of them informed by the SSIMULACRA2 perceptual error metric. One notable improvement is in the BC1 codec.

An oversight in my BC1 encoder was the lack special handling of single color blocks. I was reluctant to add this code path due to concerns about introducing divergence and the need for a lookup table. At the time I thought the quality gains were too minor to justify the overhead. While the RMSE improvements are indeed small, the perceptual gains are very significant and make this worthwhile at higher quality settings.

The chart below shows the SSIMULACRA2 scores of the new codec compared to the previous version. Images containing smooth, uniform regions benefit significantly from this optimization.

![](https://www.ludicon.com/castano/blog/wp-content/uploads/2025/08/bc1-single-color-score-700x389.png)

Instead of adopting the standard tables used in other encoders, I’ve generated new tables that take into account the way the BC1 format is actually decoded by the hardware and result in slightly higher quality.

*Spark*1.3 also has a new experimental mode that produces higher quality results on non-photographic images and illustrations. This currently has a small performance impact, but can produce much higher quality results in some cases.

### Expanded Platform Support

Extended support for earlier OpenGL versions that lack compute shaders and even copy image extension. This is possible using pixel buffer objects.

Additionally, some current Amazon FireTV devices come with PowerVR drivers that have not seen an update in the last 7 years and had numerous bugs. However, I was able to find workarounds and get the many of the codecs running on them.
