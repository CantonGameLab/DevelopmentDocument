# nvidia-widgets

- **作者**：Ignacio Castaño
- **日期**：2008-08-26（更新于 2010-09-07）
- **原文**：https://www.ludicon.com/castano/blog/2008/08/nvidia-widgets/
- **来源**：ludicon.com/castano/blog（WordPress REST API 全文）

---

I just published the immediate mode user interface ([IMGUI](https://mollyrocket.com/forums/viewforum.php?f=10)) toolkit that we are using in our latest [OpenGL SDK examples](http://developer.download.nvidia.com/SDK/10.5/opengl/samples.html).

The purpose of the SDK examples is to show how to implement certain techniques using OpenGL. We did not want to spend too much time writing UI code, and we did not want the UI code to end up occupying more space than the code dedicated to the technique we are trying to showcase. IMGUI allowed us to accomplish these goals in an elegant way.

Here’s a simple example with two widgets:

```

ui.begin();
ui.beginGroup(nv::GroupFlags_GrowDownFromLeft);

static bool showButton = false;
ui.doCheckButton(none, "Show exit button", &showButton);

if (showButton) {
    if (ui.doButton(none, "Quit")) exit(0);
}

ui.endGroup();
ui.end();
```

And this is what the result looks like:

[missing image]

One of the nice things is that, since the UI is being rendered in immediate mode, it’s very easy to create/modify widgets dynamically. For example, this is what happens when the check box is activated:

[missing image]

You can get the whole source code at the [nvidia-widgets google project](http://code.google.com/p/nvidia-widgets/), and feel free to drop by the [Molly Rocket IMGUI forums](https://mollyrocket.com/forums/viewtopic.php?t=658) to share your feedback!
