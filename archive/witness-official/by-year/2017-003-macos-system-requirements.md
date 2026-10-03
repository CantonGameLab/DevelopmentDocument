# MacOS System Requirements

- **作者**：Jonathan Blow
- **日期**：2017-06-09 18:36 UTC
- **分类**：Uncategorized
- **原文**：http://the-witness.net/news/2017/06/macos-system-requirements/
- **来源**：the-witness.net 官方开发博客（文章页全文）

---

We released The Witness for MacOS a little while back, and we felt it'd be a good idea to post the system requirements somewhere so we could link people to them when they ask. So...

The Witness requires Metal for rendering. Metal is a graphics technology from Apple that allows faster and more fluid graphics. These are the Mac computers that support Metal:

- MacBook (Early 2015)

- MacBook Air (Mid 2012 or newer)

- MacBook Pro (Mid 2012 or newer)

- Mac mini (Late 2012 or newer)

- iMac (Late 2012 or newer)

- Mac Pro (Late 2013 or newer)

[https://support.apple.com/en-us/HT205073](https://support.apple.com/en-us/HT205073)

It's possible to build custom Mac systems with Metal support, either using an old Mac Pro and upgrading the graphics card or building it from scratch using compatible parts (Hackintosh). These configurations are unsupported, but some customers have found them to work.

If using an AMD GPU, the only supported add-in card with Metal support is:

**AMD Radeon 7950 (Tahiti Pro) Sapphire card.**

If using an NVIDIA GPU, any GeForce 6xx or newer should work, but it is necessary to install the latest drivers from:

[http://www.nvidia.com/object/mac-driver-archive.html](http://www.nvidia.com/object/mac-driver-archive.html)

System Requirements:

Minimum:

```
* OS: El Capitan 10.11.6
* Processor: Intel Core i5 @ 1.8 GHz
* Memory: 4 GB RAM
* Graphics: 1 GB of video memory
- Intel: HD Graphics 4000
- AMD: Radeon R9 M290
- NVIDIA: GeForce 640M
* Storage: 5 GB available space
```

Recommended:

```
* OS: Sierra 10.12.4
* Processor: Intel Core i7 @ 2.4 GHz
* Memory: 8 GB RAM
* Graphics: 2 GB of video memory
- AMD: Radeon R9 M390
- NVIDIA: GeForce 780
* Storage: 5 GB available space
```

The list of Apple systems with AMD graphics that support Metal is:

```
Mac Pro 6,1 (Radeon FirePro D300, D500, D700) - cylinder
iMac 15,1 (Radeon R9 M290, M295X)
iMac 17,1 (Radeon R9 M380, M390, M395, M395X)

MacBook Pro 11,5 (Radeon R9 M370X)
MacBook Pro 13,3 (Radeon Pro 460)
```

The list of Apple systems with NVIDIA graphics that support Metal is:

```
MacBook Pro 9,1 (GeForce GT 650M)
MacBook Pro 10,1 (GeForce GT 650M)
MacBook Pro 11,3 (GeForce GT 750M)
iMac 13,1 (GeForce GT 640M, 650M)
iMac 13,2 (GeForce GTX 660M, 675M)
iMac 14,2 (GeForce GT 755M, 775M)
iMac 14,3 (GeForce GT 750M)
```
