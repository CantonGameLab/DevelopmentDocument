# Collecting Playtest Data

- **作者**：Jonathan Blow
- **日期**：2012-12-03 03:57 UTC
- **分类**：Development, Engine Tech
- **原文**：http://the-witness.net/news/2012/12/collecting-playtest-data/
- **来源**：the-witness.net 官方开发博客（文章页全文）

---

In *The Witness*, when progress in your game is saved, we also save a thumbnail that shows you where you were. This makes it easier to load a particular game later if you had multiple saves. Here is our current, very unpolished load screen:

[![](http://the-witness.net/news/wp-content/uploads/2012/12/load_game_screen-512x299.png)](http://the-witness.net/news/wp-content/uploads/2012/12/load_game_screen.png)

Right now, we save the thumbnail and the game data as separate files, but the names are mostly the same; so if you go into your game data folder in Windows you can see them living there very plainly:

[![](http://the-witness.net/news/wp-content/uploads/2012/12/file_window-512x309.png)](http://the-witness.net/news/wp-content/uploads/2012/12/file_window.png)

(It might be interesting to do it like *Spore* and embed the save data in the image file, so that there's only one file per save. Maybe we'll do this, though it's not a no-brainer; right now the image file is usually bigger than the save data, so this would involve tying a relatively small amount of crucial data to a relatively large amount of cosmetic data. Maybe that doesn't matter, though.)

As I mentioned in [the previous post](http://the-witness.net/news/2012/11/very-limited-very-closed-beta/), we are starting to get the game out to a limited number of players. It's been a long time since I've had anyone new play through the game as a whole, so I really have no idea how it plays now, and it's important to find out. However, it's not so easy, because if you sit behind someone and watch them play a game, they are going to play it differently than if you weren't there. You invalidate your own playtest data.

So, I wanted to set up the game to record some minimal playtest data, that would be easy for me to browse through later on, and that would get recorded without me being there to directly watch the play session.

One of the first approaches that programmers often consider is an input recording method. You just journal a stream of all the player's inputs, and you can play that back deterministically to reproduce the entire game session. I have never liked this method. Firstly, you need to play back using exactly the same version of the game executable that the player used, which is a pain; secondly, this kind of playback code is brittle and breaks often. An uninitialized memory read bug can render your playback data useless! (Of course, one reason you might want playback data is to track down an uninitialized memory read bug... so... there's a problem here.)

For these reasons I didn't want to use input journaling. It seemed to me that our saved games are small enough, and the thumbnails are nice enough, that together they almost solve the problem. All I need to do is save a series of snapshots / game states over time, without overwriting previous saves:

[![](http://the-witness.net/news/wp-content/uploads/2012/12/streamsave-512x332.png)](http://the-witness.net/news/wp-content/uploads/2012/12/streamsave.png)

Whereas the earlier folder contained a collection of different play sessions, this one contains one play session at different moments in time. Every time the game made an autosave for this play session (overwriting the old one in the normal way), it also also copied the autosave here. The date and time that are in each filename just indicate when that game was started; the number at the end tells you which snapshot this is.

There's one immediate, very nice property of this: I don't even need to run the game in order to get a general idea of how someone's playtest went. Once they send me the files, I can just click on the first one in Windows to invoke the image viewer, and then click the forward/backward buttons in the image viewer to animate my way through the game.

But, if I have questions about what was going on, I can also dig into the save file that corresponds to any given image. I made a mode that lets me browse these saves in-game, load up any particular one into the current world state, and play from there. I invoke it by running a console command:

[![](http://the-witness.net/news/wp-content/uploads/2012/12/shot_2012.12.02__time_19_36_n01-512x288.png)](http://the-witness.net/news/wp-content/uploads/2012/12/shot_2012.12.02__time_19_36_n01.png)

This loads all the saved games and thumbnails and pops them into a scrolling list at the top of the screen, in chronological order:

[![](http://the-witness.net/news/wp-content/uploads/2012/12/shot_2012.12.02__time_19_36_n02-512x288.png)](http://the-witness.net/news/wp-content/uploads/2012/12/shot_2012.12.02__time_19_36_n02.png)

I just scroll to the one I want:

[![](http://the-witness.net/news/wp-content/uploads/2012/12/shot_2012.12.02__time_19_36_n03-512x288.png)](http://the-witness.net/news/wp-content/uploads/2012/12/shot_2012.12.02__time_19_36_n03.png)

... then press Enter to load that game state:

[![](http://the-witness.net/news/wp-content/uploads/2012/12/shot_2012.12.02__time_19_36_n04-512x288.png)](http://the-witness.net/news/wp-content/uploads/2012/12/shot_2012.12.02__time_19_36_n04.png)

It's very fast to use and it only took a few hours to program.

This whole system is also pretty cool because it's much more robust than the input-recording method. If I want to look into some detail that is super-nitpicky, I may need to use the same build of the game executable that the player used, but this will almost never be necessary. Usually I won't even need to use the in-game browser -- as I mentioned, I can just click through the thumbnails in Windows to get a basic sense of what's going on.

The fact that we only have discrete snapshots is sort of a side-bonus: because we only snapshot every minute or so, the data is not so creepy and spy-like; players can relax while they are playtesting and know that we won't later be obsessing over their every move.
