# GPU DXT Decompression

- **作者**：Ignacio Castaño
- **日期**：2009-03-19（更新于 2019-01-17）
- **原文**：https://www.ludicon.com/castano/blog/2009/03/gpu-dxt-decompression/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

Even thought the DXT compression format is widely adopted, most of the hardware implementations use a slightly different decompression algorithm.

The problem is that there never was a specification that described the preferred implementation. The DXT format was first documented by S3 in [US patent 5956431](http://www.google.com/patents?id=QEEZAAAAEBAJ). However, in order to cover all possible implementations the description in the patent is very generic. It does not specify when or whether the colors are bit expanded, or how the palette entries are interpolated. In one of the proposed embodiments they approximate the 1/3 and 2/3 terms as 3/8 and 5/8, which would have been a good idea, if everybody had chosen the same approximation. However, different implementations approximated the expensive division in different ways.

NVIDIA used to perform the [DXT1 interpolation in 16 bits](http://udn.epicgames.com/Two/TextureComparison.html#NVIDIA%20DXT1%20Issue), and in some hardware, to compensate for the quantization artifacts, introduced some dithering patterns that in some cases even worsened the results.

Modern NVIDIA hardware does not have these problems, but it still doesn’t implement the palette evaluation using the exact formula. The approximation used is now documented in [US patent 7385611](http://www.freepatentsonline.com/7385611.html). The document is quite hard to digest, especially without images. So, here’s the code that exactly reproduces the decompression as done by current NVIDIA GPUs:

`

```

void evaluatePaletteNV5x(Color16 col0, Color16 col1, Color32 palette[4])
{
  palette[0].b = (3 * col0.b * 22) / 8;
  palette[0].g = (col0.g > 4);
  palette[0].r = (3 * col0.r * 22) / 8;
  palette[0].a = 0xFF;

  palette[1].r = (3 * col1.r * 22) / 8;
  palette[1].g = (col1.g > 4);
  palette[1].b = (3 * col1.b * 22) / 8;
  palette[1].a = 0xFF;

  int gdiff = palette[1].g - palette[0].g;

  if (col0.u > col1.u) {
    palette[2].r = ((2 * col0.r + col1.r) * 22) / 8;
    palette[2].g = (256 * palette[0].g + gdiff/4 + 128 + gdiff * 80) / 256;
    palette[2].b = ((2 * col0.b + col1.b) * 22) / 8;
    palette[2].a = 0xFF;

    palette[3].r = ((2 * col1.r + col0.r) * 22) / 8;
    palette[3].g = (256 * palette[1].g - gdiff/4 + 128 - gdiff * 80) / 256;
    palette[3].b = ((2 * col1.b + col0.b) * 22) / 8;
    palette[3].a = 0xFF;
  }
  else {
    palette[2].r = ((col0.r + col1.r) * 33) / 8;
    palette[2].g = (256 * palette[0].g + gdiff/4 + 128 + gdiff * 128) / 256;
    palette[2].b = ((col0.b + col1.b) * 33) / 8;
    palette[2].a = 0xFF;

    palette[3].r = 0x00;
    palette[3].g = 0x00;
    palette[3].b = 0x00;
    palette[3].a = 0x00;
  }
}
```

`

The above code doesn’t make too much sense unless you think about it in terms of area savings and reuse of hardware elements.

Anyway, I think we came to this point, because traditionally graphic APIs had never been very strict with the hardware implementations. However, D3D10 finally introduced some constrains. In particular, it specified a canonical decoder, and provided some error bounds that implementations have to comply with.

In D3D10, the DXT1 color decompression is specified as follows:

`

```

color_0_p = bitexpand(color_0);
color_1_p = bitexpand(color_1);
if (color_0 > color_1) {
   color_2 = (2 * color_0_p + color_1_p) / 3;
   color_3 = (color_0_p + 2 * color_1_p) / 3;
} else {
   color_2 = (color_0_p + color_1_p) / 2;
   color_3 = 0;
}
```

`

And the allowed error bounds are the following:

```
|generated – reference| < 1.0 / 255.0 + 0.03 * |color_0_p – color_1_p|
```

The canonical algorithm is clearly different to what NVIDIA GPUs do, but in most cases the error introduced is very small. In fact, the approximation error is well below the allowed error bounds.

But do these small differences really matter?

Unfortunately in some cases they do. Note, that the magnitude of the allowed error is proportional to the distance between the end points. So, when the distance between the end points is large, the errors introduced can be significant.

One of the cases where this bites you very often is in [ryg](http://www.farbrausch.de/~fg/)’s [single color compressor](https://mollyrocket.com/forums/viewtopic.php?t=392) (which is based on [Simon](http://www.sjbrown.co.uk/2006/01/19/dxt-compression-techniques/)’s). In this compressor the optimal end points for a single color block are precomputed using a brute force approach, testing all possible pairs of endpoints for each component, and using the pair that produces the lowest error.

The problem is that sometimes the best endpoints are very far away from each other, and as a result, while the canonical color is approximated accurately, the real color is not. This appears to be [a problem in practice](http://code.google.com/p/nvidia-texture-tools/issues/detail?id=85). Here’s a screenshot that shows artifacts introduced by the single color compressor:

[![](http://castano.ludicon.com/blog/wp-content/uploads/2009/03/screenshot_error-500x219.png)](http://www.ludicon.com/castano/blog/2009/03/gpu-dxt-decompression/screenshot_error/)

A simple solution would be to minimize the error with respect to the actual hardware decompression, instead of using the canonical decompression formula. However, favoring some specific hardware would not be fair. Instead, a better approach is to measure the error with respect to the maximum error allowed by Microsoft’s spec. With that in mind, the code to compute ryg’s decompression tables would be as follows:

`

```

for (int i = 0; i err += 0.03f * abs(maxe - mine);

      if (err < bestErr) {
        Table[i*2+0] = max;
        Table[i*2+1] = min;
        bestErr = err;
      }
    }
  }
}
```

`

And as seen in the following screenshot that eliminates the artifacts obtained with the original approach:

[![](http://castano.ludicon.com/blog/wp-content/uploads/2009/03/screenshot_ok-500x219.png)](http://www.ludicon.com/castano/blog/2009/03/gpu-dxt-decompression/screenshot_ok/)

The same idea can also be applied to a general block compressor, but that is left as an exercise.

This problem is fixed in the [NVIDIA Texture Tools](http://code.google.com/p/nvidia-texture-tools/) as of [version 2.0.6](http://code.google.com/p/nvidia-texture-tools/downloads/detail?name=nvidia-texture-tools-2.0.6.tar.gz). I’d like to thank Marco Altomonte for pointing out the issue, and providing data to reproduce it!

 cb

Posted 20/3/2009 at 8:12 am | Permalink

Great article as usual!

 bitman

Posted 29/4/2009 at 3:40 am | Permalink

In evaluatePaletteNV5x shouldn’t that be 85 instead of 80?

 bitman

Posted 29/4/2009 at 4:37 am | Permalink

Oh nevermind, it looks like it could actually be on purpose to simplify the hardware multiplication (80 = 64+16), but if you’re deciding to add such huge errors why would you even bother with gdiff/4?

Also, the RGB errors look pretty significant in the screenshot (easily over 10 on the green channel, whereas D3D spec only allows 8 and the code you gave only has an error of 6), is there contrast enhancement applied?

 castano

Posted 29/4/2009 at 5:24 am | Permalink

Yeah, the constants in the green interpolation look totally awkward to me. It’s straightforward to come up with better values. However, I suppose the are some constraints in oder to share the same hardware for one of the BC5 channels.

Yes, contrants is enhanced to make the artifact more obvious. Note that the same could happen on a game due to lighting or blending.

 Marco Altomonte

Posted 14/5/2009 at 12:09 am | Permalink

It’s Altomonte, not Almonte. :)

Thanks again for resolving these issues!

 castano

Posted 14/5/2009 at 8:22 am | Permalink

Whoops! I just fixed the typo. :)
