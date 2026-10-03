# Normal Map Compression Revisited

- **作者**：Ignacio Castaño
- **日期**：2026-02-04（更新于 2026-02-05）
- **原文**：https://www.ludicon.com/castano/blog/2026/02/normal-map-compression-revisited/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

Normal maps are one of the most widely used texture types in real-time rendering, but they’re also a bit unusual. They don’t represent color, rely on geometric assumptions, and small encoding or decoding details can lead to subtle artifacts.

This article takes a practical look at how normal maps are commonly compressed today, the tradeoffs involved, and a few pitfalls that are easy to overlook. We’ll look at these details and see how they are handled in practice in the context of [spark.js](https://ludicon.com/sparkjs/) and web 3d development.

Compressing normal map textures with spark.js is easy. You just need to tell *Spark* that the input image contains normal map data, and it will apply the correct processing automatically:

```
texture = await spark.encodeTexture(textureUrl, { normal: true });
```

Spark will then pick the best normal map format supported by the current device. In practice that usually means **BC5** on desktop GPUs, or **EAC_RG** on mobile. These formats store the X and Y components of the normal in two channels, and the Z component can be reconstructed in the shader.

If you also need mipmaps, you can request them explicitly. Spark will build the mip chain while preserving correct normal map behavior:

```
texture = await spark.encodeTexture(textureUrl, { normal: true, mips: true });
```

### Integration with three.js

One of the first things I wanted to do with spark.js was integrate it with three.js, since it’s one of the most popular 3D libraries on the web.

Early on I discovered that three.js did not support BC compressed formats for normal maps, so getting spark-compressed normal maps working required a few changes: extending three.js support for additional texture formats, and updating the material shader generator to reconstruct the Z component when two-channel normal maps are used. These changes have since been integrated into three.js and are available starting with the [r182 release](https://github.com/mrdoob/three.js/releases/tag/r182).

This was a bit unexpected, because two-channel normal maps are extremely common in the game industry. This is probably common knowledge for most game and graphics programmers, but it’s not something web developers typically run into, so I feel it’s worth documenting.

### Normal map encodings

In the D3D9 era, normal maps were often stored using a “swizzled” encoding in a 4-channel block format like DXT5 / BC3. Instead of using it as a color texture, the encoder would pack the X component into the green channel and the Y component into alpha, then swizzle the XY coordinates from those two channels in the shader:

```
normal.xy = tex2D(normalMap, uv).ga;
```

A **DXT5 / BC3** block is really two compressed blocks glued together:

- A color block (like DXT1 / BC1) This part stores two RGB endpoints in 5:6:5 format, plus a 4×4 table of 2-bit indices selecting interpolated values between those endpoints.

- An alpha block This part stores two 8-bit alpha endpoints, plus a 4×4 table of 3-bit indices selecting interpolated values between them.

As a result, the alpha block has much higher precision than the RGB block. That’s why the classic approach was to store one normal component in the alpha channel, and the other in green, which is the most accurate RGB channel as it gets 6 bits versus 5 bits for red and blue.

This worked surprisingly well for its time, but the lower precision of the endpoint and the weights used by the BC1-style color block were often not enough to represent smooth gradients accurately. That led to visible banding or quantization artifacts, especially on slowly varying normals.

To fix this, D3D10 added support for the BC5 format (which was introduced earlier on AMD hardware as 3Dc and exposed in D3D9 through various hacks). A BC5 block is essentially two independent BC4 blocks (i.e., two alpha blocks), one for the X and one for the Y, so both components get the same precision.

An interesting aspect of the BC5 format is that interpolation actually happens at higher precision than 8-bit. The hardware expands the 8 bit endpoints to 16 bits via bit replication and performs the interpolation with 16 bits of precision, so in practice you often get something like 10-11 bits of effective precision. This can be very helpful on smooth glossy surfaces, where normal map banding is more noticeable.

Even though spark.js is currently limited to 8-bit normal maps, it’s still possible to take advantage of this extra precision when using the lower level APIs available in the Spark SDK.

On mobile devices the BC5 format is usually not available, but instead it’s possible to use the EAC_RG format, which is similarly composed of two independent EAC blocks. Like ETC, EAC was devised to work around the S3TC patent, and like ETC it’s a more complex format that often results in lower quality textures.

Curiously, from the perspective of the root mean square error, the EAC_RG format actually produces lower error. However, in practice, or from a perceptual point of view, the BC5 format is able to achieve higher quality on smooth regions, where artifacts are most noticeable. This is unfortunate, and may have been mitigated with different handling of the `mul == 0` case in the EAC decoder.

Finally, another option on mobile is to use the ASTC format to encode normal maps. However, to actually achieve higher quality than what’s possible with EAC_RG you have to swizzle the input in a way similar to the old DXT5 trick:

```
normal.xy = tex2D(normalMap, uv).ga;
```

This is necessary because ASTC does not have an explicit two-channel XY mode. Instead, it relies on special endpoint encoding modes (such as Luminance + Alpha), which can be repurposed to store normal data. [Arm’s astc-encoder](https://github.com/ARM-software/astc-encoder/blob/main/Docs/Encoding.md#encoding-normal-maps) uses this swizzle when using the `-normal` command line option, but most web 3d frameworks (including three.js) don’t have a way to specify that an ASTC normal map is encoded this way and needs to have its Z component reconstructed in the shader.

While ASTC can produce higher quality normal maps than EAC_RG, getting the best results usually requires a costly optimization step. In practice, the real-time encoders in spark.js default to EAC_RG or BC5, which offer a better quality-performance tradeoff.

### Z reconstruction

The XY normal map encodings rely on the assumption that the normal is a unit vector, so the Z component can be reconstructed in the shader from that constraint:

```
z = sqrt(max(0.0, 1.0 - x*x - y*y));
```

This corresponds to using an orthographic projection of the unit hemisphere onto the XY plane. While this is by far the most common way to reconstruct Z, it is not the only option. For example, in our [Real-Time Normal Map DXT Compression paper](https://www.ludicon.com/publications/Real-Time-Normal-Map-DXT-Compression.pdf) we also evaluated the stereographic projection, and [A Survey of Efficient Representations for Independent Unit Vectors](https://jcgt.org/published/0003/02/01/paper.pdf) analyzes many other alternatives.

These alternative representations have not been widely explored in the context of normal mapping. With both orthographic and stereographic projections, only about 86% of the possible XY values are meaningful, since values outside the unit circle do not correspond to a valid unit-length normal. In those cases the radicand of the square root becomes negative and does not produce a valid Z component, which is why it is typically clamped.

A semi-octahedral representation uses the entire XY domain, but introduces first order discontinuities along fold lines and produces a more uniform distribution that does not favor directions near the pole. Whether these tradeoffs result in higher-quality normal maps in practice remains unclear.

### Tangent space discontinuities

An interesting issue that we run into in The Witness manifested itself as subtle discontinuities along uv seams like the one seen here:

![](https://www.ludicon.com/castano/blog/wp-content/uploads/2026/02/normal-discontinuity-700x379.png)

Many of the normal maps in The Witness were mostly flat, with occasional details to convey the type of material in a stylized way. The expectation was that these flat normals would look exactly the same on both sides of the seam, but instead the lighting was slightly different.

At first I thought it was caused by discontinuities in the vertex normals or the tangent frames. Maybe a bug in the way the tangent space was quantized or reconstructed or in the tangent space transform code? Turns out it was caused by the way UNORM normal maps are unpacked, which followed the usual formula:

```
normal.xy = 2.0 * normal.xy - 1.0;
```

The problem was not in the tangent space representation, but on the values of the normals. When unpacking the flat normals using the standard formula presented above, the resulting normal was not the `(0,0,1)` vector, but actually `(-0.00392..., -0.00392..., 0.99607...)`, that is, a vector that is not pointing straight up. When this vector was rotated to the tangent space on each side of the seam, the resulting world-space normal would be different.

The solution was to agree on the way zero is represented in UNORM and adjust the offset accordingly. In our case, we chose to represent 0 as 127 and updated the code as follows:

```
normal.xy = 2.0 * normal.xy - 254.0/255.0;
```

### UNORM vs SNORM

The BC5 and EAC_RG formats both have signed and unsigned variants. The signed variants were introduced specifically to represent zero exactly and to address the issue described above. In practice, however, they are rarely used. Why?

While signed formats do solve that particular problem, they introduce another one. Input normal maps are almost always stored in UNORM8 form. This is what most tools produce, and most common interchange file formats do not support signed pixel values. Converting those UNORM8 values into the [-1, 1] range and then requantizing them to SNORM8 introduces an extra quantization step, which can result in additional error and a noticeable loss of precision.

If your source normal map assets are generated and stored with 16 bits per component, using the signed variants can be a practical option, since the additional precision helps avoid the extra quantization loss. Otherwise, the best options are to either ignore the issue entirely, or to apply a small offset correction as discussed earlier.

### Conclusions

Hopefully this article provides a clearer picture of how normal maps are typically encoded, along with some of the common pitfalls.

If you’re using spark.js, most of these details are handled for you, but you are still responsible for reconstructing the Z component in the shader. Frameworks like three.js now take care of this automatically; if you’re using your own engine or a different framework, you may need to handle this step yourself.
